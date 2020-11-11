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

contract('StakingRewards', (accounts) => {
    let setup;
    let stakeAmount;
    let halfStake;
    let quarterStake
    let irregularStake;
    let irregularStake2;
    let tinyStake;
    let rewardAmount;
    let _initreward = (BigInt(925 * 100 * 1000000000000000000)).toString(); // "92500000000000003145728"
    let _starttime = 1600560000; // 2020-09-20 00:00:00 (UTC +00:00)
    let _durationDays = 7;
    let initTime;
    let _badReward;

    let oneWeekReward;
    let twoWeekReward;

    before('!! deploy setup', async () => {
        setup = await deploy(accounts);
    });
    context('multi-user simulation', async () => {
        before('!! deploy & initialize contract', async () => {
            await setup.tokens.primeToken.transfer(setup.incentives.stakingRewards.address, _initreward);
            await setup.incentives.stakingRewards.initialize(setup.tokens.primeToken.address, setup.balancer.pool.address, _initreward, _starttime, _durationDays);
        });
        context('# happypath: stake => getReward => exit', async () => {
            before('!! deploy setup', async () => {
                setup = await deploy(accounts);
                stakeAmount = toWei('100');
                halfStake = toWei('50');
                quarterStake = toWei('25');
                irregularStake = toWei('33');
                irregularStake2 = toWei('76');
                tinyStake = toWei('9');
            });
            context('» stake', async () => {
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
                    await setup.balancer.pool.transfer(accounts[9], quarterStake);
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, quarterStake, { from: accounts[9] });

                    await setup.tokens.primeToken.transfer(setup.incentives.stakingRewards.address, _initreward);
                    await setup.incentives.stakingRewards.initialize(setup.tokens.primeToken.address, setup.balancer.pool.address, _initreward, _starttime, _durationDays);
                });
                it('multiple users stake entire bPrime balance', async () => {
                    expect((await setup.incentives.stakingRewards.rewardPerTokenStored()).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(setup.incentives.stakingRewards.address)).toString()).to.equal(toWei('0'));

                    await setup.incentives.stakingRewards.stake(stakeAmount, { from: accounts[1] });
                    await setup.incentives.stakingRewards.stake(halfStake, { from: accounts[2] });
                    await setup.incentives.stakingRewards.stake(quarterStake, { from: accounts[3] });
                    await setup.incentives.stakingRewards.stake(irregularStake, { from: accounts[4] });
                    await setup.incentives.stakingRewards.stake(irregularStake2, { from: accounts[5] });
                    await setup.incentives.stakingRewards.stake(tinyStake, { from: accounts[6] });

                    await setup.incentives.stakingRewards.stake(stakeAmount, { from: accounts[7] });
                    await setup.incentives.stakingRewards.stake(halfStake, { from: accounts[8] });
                    await setup.incentives.stakingRewards.stake(quarterStake, { from: accounts[9] });
                });
                it('user & pool balances are correct', async () => {
                    expect((await setup.balancer.pool.balanceOf(setup.incentives.stakingRewards.address)).toString()).to.equal(toWei('468')); // 468 = total stakes provided

                    expect((await setup.balancer.pool.balanceOf(accounts[1])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[2])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[3])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[4])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[5])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[6])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[7])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[8])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[9])).toString()).to.equal('0');
                });
            });
            context('» getReward', async () => {
                it('users have earned different amounts of rewards', async () => {
                    await time.increase(time.duration.weeks(1));

                    let earned = BigInt(await setup.incentives.stakingRewards.earned(accounts[1]));
                    let earned2 = BigInt(await setup.incentives.stakingRewards.earned(accounts[2]));
                    let earned3 = BigInt(await setup.incentives.stakingRewards.earned(accounts[3]));
                    let earned5 = BigInt(await setup.incentives.stakingRewards.earned(accounts[5]));

                    if(earned > earned2 && earned2 > earned3 && earned2 < earned5 && earned > earned5){
                        /* do nothing & continue */
                    } else {
                        /* deliberate false condition to trigger failed test */
                        expect(earned).to.equal(BigInt(0));
                    }
                });
                it('users rewards are proportinal to their stake', async () => {
                    let earned = BigInt(await setup.incentives.stakingRewards.earned(accounts[1]));
                    let earned2 = BigInt(await setup.incentives.stakingRewards.earned(accounts[2]));
                    let earned3 = BigInt(await setup.incentives.stakingRewards.earned(accounts[3]));
                    let earned5 = BigInt(await setup.incentives.stakingRewards.earned(accounts[5])); //76

                    let halfReward = earned/BigInt(2);
                    let quarterReward = earned/BigInt(4);
                    let irregReward = (earned/BigInt(100) * BigInt(76));

                    expect(halfReward).to.equal(earned2);
                    expect(quarterReward).to.equal(earned3);
                    expect(irregReward).to.equal(earned5);
                });
                it('users 1 - 6 can claim their PRIME rewards whilst keeping tokens staked', async () => {
                    let earned = BigInt(await setup.incentives.stakingRewards.earned(accounts[1]));
                    await setup.incentives.stakingRewards.getReward( { from: accounts[1] } );
                    let balance = BigInt(await setup.tokens.primeToken.balanceOf(accounts[1]));
                    expect(earned).to.equal(balance);
                    expect((await setup.incentives.stakingRewards.earned(accounts[1])).toString()).to.equal('0');

                    earned = BigInt(await setup.incentives.stakingRewards.earned(accounts[2]));
                    await setup.incentives.stakingRewards.getReward( { from: accounts[2] } );
                    balance = BigInt(await setup.tokens.primeToken.balanceOf(accounts[2]));
                    expect(earned).to.equal(balance);
                    expect((await setup.incentives.stakingRewards.earned(accounts[2])).toString()).to.equal('0');

                    earned = BigInt(await setup.incentives.stakingRewards.earned(accounts[3]));
                    await setup.incentives.stakingRewards.getReward( { from: accounts[3] } );
                    balance = BigInt(await setup.tokens.primeToken.balanceOf(accounts[3]));
                    expect(earned).to.equal(balance);

                    earned = BigInt(await setup.incentives.stakingRewards.earned(accounts[4]));
                    await setup.incentives.stakingRewards.getReward( { from: accounts[4] } );
                    balance = BigInt(await setup.tokens.primeToken.balanceOf(accounts[4]));
                    expect(earned).to.equal(balance);

                    earned = BigInt(await setup.incentives.stakingRewards.earned(accounts[5]));
                    await setup.incentives.stakingRewards.getReward( { from: accounts[5] } );
                    balance = BigInt(await setup.tokens.primeToken.balanceOf(accounts[5]));
                    expect(earned).to.equal(balance);

                    earned = BigInt(await setup.incentives.stakingRewards.earned(accounts[6]));
                    await setup.incentives.stakingRewards.getReward( { from: accounts[6] } );
                    balance = BigInt(await setup.tokens.primeToken.balanceOf(accounts[6]));
                    expect(earned).to.equal(balance);
                });
                it('user and contract bPRIME balances are correct', async () => {
                    expect((await setup.balancer.pool.balanceOf(accounts[1])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[2])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[3])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[4])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[5])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[6])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[7])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[8])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(accounts[9])).toString()).to.equal('0');
                    expect((await setup.balancer.pool.balanceOf(setup.incentives.stakingRewards.address)).toString()).to.equal(toWei('468')); // 468 = total stakes provided
                });
                it('reduction in stakingRewards prime balance == total reward payout amount', async () => {
                    let remainingPrimeBalance = BigInt(await setup.tokens.primeToken.balanceOf(setup.incentives.stakingRewards.address));

                    let bal1 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[1]));
                    let bal2 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[2]));
                    let bal3 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[3]));
                    let bal4 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[4]));
                    let bal5 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[5]));
                    let bal6 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[6]));

                    let payout = BigInt(bal1 + bal2 + bal3 + bal4 + bal5 + bal6);
                    let expectedPayout = (BigInt(_initreward) - BigInt(remainingPrimeBalance));
                    expect(expectedPayout).to.equal(await BigInt(payout));
                });
            });
            context('» exit', () => {
                before('!! fastforward', async () => {
                    await time.increase(time.duration.weeks(1));
                });
                it('users 7 - 9 exit with correct bPrime balances', async () => {
                    await setup.incentives.stakingRewards.exit( {from: accounts[7]} );
                    let bPrimeBalance7 = (await setup.balancer.pool.balanceOf(accounts[7])).toString();
                    expect(bPrimeBalance7).to.equal(stakeAmount);

                    await setup.incentives.stakingRewards.exit( {from: accounts[8]} );
                    let bPrimeBalance8 = (await setup.balancer.pool.balanceOf(accounts[8])).toString();
                    expect(bPrimeBalance8).to.equal(halfStake);

                    await setup.incentives.stakingRewards.exit( {from: accounts[9]} );
                    let bPrimeBalance9 = (await setup.balancer.pool.balanceOf(accounts[9])).toString();
                    expect(bPrimeBalance9).to.equal(quarterStake);
                });
                it('Contract bPRIME balance is correct', async () => {
                    expect((await setup.balancer.pool.balanceOf(setup.incentives.stakingRewards.address)).toString()).to.equal(toWei('293')); // 468 - 175
                });
                it('reduction in stakingRewards prime balance == total reward payout amount', async () => {
                    let remainingPrimeBalance = BigInt(await setup.tokens.primeToken.balanceOf(setup.incentives.stakingRewards.address));

                    let bal1 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[1]));
                    let bal2 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[2]));
                    let bal3 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[3]));
                    let bal4 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[4]));
                    let bal5 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[5]));
                    let bal6 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[6]));
                    let bal7 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[7]));
                    let bal8 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[8]));
                    let bal9 = BigInt(await setup.tokens.primeToken.balanceOf(accounts[9]));

                    let payout = BigInt(bal1 + bal2 + bal3 + bal4 + bal5 + bal6 + bal7 + bal8 + bal9);
                    let expectedPayout = (BigInt(_initreward) - BigInt(remainingPrimeBalance));
                    expect(expectedPayout).to.equal(await BigInt(payout));
                });
            });
        });
    });
});
