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

    before('!! deploy setup', async () => {
        setup = await deploy(accounts);
    });
    context('» proxy is not initialized yet', () => {
        context('» parameters are valid', () => {
            // proxy has already been initialized during setup
            it('it initializes proxy', async () => {
            	await setup.incentives.incentivesProxy.initialize(setup.organization.token.address);
            });
        });
        context('» token parameter is not valid', () => {
            before('!! deploy proxy', async () => {
                setup.data.incentives = await IncentivesProxy.new();
            });
            it('it reverts', async () => {
                await expectRevert(setup.data.incentives.initialize(constants.ZERO_ADDRESS), 'IncentivesProxy: token cannot be null');
            });
        });
    });
    context('» proxy is already initialized', () => {
        // proxy has already been initialized during setup
        it('it reverts', async () => {
            await expectRevert(setup.incentives.incentivesProxy.initialize(setup.organization.token.address), 'IncentivesProxy: proxy already initialized');
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
	            	await setup.incentives.incentivesProxy.initialize(setup.organization.token.address);
                });
                it('it reverts', async () => {
                    await expectRevert(
                        setup.incentives.incentivesProxy.stake(toWei('0')),
                        'IncentivesProxy: cannot stake 0'
                    );
                });
            });
            // context('» stakes BPOOL tokens', () => {
            //     it('stake succesfull', async () => {
            //         await setup.incentives.incentivesProxy.stake(stakeAmount);
            //     });
            // });

            // context('» pauses the contract by changing setPublicSwap', () => {
            //     before('!! deploy and initialize proxy', async () => {
            //         setup.data.proxy = await BalancerProxy.new();
            //         await setup.data.proxy.initialize(setup.organization.avatar.address, setup.balancer.pool.address, await setup.balancer.pool.bPool());
            //     });
            //     it('bPool.isPublicSwap() == publicSwap', async () => {
            //         const calldata = helpers.encodeSetPublicSwap(publicSwap);
            //         const _tx = await setup.scheme.proposeCall(calldata, 0, constants.ZERO_BYTES32);
            //         const proposalId = helpers.getNewProposalId(_tx);
            //         const tx = await  setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
            //         //store data
            //         setup.data.tx = tx;
                
            //         const pool = await setup.balancer.pool.bPool();
            //         const bPool = await BPool.at(pool);
  
            //         expect(await bPool.isPublicSwap()).to.equal(publicSwap);
            //     });
            //     it('it emits a setPublicSwap event', async () => {
            //         await expectEvent.inTransaction(setup.data.tx.tx, setup.proxy, 'SetPublicSwap', {
            //             publicSwap: publicSwap
            //         });
            //     });
            // });
        });
    });

});

