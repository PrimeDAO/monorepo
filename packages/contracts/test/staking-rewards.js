/*global artifacts, web3, contract, before, it, context*/
/*eslint no-undef: "error"*/

const { expect } = require('chai');
const { constants, time, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const helpers = require('./helpers');
const BPool = artifacts.require('BPool');
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
    // deploy proxy
    setup.proxy = await helpers.setup.proxy(setup);
    // deploy token4rep
    setup.token4rep = await helpers.setup.token4rep(setup);
    // deploy generic scheme
    setup.scheme = await helpers.setup.scheme(setup);
    // deploy incentives contract
    setup.incentives = await helpers.setup.incentives(setup);

    return setup;
};

contract('StakingRewards', (accounts) => {
    let stakeAmount;
    let halfStake;
    let blockNumber;
    let rewardAmount;

    before('!! deploy setup', async () => {
        setup = await deploy(accounts);
    });
    context('» contract is not initialized yet', () => {
        context('» parameters are valid', () => {
            // contract has already been initialized during setup
            it('it initializes contract', async () => {
            	await setup.incentives.stakingRewards.initialize(setup.tokens.primeToken.address, setup.balancer.pool.address, accounts[0]);
            });
        });
        context('» token parameter is not valid', () => {
            before('!! deploy contract', async () => {
                setup.data.incentives = await StakingRewards.new();
            });
            it('it reverts', async () => {
                await expectRevert(setup.data.incentives.initialize(constants.ZERO_ADDRESS, setup.balancer.pool.address, accounts[0]), 'StakingRewards: rewardToken cannot be null');
            });
        });
    });
    context('» contract is already initialized', () => {
        // contract has already been initialized during setup
        it('it reverts', async () => {
            await expectRevert(setup.incentives.stakingRewards.initialize(setup.tokens.primeToken.address, setup.balancer.pool.address, accounts[0]), 'StakingRewards: contract already initialized');
        });
    });
    context('# stake', () => {
        context('» generics', () => {
            before('!! deploy setup', async () => {
                setup = await deploy(accounts);
                stakeAmount = toWei('100');
            });
            context('» contract is not initialized', () => {
                before('!! deploy contract', async () => {
                    setup.data.incentives = await StakingRewards.new();
                });
                it('it reverts', async () => {
                    await expectRevert(
                        setup.data.incentives.stake(stakeAmount),
                        'StakingRewards: contract not initialized'
                    );
                });
            });
            context('» stake parameter is not valid', () => {
                before('!! initialize contract', async () => {
	            	    await setup.incentives.stakingRewards.initialize(setup.tokens.primeToken.address, setup.balancer.pool.address, accounts[0]);
                });
                it('it reverts', async () => {
                    await expectRevert(
                        setup.incentives.stakingRewards.stake(toWei('0')),
                        'StakingRewards: cannot stake 0'
                    );
                });
            });
            context('» stake parameter is valid: stakes tokens', () => {
                before('!! fund accounts', async () => {
                    await setup.balancer.pool.transfer(accounts[1], stakeAmount);
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, stakeAmount, { from: accounts[1] });
                    expect((await setup.balancer.pool.balanceOf(setup.incentives.stakingRewards.address)).toString()).to.equal(toWei('0'));
                    expect((await setup.balancer.pool.balanceOf(accounts[1])).toString()).to.equal(stakeAmount);
                });
                it('stakes', async () => {
                    let tx = await setup.incentives.stakingRewards.stake(stakeAmount, { from: accounts[1] });
                    setup.data.tx = tx;
                    await expectEvent.inTransaction(setup.data.tx.tx, setup.incentives.stakingRewards, 'Staked'); //tx # , contract, event (as string)
                    expect((await setup.balancer.pool.balanceOf(setup.incentives.stakingRewards.address)).toString()).to.equal(stakeAmount);
                    expect((await setup.balancer.pool.balanceOf(accounts[1])).toString()).to.equal(toWei('0'));
                });
            });
        });
    });
    context('# withdraw', () => {
        context('» generics', () => {
            before('!! deploy setup', async () => {
                setup = await deploy(accounts);
                stakeAmount = toWei('100');
                halfStake = toWei('50');
            });
            context('» contract is not initialized', () => {
                before('!! deploy contract', async () => {
                    setup.data.incentives = await StakingRewards.new();
                });
                it('it reverts', async () => {
                    await expectRevert(
                        setup.data.incentives.stake(stakeAmount),
                        'StakingRewards: contract not initialized'
                    );
                });
            });
            context('» withdraw parameter is not valid: too low', () => {
                before('!! initialize contract', async () => {
                    await setup.incentives.stakingRewards.initialize(setup.tokens.primeToken.address, setup.balancer.pool.address, accounts[0]);
                });
                it('it reverts', async () => {
                    await expectRevert(
                        setup.incentives.stakingRewards.withdraw(toWei('0')),
                        'StakingRewards: Cannot withdraw 0'
                    );
                });
            });
            context('» withdraw parameter is valid: withdraws entire stake', () => {
                before('!! fund accounts and stake', async () => {
                    await setup.balancer.pool.transfer(accounts[1], stakeAmount);
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, stakeAmount, { from: accounts[1] });
                    await setup.incentives.stakingRewards.stake(stakeAmount, { from: accounts[1] });
                });
                it('withdraws', async () => {
                    expect((await setup.balancer.pool.balanceOf(setup.incentives.stakingRewards.address)).toString()).to.equal(stakeAmount);
                    let tx = await setup.incentives.stakingRewards.withdraw(stakeAmount, { from: accounts[1] });
                    setup.data.tx = tx;
                    await expectEvent.inTransaction(setup.data.tx.tx, setup.incentives.stakingRewards, 'Withdrawn');
                    expect((await setup.balancer.pool.balanceOf(accounts[1])).toString()).to.equal(stakeAmount);
                    expect((await setup.balancer.pool.balanceOf(setup.incentives.stakingRewards.address)).toString()).to.equal(toWei('0'));
                });
            });
            context('» withdraw parameter is valid: withdraws some of stake', () => {
                before('!! repopulate account and stake', async () => {
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, stakeAmount, { from: accounts[1] });
                    await setup.incentives.stakingRewards.stake(stakeAmount, { from: accounts[1] });
                });
                it('withdraws', async () => {
                    let tx = await setup.incentives.stakingRewards.withdraw(halfStake, { from: accounts[1] });
                    setup.data.tx = tx;
                    await expectEvent.inTransaction(setup.data.tx.tx, setup.incentives.stakingRewards, 'Withdrawn');
                    expect((await setup.balancer.pool.balanceOf(setup.incentives.stakingRewards.address)).toString()).to.equal(halfStake);
                    expect((await setup.balancer.pool.balanceOf(accounts[1])).toString()).to.equal(halfStake);
                });
            });
        });
    });
    context('# getReward', () => {
        context('» generics', () => {
            before('!! deploy setup', async () => {
                setup = await deploy(accounts);
                stakeAmount = toWei('100');
                rewardAmount = toWei('100');
            });
            context('» contract is not initialized', () => {
                before('!! deploy contract', async () => {
                    setup.data.incentives = await StakingRewards.new();
                });
                it('it reverts', async () => {
                    await expectRevert(
                        setup.data.incentives.getReward( { from: accounts[1] }),
                        'StakingRewards: contract not initialized'
                    );
                });
            });
            context('» getReward param valid: rewards 0', async () => {
                before('!! initialize contract', async () => {
                    await setup.incentives.stakingRewards.initialize(setup.tokens.primeToken.address, setup.balancer.pool.address, accounts[0]);
                });
                it('rewards 0', async () => {
                    expect((await setup.incentives.stakingRewards.earned(accounts[1])).toString()).to.equal(toWei('0'));
                    await setup.incentives.stakingRewards.getReward( { from: accounts[1]} );
                    expect((await setup.incentives.stakingRewards.earned(accounts[1])).toString()).to.equal(toWei('0'));
                });
            });
            context('» getReward param valid: rewards', async () => {
                before('!! fund accounts', async () => {
                    await setup.balancer.pool.transfer(accounts[1], stakeAmount);
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, stakeAmount, { from: accounts[1] });
                    expect((await setup.balancer.pool.balanceOf(accounts[1])).toString()).to.equal(stakeAmount);

                    await setup.tokens.primeToken.transfer(setup.incentives.stakingRewards.address, rewardAmount);
                    expect((await setup.tokens.primeToken.balanceOf(setup.incentives.stakingRewards.address)).toString()).to.equal(rewardAmount);
                    await setup.tokens.primeToken.approve(accounts[1], rewardAmount);
                });
                it('rewards after time period', async () => {
                    /* not staked - no reward earned */
                    expect((await setup.incentives.stakingRewards.earned(accounts[1])).toString()).to.equal(toWei('0'));
                    await setup.incentives.stakingRewards.notifyRewardAmount(rewardAmount);
                    /* stake */
                    await setup.incentives.stakingRewards.stake(stakeAmount, { from: accounts[1] });
                    /* fast-forward 1 week */
                    await time.increase(time.duration.weeks(1));
                    let earned = BigInt(await setup.incentives.stakingRewards.earned(accounts[1]));
                    let tx = await setup.incentives.stakingRewards.getReward( { from: accounts[1] } );
                    setup.data.tx = tx;
                    await expectEvent.inTransaction(setup.data.tx.tx, setup.incentives.stakingRewards, 'RewardPaid');
                    let balance = BigInt(await setup.tokens.primeToken.balanceOf(accounts[1]));
                    expect(earned).to.equal(balance);
                });
            });
        });
    });
    context('# exit', async () => {
        context('» generics', () => {
            before('!! deploy setup', async () => {
                setup = await deploy(accounts);
                stakeAmount = toWei('100');
                halfStake = toWei('50');
                rewardAmount = toWei('100');
            });
            context('» contract is not initialized', () => {
                before('!! deploy contract', async () => {
                    setup.data.incentives = await StakingRewards.new();
                });
                it('it reverts', async () => {
                    await expectRevert(
                        setup.data.incentives.exit(),
                        'StakingRewards: contract not initialized'
                    );
                });
            });
            context(' cannot exit with 0', async () => {
                before('!! initialize contract', async () => {
                    await setup.incentives.stakingRewards.initialize(setup.tokens.primeToken.address, setup.balancer.pool.address, accounts[0]);
                });
                it('cannot exit with no funds', async () => {
                    await expectRevert(
                        setup.incentives.stakingRewards.exit( {from: accounts[1] }),
                        'StakingRewards: Cannot withdraw 0.'
                    );
                });
            });
            context('» it exits successfully', () => {
                before('!! fund accounts and stake', async () => {
                    await setup.balancer.pool.transfer(accounts[1], stakeAmount);
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, stakeAmount, { from: accounts[1] });
                    await setup.incentives.stakingRewards.stake(stakeAmount, { from: accounts[1] });
                });
                it('exits successfully where reward is 0', async () => {
                    let tx = await setup.incentives.stakingRewards.exit( {from: accounts[1] });
                    setup.data.tx = tx;
                    await expectEvent.inTransaction(setup.data.tx.tx, setup.incentives.stakingRewards, 'Withdrawn');
                    expect((await setup.balancer.pool.balanceOf(setup.incentives.stakingRewards.address)).toString()).to.equal(toWei('0'));
                    expect((await setup.balancer.pool.balanceOf(accounts[1])).toString()).to.equal(stakeAmount);
                });
                it('exits successfully where reward is > 0', async () => {
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, stakeAmount, { from: accounts[1] });
                    await setup.tokens.primeToken.transfer(setup.incentives.stakingRewards.address, rewardAmount);
                    await setup.tokens.primeToken.approve(accounts[1], rewardAmount);

                    await setup.incentives.stakingRewards.notifyRewardAmount(rewardAmount);

                    await setup.incentives.stakingRewards.stake(stakeAmount, { from: accounts[1] });
                    await time.increase(time.duration.weeks(1));

                    let rewardEarned = BigInt(await setup.incentives.stakingRewards.earned(accounts[1]));
                    let tx = await setup.incentives.stakingRewards.exit( {from: accounts[1] });
                    setup.data.tx = tx;
                    await expectEvent.inTransaction(setup.data.tx.tx, setup.incentives.stakingRewards, 'Withdrawn');
                    await expectEvent.inTransaction(setup.data.tx.tx, setup.incentives.stakingRewards, 'RewardPaid');
                    let balance = BigInt(await setup.tokens.primeToken.balanceOf(accounts[1]));
                    expect(rewardEarned).to.equal(balance);
                    expect((await setup.balancer.pool.balanceOf(setup.incentives.stakingRewards.address)).toString()).to.equal(toWei('0'));
                    expect((await setup.balancer.pool.balanceOf(accounts[1])).toString()).to.equal(stakeAmount);
                });
            });
        });
    });
    context('# rescueTokens', async () => {
        context('» generics', () => {
            before('!! deploy setup', async () => {
                setup = await deploy(accounts);
                stakeAmount = toWei('100');
                rewardAmount = toWei('100');
            });
            context('» contract is not initialized', () => {
                before('!! deploy contract', async () => {
                    setup.data.incentives = await StakingRewards.new();
                });
                it('it reverts', async () => {
                    await expectRevert(
                        setup.data.incentives.rescueTokens(setup.tokens.erc20s[0].address, stakeAmount, accounts[1]),
                        'StakingRewards: contract not initialized'
                    );
                });
            });
            context('» rescueTokens token parameter is not valid: governance', () => {
                before('!! initialize contract', async () => {
                    await setup.incentives.stakingRewards.initialize(setup.tokens.primeToken.address, setup.balancer.pool.address, accounts[0]);
                });
                it('it reverts', async () => {
                    await expectRevert(
                        setup.incentives.stakingRewards.rescueTokens(setup.tokens.erc20s[0].address, stakeAmount, accounts[1], { from: accounts[1]} ),
                        'StakingRewards: !governance'
                    );
                });
            });
            context('» rescueTokens token parameter is not valid: rewardToken', () => {
                it('it reverts', async () => {
                    await expectRevert(
                        setup.incentives.stakingRewards.rescueTokens(setup.tokens.primeToken.address, stakeAmount, accounts[1]),
                        'StakingRewards: rewardToken'
                    );
                });
            });
            context('» rescueTokens token parameter is not valid: stakingToken', () => {
                it('it reverts', async () => {
                    await expectRevert(
                        setup.incentives.stakingRewards.rescueTokens(setup.balancer.pool.address, stakeAmount, accounts[1]),
                        'StakingRewards: stakingToken'
                    );
                });
            });
            context('» rescueTokens valid: rescues tokens', () => {
                before('!! fund contracts', async () => {
                    await setup.tokens.erc20s[0].transfer(setup.incentives.stakingRewards.address, stakeAmount);
                });
                it('rescues', async () => {
                    await setup.incentives.stakingRewards.rescueTokens(setup.tokens.erc20s[0].address, stakeAmount, accounts[1]);
                    expect((await setup.tokens.erc20s[0].balanceOf(setup.incentives.stakingRewards.address)).toString()).to.equal(toWei('0'));
                    expect((await setup.tokens.erc20s[0].balanceOf(accounts[1])).toString()).to.equal(stakeAmount);
                });
            });
        });
    });
    context('# lastTimeRewardApplicable', async () => {
        context('» generics', () => {
            before('!! deploy setup', async () => {
                setup = await deploy(accounts);
                stakeAmount = toWei('100');
                rewardAmount = toWei('100');
            });
            context('» periodFinish is 0 on deployment', async () => {
                before('!! initialize contract', async () => {
                    await setup.incentives.stakingRewards.initialize(setup.tokens.primeToken.address, setup.balancer.pool.address, accounts[0]);
                });
                it('returns 0', async () => {
                    let periodFinish = (await setup.incentives.stakingRewards.periodFinish()).toString();
                    let lastTimeRewardApplicable = (await setup.incentives.stakingRewards.lastTimeRewardApplicable()).toString();
                    expect(periodFinish).to.equal(lastTimeRewardApplicable);
                });
            });
            context('» periodFinish == notifyRewardAmount + 1 week', async () => {
                before('!! notify reward amount', async () => {
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, stakeAmount, { from: accounts[1] });
                    await setup.tokens.primeToken.transfer(setup.incentives.stakingRewards.address, rewardAmount);
                    await setup.tokens.primeToken.approve(accounts[1], rewardAmount);
                    await setup.incentives.stakingRewards.notifyRewardAmount(rewardAmount);
                });
                it('returns correct finish', async () => {
                    let periodFinish = (await setup.incentives.stakingRewards.periodFinish()).toString();
                    await time.increase(time.duration.weeks(1));
                    let blockNow = (await time.latest()).toString();
                    expect(blockNow).to.equal(periodFinish);
                });
            });
        });
    });
    context('# notifyRewardAmount', async () => {
        context('» generics', () => {
            before('!! deploy setup', async () => {
                setup = await deploy(accounts);
                stakeAmount = toWei('100');
                rewardAmount = toWei('100');
            });
            context('» reverts when balanceOf reward tokens == 0', async () => {
                before('!! initialize contract', async () => {
                    await setup.incentives.stakingRewards.initialize(setup.tokens.primeToken.address, setup.balancer.pool.address, accounts[0]);
                });
                it('reverts', async () => {
                    await expectRevert(
                        setup.incentives.stakingRewards.notifyRewardAmount(rewardAmount),
                        'StakingRewards: Provided reward too high'
                    );
                });
            });
            context('» updates reward', async () => {
                it('updates', async () => {
                    await setup.balancer.pool.approve(setup.incentives.stakingRewards.address, stakeAmount, { from: accounts[1] });
                    await setup.tokens.primeToken.transfer(setup.incentives.stakingRewards.address, rewardAmount);
                    await setup.tokens.primeToken.approve(accounts[1], rewardAmount);

                    let tx = await setup.incentives.stakingRewards.notifyRewardAmount(rewardAmount);
                    setup.data.tx = tx;
                    await expectEvent.inTransaction(setup.data.tx.tx, setup.incentives.stakingRewards, 'RewardAdded');
                });
            });
        });
    });
});
