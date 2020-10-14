/*global artifacts, web3, contract, before, it, context*/
/*eslint no-undef: "error"*/

const { expect } = require('chai');
const { constants, time, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const helpers = require('./helpers');
const BPool = artifacts.require('BPool');
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
    // deploy token4rep
    setup.token4rep = await helpers.setup.token4rep(setup);
    // deploy generic scheme
    setup.scheme = await helpers.setup.scheme(setup);

    return setup;
};

contract('PrimeToken', (accounts) => {
    let testSetup;
    let tokenLockAmount;
    let lockId;

    before('!! deploy setup', async () => {
        setup = await deploy(accounts);
        testSetup = setup.token4rep.params;
        tokenLockAmount = toWei('100');
    });
    context('» token4rep', () => {
        context('» parameters are valid', () => {
            it('it should check that scheme is intitalized', async () => {
                expect((await setup.token4rep.contract.reputationRewardLeft()).toNumber()).to.equal(testSetup.reputationReward);
            });
            it('it should lock tokens for reputation', async () => {
                await setup.tokens.primeToken.approve(setup.token4rep.contract.address, tokenLockAmount);
                let tx = await setup.token4rep.contract.lock(tokenLockAmount, setup.token4rep.params.maxLockingPeriod, setup.tokens.primeToken.address,"0x0000000000000000000000000000000000000000");
                setup.data.tx = tx;
                await expectEvent.inTransaction(setup.data.tx.tx, setup.token4rep.contract, 'LockToken');
                lockingId = await setup.data.tx.logs[0].args._lockingId;
            });
            it('it should redeem reputation', async () => {
                await time.increase(setup.token4rep.params.redeemEnableTime + await time.latest());
                let tx = await setup.token4rep.contract.redeem(setup.root);
                setup.data.tx = tx;
                await expectEvent.inTransaction(setup.data.tx.tx, setup.token4rep.contract, 'Redeem');
            });
            it('it should release tokens', async () => {
                let tx = await setup.token4rep.contract.release(setup.root, lockingId);
                setup.data.tx = tx;
                await expectEvent.inTransaction(setup.data.tx.tx, setup.token4rep.contract, 'Release');
            });
        });
    });
});
