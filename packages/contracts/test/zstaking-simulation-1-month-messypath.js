/*global artifacts, web3, contract, before, it, context*/
/*eslint no-undef: "error"*/

const { expect } = require('chai');
const { constants, time, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const helpers = require('./helpers');
const StakingRewards = artifacts.require('StakingRewards');


const { toWei } = web3.utils;

const deploy = async (accounts) => {
    // initialize test setup
    const setup = await helpers.setup.initialize(accounts[0]);
    // deploy ERC20s
    setup.tokens = await helpers.setup.tokens(setup);
    // deploy DAOStack meta-contracts
    setup.DAOStack = await helpers.setup.DAOStack(setup);
    // deploy organization
    setup.organization = await helpers.setup.organization(setup);
    // deploy balancer infrastructure
    setup.balancer = await helpers.setup.balancer(setup);
    // deploy token4rep
    setup.token4rep = await helpers.setup.token4rep(setup);
    // deploy incentives contract
    setup.incentives = await helpers.setup.incentives(setup);
    // deploy primeDAO governance
    setup.primeDAO = await helpers.setup.primeDAO(setup);

    return setup;
};

contract('Staking: 1 month messypath', (accounts) => {
    let setup;
    let stakeAmount;
    let halfStake;
    let quarterStake;
    let irregularStake;
    let irregularStake2;
    let tinyStake;
    let _initreward = (BigInt(925 * 100 * 1000000000000000000)).toString(); // "92500000000000003145728"
    // let _starttime = 1600560000; // 2020-09-20 00:00:00 (UTC +00:00)
    let _starttime;
    let _durationDays = 28;

    before('!! deploy setup', async () => {
        setup = await deploy(accounts);
    });
    context('# multi-user simulation: one month DURATION', () => {
        context('early stake => early exit => late stake => late exit', () => {
            before('!! deploy setup', async () => {
                setup = await deploy(accounts);
                stakeAmount = toWei('100');
                halfStake = toWei('50');
                quarterStake = toWei('25');
                irregularStake = toWei('33');
                irregularStake2 = toWei('76');
                tinyStake = toWei('9');

                _starttime = await time.latest();
            });
            context('» week 1: stake', () => {
                before('!! fund users + fund & initialize contract', async () => {
                    /* different amounts */
                    await setup.balancer.pool.transfer(accounts[1], stakeAmount);
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, stakeAmount, { from: accounts[1] });
                    await setup.balancer.pool.transfer(accounts[2], halfStake);
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, halfStake, { from: accounts[2] });
                    await setup.balancer.pool.transfer(accounts[3], quarterStake);
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, quarterStake, { from: accounts[3] });
                    await setup.balancer.pool.transfer(accounts[4], irregularStake);
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, irregularStake, { from: accounts[4] });
                    await setup.balancer.pool.transfer(accounts[5], irregularStake2);
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, irregularStake2, { from: accounts[5] });
                    await setup.balancer.pool.transfer(accounts[6], tinyStake);
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, tinyStake, { from: accounts[6] });

                    /* amount doubles */
                    await setup.balancer.pool.transfer(accounts[7], stakeAmount);
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, stakeAmount, { from: accounts[7] });
                    await setup.balancer.pool.transfer(accounts[8], halfStake);
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, halfStake, { from: accounts[8] });

                    /* account for checking reward after period == almost nothing */
                    await setup.balancer.pool.transfer(accounts[9], quarterStake);
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, quarterStake, { from: accounts[9] });

                    await setup.tokens.primeToken.transfer(setup.incentives.stakingRewards.address, _initreward);
                    await setup.incentives.stakingRewards.initialize(setup.tokens.primeToken.address, setup.balancer.pool.address, _initreward, _starttime, _durationDays);
                });
                it('multiple users stake entire bPrime balance over one week', async () => {
                    expect((await setup.incentives.stakingRewards.rewardPerTokenStored()).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(setup.incentives.stakingRewards.address)).toString()).to.equal(toWei('0'));

                    await setup.incentives.stakingRewards.stake(stakeAmount, { from: accounts[1] });
                    await setup.incentives.stakingRewards.stake(halfStake, { from: accounts[2] });

                    await time.increase(time.duration.days(1));

                    await setup.incentives.stakingRewards.stake(quarterStake, { from: accounts[3] });

                    await time.increase(time.duration.days(2));

                    await setup.incentives.stakingRewards.stake(irregularStake, { from: accounts[4] });
                    await setup.incentives.stakingRewards.stake(irregularStake2, { from: accounts[5] });
                    await setup.incentives.stakingRewards.stake(tinyStake, { from: accounts[6] });

                    await time.increase(time.duration.days(4)); // -> day7

                    await setup.incentives.stakingRewards.stake(stakeAmount, { from: accounts[7] });
                    await setup.incentives.stakingRewards.stake(halfStake, { from: accounts[8] });
                });
                it('user & pool balances are correct', async () => {
                    expect((await setup.balancer.pool.balanceOf(setup.incentives.stakingRewards.address)).toString()).to.equal(toWei('443')); // 468 - 25

                    expect((await setup.balancer.pool.balanceOf(accounts[1])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[2])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[3])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[4])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[5])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[6])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[7])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[8])).toString()).to.equal('0');
                });
            });
            context('» end of week 2: early exit', async () => {
                it('users exit with correct bPrime balances', async () => {

                    await time.increase(time.duration.days(7)); // -> day14

                    await setup.incentives.stakingRewards.exit( {from: accounts[1]} );
                    let bPrimeBalance1 = (await setup.balancer.pool.balanceOf(accounts[1])).toString();
                    expect(bPrimeBalance1).to.equal(stakeAmount);

                    await setup.incentives.stakingRewards.exit( {from: accounts[2]} );
                    let bPrimeBalance2 = (await setup.balancer.pool.balanceOf(accounts[2])).toString();
                    expect(bPrimeBalance2).to.equal(halfStake);

                    await setup.incentives.stakingRewards.exit( {from: accounts[3]} );
                    let bPrimeBalance3 = (await setup.balancer.pool.balanceOf(accounts[3])).toString();
                    expect(bPrimeBalance3).to.equal(quarterStake);

                    await setup.incentives.stakingRewards.exit( {from: accounts[4]} );
                    let bPrimeBalance4 = (await setup.balancer.pool.balanceOf(accounts[4])).toString();
                    expect(bPrimeBalance4).to.equal(irregularStake);

                    await setup.incentives.stakingRewards.exit( {from: accounts[5]} );
                    let bPrimeBalance5 = (await setup.balancer.pool.balanceOf(accounts[5])).toString();
                    expect(bPrimeBalance5).to.equal(irregularStake2);

                    await setup.incentives.stakingRewards.exit( {from: accounts[6]} );
                    let bPrimeBalance6 = (await setup.balancer.pool.balanceOf(accounts[6])).toString();
                    expect(bPrimeBalance6).to.equal(tinyStake);

                    await setup.incentives.stakingRewards.exit( {from: accounts[7]} );
                    let bPrimeBalance7 = (await setup.balancer.pool.balanceOf(accounts[7])).toString();
                    expect(bPrimeBalance7).to.equal(stakeAmount);

                    await setup.incentives.stakingRewards.exit( {from: accounts[8]} );
                    let bPrimeBalance8 = (await setup.balancer.pool.balanceOf(accounts[8])).toString();
                    expect(bPrimeBalance8).to.equal(halfStake);

                });
                it('Contract bPRIME balance == 0', async () => {
                    expect((await setup.balancer.pool.balanceOf(setup.incentives.stakingRewards.address)).toString()).to.equal('0'); // all stake removed
                });
                it('reduction in stakingRewards prime balance == ~total reward payout amount', async () => {
                    // let remainingPrimeBalance = BigInt(await setup.tokens.primeToken.balanceOf(setup.incentives.stakingRewards.address));
                    let remainingPrimeBalance = (await setup.tokens.primeToken.balanceOf(setup.incentives.stakingRewards.address)).toString();

                    console.log('            Prime balance of StakingRewards contract: ' + remainingPrimeBalance);

                    // let bal1 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[1]));
                    // let bal2 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[2]));
                    // let bal3 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[3]));
                    // let bal4 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[4]));
                    // let bal5 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[5]));
                    // let bal6 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[6]));
                    // let bal7 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[7]));
                    // let bal8 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[8]));
                    //
                    // let payout = BigInt(bal1 + bal2 + bal3 + bal4 + bal5 + bal6 + bal7 + bal8);
                    // let expectedPayout = (BigInt(_initreward) - remainingPrimeBalance);
                    // expect((expectedPayout).toString()).to.equal((payout).toString());
                });
            });
            context('» start of week 3: some accounts stake again', async () => {
                before('!! reapprove transfer', async () => {
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, stakeAmount, { from: accounts[7] });
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, halfStake, { from: accounts[8] });
                });
                it('stake again', async () => {
                    await time.increase(time.duration.days(1)); // -> day15

                    await setup.incentives.stakingRewards.stake(stakeAmount, { from: accounts[7] });
                    await setup.incentives.stakingRewards.stake(halfStake, { from: accounts[8] });
                });
                it('contract and user bPrime balances are correct', async () => {
                    expect((await setup.balancer.pool.balanceOf(accounts[7])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[8])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(setup.incentives.stakingRewards.address)).toString()).to.equal(toWei('150'));
                });
            });
            context('» end of week 3: accounts getRewards()', async () => {
                it('users 7 & 8 get week of staking rewards: PRIME balances are correct', async () => {
                    await time.increase(time.duration.days(6)); // -> day21

                    let currentPrimeBalance7 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[7]));
                    let earned7 = BigInt(await setup.incentives.stakingRewards.earned(accounts[7]));
                    await setup.incentives.stakingRewards.getReward( { from: accounts[7] } );
                    let balance7 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[7]));
                    let earnedPlusPrev7 = currentPrimeBalance7 + earned7;
                    expect(earnedPlusPrev7).to.equal(balance7);

                    let currentPrimeBalance8 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[8]));
                    let earned8 = BigInt(await setup.incentives.stakingRewards.earned(accounts[8]));
                    await setup.incentives.stakingRewards.getReward( { from: accounts[8] } );
                    let balance8 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[8]));
                    let earnedPlusPrev8 = currentPrimeBalance8 + earned8;
                    expect(earnedPlusPrev8).to.equal(balance8);
                });
            });
            // more checks
            context('» start of week 4: more accounts stake again', async () => {
                before('!! reapprove transfer', async () => {
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, stakeAmount, { from: accounts[1] });
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, halfStake, { from: accounts[2] });
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, quarterStake, { from: accounts[3] });
                });
                it('stake again', async () => {
                    // await time.increase(time.duration.days(2)); // -> day23
                    await time.increase(time.duration.weeks(2));

                    await setup.incentives.stakingRewards.stake(stakeAmount, { from: accounts[1] });
                    await setup.incentives.stakingRewards.stake(halfStake, { from: accounts[2] });
                    await setup.incentives.stakingRewards.stake(quarterStake, { from: accounts[3] });
                });
                it('contract and user bPrime balances are correct', async () => {
                    expect((await setup.balancer.pool.balanceOf(accounts[1])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[2])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[3])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(setup.incentives.stakingRewards.address)).toString()).to.equal(toWei('325'));
                });
            });
            context('» end of week 4: accounts exit', async () => {
                it('all users exit with correct bPrime balances', async () => {
                    // await time.increase(time.duration.days(6)); //day29
                    await time.increase(time.duration.weeks(6));

                    await setup.incentives.stakingRewards.exit( {from: accounts[1]} );
                    let bPrimeBalance1 = (await setup.balancer.pool.balanceOf(accounts[1])).toString();
                    expect(bPrimeBalance1).to.equal(stakeAmount);

                    await setup.incentives.stakingRewards.exit( {from: accounts[2]} );
                    let bPrimeBalance2 = (await setup.balancer.pool.balanceOf(accounts[2])).toString();
                    expect(bPrimeBalance2).to.equal(halfStake);

                    await setup.incentives.stakingRewards.exit( {from: accounts[3]} );
                    let bPrimeBalance3 = (await setup.balancer.pool.balanceOf(accounts[3])).toString();
                    expect(bPrimeBalance3).to.equal(quarterStake);

                    await setup.incentives.stakingRewards.exit( {from: accounts[7]} );
                    let bPrimeBalance7 = (await setup.balancer.pool.balanceOf(accounts[7])).toString();
                    expect(bPrimeBalance7).to.equal(stakeAmount);

                    await setup.incentives.stakingRewards.exit( {from: accounts[8]} );
                    let bPrimeBalance8 = (await setup.balancer.pool.balanceOf(accounts[8])).toString();
                    expect(bPrimeBalance8).to.equal(halfStake);
                });
                it('Contract bPRIME balance == 0', async () => {
                    expect((await setup.balancer.pool.balanceOf(setup.incentives.stakingRewards.address)).toString()).to.equal('0'); // all stake removed
                });
                it('reduction in stakingRewards prime balance == ~total reward payout amount', async () => {
                    let remainingPrimeBalance = BigInt(await setup.tokens.primeToken.balanceOf(setup.incentives.stakingRewards.address));

                    console.log('            remainingPrimeBalance: ' + remainingPrimeBalance.toString());

                    let bal1 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[1]));
                    let bal2 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[2]));
                    let bal3 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[3]));
                    let bal4 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[4]));
                    let bal5 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[5]));
                    let bal6 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[6]));
                    let bal7 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[7]));
                    let bal8 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[8]));

                    let payout = BigInt(bal1 + bal2 + bal3 + bal4 + bal5 + bal6 + bal7 + bal8);
                    let expectedPayout = (BigInt(_initreward) - remainingPrimeBalance);
                    expect((expectedPayout).toString()).to.equal((payout).toString());
                });
            });
        });
    });

}); // end Contract
