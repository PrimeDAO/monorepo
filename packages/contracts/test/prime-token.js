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
    // deploy token4rep
    setup.token4rep = await helpers.setup.token4rep(setup);
    // deploy generic scheme
    setup.scheme = await helpers.setup.scheme(setup);

    return setup;
};

contract('PrimeToken', (accounts) => {
    let testSetup;

    before('!! deploy setup', async () => {
        setup = await deploy(accounts);
        testSetup = setup.token4rep.params
    });
    context('» token4rep', () => {
        context('» parameters are valid', () => {
            it('it should check that scheme is intitalized', async () => {
                expect((await setup.token4rep.contract.reputationRewardLeft()).toNumber()).to.equal(testSetup.reputationReward);
                expect((await setup.token4rep.contract.batchTime()).toNumber()).to.equal(testSetup.batchTime);
                expect(await setup.token4rep.contract.token()).to.equal(setup.tokens.primeToken.address);
            });

            it('it should lock tokens for reputation', async () => {
                await setup.tokens.primeToken.approve(setup.token4rep.contract.address, toWei('100'));
                let tx = await setup.token4rep.contract.lock(toWei('1'), 12, 0,"0x0000000000000000000000000000000000000000");
                setup.data.tx = tx;
                await expectEvent.inTransaction(setup.data.tx.tx, setup.token4rep.contract, 'LockToken');
            });
        });
    });
});
