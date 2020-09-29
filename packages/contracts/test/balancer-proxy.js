/*global artifacts, web3, contract, before, it, context*/
/*eslint no-undef: "error"*/

const { expect } = require('chai');
const { constants, time, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const helpers = require('./helpers');
const BPool = artifacts.require('BPool');
// const Controller = artifacts.require('Controller');
const BalancerProxy = artifacts.require('BalancerProxy');

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

    return setup;
};

contract('BalancerProxy', (accounts) => {
    let setup;
    let publicSwap;
    let swapFee;
    let blockNumber;
    let newWeights;
    let startBLock;
    let endBlock;
    let poolAmountOut;
    let poolAmountIn;
    let maxAmountsIn;
    let minAmountsOut;

    before('!! deploy setup', async () => {
        setup = await deploy(accounts);
    });
    context('» proxy is not initialized yet', () => {
        context('» parameters are valid', () => {
            // proxy has already been initialized during setup
            it('it initializes proxy', async () => {
                expect(await setup.proxy.initialized()).to.equal(true);
                expect(await setup.proxy.avatar()).to.equal(setup.organization.avatar.address);
                expect(await setup.proxy.crpool()).to.equal(setup.balancer.pool.address);
            });
        });
        context('» avatar parameter is not valid', () => {
            before('!! deploy proxy', async () => {
                setup.data.proxy = await BalancerProxy.new();
            });
            it('it reverts', async () => {
                await expectRevert(setup.data.proxy.initialize(constants.ZERO_ADDRESS, setup.balancer.pool.address, await setup.balancer.pool.bPool()), 'BalancerProxy: avatar cannot be null');
            });
        });
        context('» crpool parameter is not valid', () => {
            before('!! deploy proxy', async () => {
                setup.data.proxy = await BalancerProxy.new();
            });
            it('it reverts', async () => {
                await expectRevert(setup.data.proxy.initialize(setup.organization.avatar.address, constants.ZERO_ADDRESS, await setup.balancer.pool.bPool()), 'BalancerProxy: crpool cannot be null');
            });
        });
        context('» bpool parameter is not valid', () => {
            before('!! deploy proxy', async () => {
                setup.data.proxy = await BalancerProxy.new();
            });
            it('it reverts', async () => {
                await expectRevert(setup.data.proxy.initialize(setup.organization.avatar.address, setup.balancer.pool.address, constants.ZERO_ADDRESS), 'BalancerProxy: bpool cannot be null');
            });
        });
    });
    context('» proxy is already initialized', () => {
        // proxy has already been initialized during setup
        it('it reverts', async () => {
            await expectRevert(setup.proxy.initialize(setup.organization.avatar.address, setup.balancer.pool.address, await setup.balancer.pool.bPool()), 'BalancerProxy: proxy already initialized');
        });
    });
    context('# setPublicSwap', () => {
        context('» generics', () => {
            before('!! deploy setup', async () => {
                setup = await deploy(accounts);
                publicSwap = false;
            });
            context('» proxy is not initialized', () => {
                before('!! deploy proxy', async () => {
                    setup.data.proxy = await BalancerProxy.new();
                });
                it('it reverts', async () => {
                    await expectRevert(
                        setup.data.proxy.setPublicSwap(publicSwap),
                        'BalancerProxy: proxy not initialized'
                    );
                });
            });
            context('» setPublicSwap is not triggered by avatar', () => {
                before('!! deploy and initialize proxy', async () => {
                    setup.data.proxy = await BalancerProxy.new();
                    await setup.data.proxy.initialize(setup.organization.avatar.address, setup.balancer.pool.address, await setup.balancer.pool.bPool());
                });
                it('it reverts', async () => {
                    await expectRevert(
                        setup.data.proxy.setPublicSwap(publicSwap),
                        'BalancerProxy: protected operation'
                    );
                });
            });
            context('» pauses the contract by changing setPublicSwap', () => {
                before('!! deploy and initialize proxy', async () => {
                    setup.data.proxy = await BalancerProxy.new();
                    await setup.data.proxy.initialize(setup.organization.avatar.address, setup.balancer.pool.address, await setup.balancer.pool.bPool());
                });
                it('bPool.isPublicSwap() == publicSwap', async () => {
                    const calldata = helpers.encodeSetPublicSwap(publicSwap);
                    const _tx = await setup.scheme.proposeCall(calldata, 0, constants.ZERO_BYTES32);
                    const proposalId = helpers.getNewProposalId(_tx);
                    const tx = await  setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
                    //store data
                    setup.data.tx = tx;
                
                    const pool = await setup.balancer.pool.bPool();
                    const bPool = await BPool.at(pool);
  
                    expect(await bPool.isPublicSwap()).to.equal(publicSwap);
                });
                it('it emits a setPublicSwap event', async () => {
                    await expectEvent.inTransaction(setup.data.tx.tx, setup.proxy, 'SetPublicSwap', {
                        publicSwap: publicSwap
                    });
                });
            });
        });
    });
    context('# setSwapFee', () => {
        context('» generics', () => {
            before('!! deploy setup', async () => {
                setup = await deploy(accounts);
                swapFee = 11 ** 15;
            });
            context('» setSwapFee is not triggered by avatar', () => {
                before('!! deploy and initialize proxy', async () => {
                    setup.data.proxy = await BalancerProxy.new();
                    await setup.data.proxy.initialize(setup.organization.avatar.address, setup.balancer.pool.address, await setup.balancer.pool.bPool());
                });
                it('it reverts', async () => {
                    await expectRevert(
                        setup.data.proxy.setSwapFee(swapFee),
                        'BalancerProxy: protected operation'
                    );
                });
            });
            context('» change swapFee', () => {
                before('!! deploy and initialize proxy', async () => {
                    setup.data.proxy = await BalancerProxy.new();
                    await setup.data.proxy.initialize(setup.organization.avatar.address, setup.balancer.pool.address, await setup.balancer.pool.bPool());
                });
                it('bPool.getSwapFee() == swapFee', async () => {
                    const calldata = helpers.encodeSetSwapFee(swapFee);
                    const _tx = await setup.scheme.proposeCall(calldata, 0, constants.ZERO_BYTES32);
                    const proposalId = helpers.getNewProposalId(_tx);
                    const tx = await  setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
                    //store data
                    setup.data.tx = tx;
                
                    const pool = await setup.balancer.pool.bPool();
                    const bPool = await BPool.at(pool);
                    expect(await (await bPool.getSwapFee()).toString()).to.equal(swapFee.toString());
                });
                it('it emits a SetSwapFee event', async () => {
                    await expectEvent.inTransaction(setup.data.tx.tx, setup.proxy, 'SetSwapFee', {
                        swapFee: swapFee.toString()
                    });
                });
            });
        });
    });
    context('# commitAddToken => applyAddToken => removeToken', () => {
        context('» generics', () => {
            before('!! deploy setup', async () => {
                setup = await deploy(accounts);
            });
            context('» commitAddToken is not triggered by avatar', () => {
                before('!! deploy and initialize proxy', async () => {
                    setup.data.proxy = await BalancerProxy.new();
                    await setup.data.proxy.initialize(setup.organization.avatar.address, setup.balancer.pool.address, await setup.balancer.pool.bPool());
                });
                it('it reverts', async () => {
                    await expectRevert(
                        setup.data.proxy.commitAddToken(setup.tokens.erc20s[2].address, toWei('1000'), toWei('1')),
                        'BalancerProxy: protected operation'
                    );
                });
            });
            context('» commit Add Token', () => {
                before('!! deploy and initialize proxy', async () => {
                    setup.data.proxy = await BalancerProxy.new();
                    await setup.data.proxy.initialize(setup.organization.avatar.address, setup.balancer.pool.address, await setup.balancer.pool.bPool());
                });
                it('commit add Token', async () => {
                    const calldata = helpers.encodeCommitAddToken(setup.tokens.erc20s[2].address, toWei('1000'), toWei('1'));
                    const _tx = await setup.scheme.proposeCall(calldata, 0, constants.ZERO_BYTES32);
                    const proposalId = helpers.getNewProposalId(_tx);
                    const tx = await  setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
                    //store data
                    setup.data.tx = tx;
                });
                it('it emits a CommitAddToken event', async () => {
                    await expectEvent.inTransaction(setup.data.tx.tx, setup.proxy, 'CommitAddToken');
                });
                context('» applyAddToken', () => {
                    it('checks that the right address is commited', async () => {
                        expect((await setup.balancer.pool.newToken()).addr).to.equal(setup.tokens.erc20s[2].address);
                    });
                    it('checks allowance of balancer pool provided by avatar', async () => {
                        expect((await setup.tokens.erc20s[2].allowance(setup.organization.avatar.address, setup.balancer.pool.address)).toString()).to.equal(toWei('1000'));
                    });
                    it('transfer tokens to the avatar address', async () => {
                        await setup.tokens.erc20s[2].transfer(setup.organization.avatar.address, toWei('1000'));
                    });
                    it('advances to blockNumber + 11', async () => {
                        blockNumber = (await setup.balancer.pool.newToken()).commitBlock;
                        await time.advanceBlockTo(blockNumber.toNumber()+11);
                    });
                    it('apply add Token', async () => {
                        const calldata = helpers.encodeApplyAddToken();
                        const _tx = await setup.scheme.proposeCall(calldata, 0, constants.ZERO_BYTES32);
                        const proposalId = helpers.getNewProposalId(_tx);
                        const tx = await  setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
  
                        setup.data.tx = tx;
                        await expectEvent.inTransaction(setup.data.tx.tx, setup.proxy, 'ApplyAddToken');
                    });
                    it('checks the balance of bPool', async () => {
                        expect((await setup.tokens.erc20s[2].balanceOf(await setup.balancer.pool.bPool())).toString()).to.equal(toWei('1000'));
                    });
                    it('checks the number of tokens', async () => {
                        const pool = await setup.balancer.pool.bPool();
                        const bPool = await BPool.at(pool);
                        expect((await bPool.getNumTokens()).toNumber()).to.equal(4);
                    });
                    context('# removeToken', () => {
                        context('» remove Token', () => {
                            before('!! deploy and initialize proxy', async () => {
                                setup.data.proxy = await BalancerProxy.new();
                                await setup.data.proxy.initialize(setup.organization.avatar.address, setup.balancer.pool.address, await setup.balancer.pool.bPool());
                            });
                            it('removes Token', async () => {
                                const calldata = helpers.encodeRemoveToken(setup.tokens.erc20s[2].address);
                                const _tx = await setup.scheme.proposeCall(calldata, 0, constants.ZERO_BYTES32);
                                const proposalId = helpers.getNewProposalId(_tx);
                                const tx = await  setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
    
                                setup.data.tx = tx;
                                await expectEvent.inTransaction(setup.data.tx.tx, setup.proxy, 'RemoveToken');
                            });
                            it('checks the number of tokens', async () => {
                                const pool = await setup.balancer.pool.bPool();
                                const bPool = await BPool.at(pool);
                                expect((await bPool.getNumTokens()).toNumber()).to.equal(3);
                            });
                            it('checks the balance of bPool', async () => {
                                expect((await setup.tokens.erc20s[2].balanceOf(await setup.balancer.pool.bPool())).toString()).to.equal('0');
                            });
                        });
                    });
                });
            });
        });
    });

    context('# updateWeightsGradually', () => {
        context('» generics', () => {
            before('!! deploy setup', async () => {
                setup = await deploy(accounts);
                newWeights = [toWei('2'), toWei('4'), toWei('4')];
                startBLock = blockNumber.toNumber()+100;
                endBlock = startBLock + 250;
            });
            context('» call updateWeightsGradually', () => {
                before('!! deploy and initialize proxy', async () => {
                    setup.data.proxy = await BalancerProxy.new();
                    await setup.data.proxy.initialize(setup.organization.avatar.address, setup.balancer.pool.address, await setup.balancer.pool.bPool());
                });
                it('update weights gradually', async () => {
                    const calldata = helpers.encodeUpdateWeightsGradually(newWeights, startBLock, endBlock);
                    const _tx = await setup.scheme.proposeCall(calldata, 0, constants.ZERO_BYTES32);
                    const proposalId = helpers.getNewProposalId(_tx);
                    const tx = await  setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
                    //store data
                    setup.data.tx = tx;

                    await expectEvent.inTransaction(setup.data.tx.tx, setup.proxy, 'UpdateWeightsGradually');
                });
            });
        });
    });
    context('# joinPool => exitPool', () => {
        context('» generics', () => {
            before('!! deploy setup', async () => {
                setup = await deploy(accounts);
                poolAmountOut = toWei('500');
                poolAmountIn = toWei('250');
                maxAmountsIn = [toWei('7000'), toWei('3000'), toWei('3000')];
                minAmountsOut = [toWei('2000'), toWei('1000'), toWei('1000')];
            });
            context('» call joinPool', () => {
                before('!! deploy and initialize proxy', async () => {
                    setup.data.proxy = await BalancerProxy.new();
                    await setup.data.proxy.initialize(setup.organization.avatar.address, setup.balancer.pool.address, await setup.balancer.pool.bPool());
                });
                it('transfers tokens to the avatar address', async () => {
                    await setup.organization.token.transfer(setup.organization.avatar.address, maxAmountsIn[0]);
                    await setup.tokens.erc20s[0].transfer(setup.organization.avatar.address, maxAmountsIn[1]);
                    await setup.tokens.erc20s[1].transfer(setup.organization.avatar.address, maxAmountsIn[2]);
                });
                it('joins pool', async () => {
                    const calldata = helpers.encodeJoinPool(poolAmountOut, maxAmountsIn);
                    const _tx = await setup.scheme.proposeCall(calldata, 0, constants.ZERO_BYTES32);
                    const proposalId = helpers.getNewProposalId(_tx);
                    const tx = await  setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
                    // store data
                    setup.data.tx = tx;

                    await expectEvent.inTransaction(setup.data.tx.tx, setup.proxy, 'JoinPool');
                });
                it('checks the balanceOf BPRIME tokens', async () => {
                    expect((await setup.balancer.pool.balanceOf(setup.organization.avatar.address)).toString()).to.equal(poolAmountOut);
                }); 
                context('» call exitPool', () => {
                    it('exits pool', async () => {
                        const calldata = helpers.encodeExitPool(poolAmountIn, minAmountsOut);
                        const _tx = await setup.scheme.proposeCall(calldata, 0, constants.ZERO_BYTES32);
                        const proposalId = helpers.getNewProposalId(_tx);
                        const tx = await  setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
                        // store data
                        setup.data.tx = tx;

                        await expectEvent.inTransaction(setup.data.tx.tx, setup.proxy, 'ExitPool');
                    });
                    it('checks the balanceOf BPRIME tokens', async () => {
                        expect((await setup.balancer.pool.balanceOf(setup.organization.avatar.address)).toString()).to.equal(poolAmountIn);
                    }); 
                });
            });
        });
    });
});
