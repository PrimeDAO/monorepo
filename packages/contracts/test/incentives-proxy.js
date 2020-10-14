/*global artifacts, web3, contract, before, it, context*/
/*eslint no-undef: "error"*/

const { expect } = require('chai');
const { constants, time, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const helpers = require('./helpers');
const BPool = artifacts.require('BPool');
const IncentivesProxy = artifacts.require('IncentivesProxy');


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
    // deploy generic scheme
    setup.scheme = await helpers.setup.scheme(setup);
    // deploy incentives proxy
    setup.incentives = await helpers.setup.incentives(setup);

    return setup;
};

contract('IncentivesProxy', (accounts) => {
    let stakeAmount;
    let halfStake;

    before('!! deploy setup', async () => {
        setup = await deploy(accounts);
    });
    context('» proxy is not initialized yet', () => {
        context('» parameters are valid', () => {
            // proxy has already been initialized during setup
            it('it initializes proxy', async () => {
            	await setup.incentives.incentivesProxy.initialize(setup.tokens.primeToken.address, setup.balancer.pool.address);
            });
        });
        context('» token parameter is not valid', () => {
            before('!! deploy proxy', async () => {
                setup.data.incentives = await IncentivesProxy.new();
            });
            it('it reverts', async () => {
                await expectRevert(setup.data.incentives.initialize(constants.ZERO_ADDRESS, setup.balancer.pool.address), 'IncentivesProxy: rewardToken cannot be null');
            });
        });
    });
    context('» proxy is already initialized', () => {
        // proxy has already been initialized during setup
        it('it reverts', async () => {
            await expectRevert(setup.incentives.incentivesProxy.initialize(setup.tokens.primeToken.address, setup.balancer.pool.address), 'IncentivesProxy: proxy already initialized');
        });
    });
    context('# stake', () => {
        context('» generics', () => {
            before('!! deploy setup', async () => {
                setup = await deploy(accounts);
                stakeAmount = toWei('100');
            });
            context('» proxy is not initialized', () => {
                before('!! deploy proxy', async () => {
                    setup.data.incentives = await IncentivesProxy.new();
                });
                it('it reverts', async () => {
                    await expectRevert(
                        setup.data.incentives.stake(stakeAmount),
                        'IncentivesProxy: proxy not initialized'
                    );
                });
            });
            context('» stake parameter is not valid', () => {
                before('!! initialize proxy', async () => {
	            	    await setup.incentives.incentivesProxy.initialize(setup.tokens.primeToken.address, setup.balancer.pool.address);
                });
                it('it reverts', async () => {
                    await expectRevert(
                        setup.incentives.incentivesProxy.stake(toWei('0')),
                        'IncentivesProxy: cannot stake 0'
                    );
                });
            });
            context('» stake parameter is valid: stakes tokens', () => {
                before('!! populate accounts', async () => {
                    await setup.balancer.pool.transfer(accounts[1], stakeAmount);
                    await setup.balancer.pool.approve(setup.incentives.incentivesProxy.address, stakeAmount, { from: accounts[1] });
                    expect((await setup.balancer.pool.balanceOf(setup.incentives.incentivesProxy.address)).toString()).to.equal(toWei('0'));
                    expect((await setup.balancer.pool.balanceOf(accounts[1])).toString()).to.equal(stakeAmount);
                });
                it('stakes', async () => {
                    await setup.incentives.incentivesProxy.stake(stakeAmount, { from: accounts[1] });
                    expect((await setup.balancer.pool.balanceOf(setup.incentives.incentivesProxy.address)).toString()).to.equal(stakeAmount);
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
        });
        context('» proxy is not initialized', () => {
            before('!! deploy proxy', async () => {
                setup.data.incentives = await IncentivesProxy.new();
            });
            it('it reverts', async () => {
                await expectRevert(
                    setup.data.incentives.stake(stakeAmount),
                    'IncentivesProxy: proxy not initialized'
                );
            });
        });
        context('» withdraw parameter is not valid: too low', () => {
            it('it reverts', async () => {
                await expectRevert(
                    setup.incentives.incentivesProxy.withdraw(toWei('0')),
                    'IncentivesProxy: Cannot withdraw 0'
                );
            });
        });
        context('» withdraw parameter is valid: withdraws entire stake', () => {
            it('withdraws', async () => {
                expect((await setup.balancer.pool.balanceOf(setup.incentives.incentivesProxy.address)).toString()).to.equal(stakeAmount);
                await setup.incentives.incentivesProxy.withdraw(stakeAmount, { from: accounts[1] });
                expect((await setup.balancer.pool.balanceOf(setup.incentives.incentivesProxy.address)).toString()).to.equal(toWei('0'));
                expect((await setup.balancer.pool.balanceOf(accounts[1])).toString()).to.equal(stakeAmount);
            });
        });
        context('» withdraw parameter is valid: withdraws some of stake', () => {
            before('!! repopulate account and stake', async () => {
                await setup.balancer.pool.approve(setup.incentives.incentivesProxy.address, stakeAmount, { from: accounts[1] });
                await setup.incentives.incentivesProxy.stake(stakeAmount, { from: accounts[1] });
            });
            it('withdraws', async () => {
                await setup.incentives.incentivesProxy.withdraw(halfStake, { from: accounts[1] });
                expect((await setup.balancer.pool.balanceOf(setup.incentives.incentivesProxy.address)).toString()).to.equal(halfStake);
                expect((await setup.balancer.pool.balanceOf(accounts[1])).toString()).to.equal(halfStake);
            });
        });

    }); // end #withdraw

});
