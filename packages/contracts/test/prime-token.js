/*global artifacts, web3, contract, before, it, context*/
/*eslint no-undef: "error"*/

const { expect } = require('chai');
const { constants, time, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const helpers = require('./helpers');
const BPool = artifacts.require('BPool');
const BalancerProxy = artifacts.require('BalancerProxy');
const TokenVesting = artifacts.require('TokenVesting');

const { toWei } = web3.utils;

const deploy = async (accounts) => {
    // initialize test setup
    const setup = await helpers.setup.initialize(accounts[0]);
    // deploy ERC20s
    setup.tokens = await helpers.setup.tokens(setup);
    // deploy VestingFactory
    setup.vesting = await helpers.setup.vesting(setup);
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
    let owner; // vesting contract owner
    let beneficiary; // vesting beneficiary
    let start; // vesting start
    let tokenVestAmount; // amount of tokens vested
    let vestingAddress; // vesting contract address
    let vestingContract; // vesting contract instance
    let halfVested;

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
    context('» vesting', () => {
        context('» parameters are invalid', () => {
            it('owner is the zero address', async () => {
                owner = constants.ZERO_ADDRESS;
                beneficiary = accounts[1];
                start = await time.latest();
                await expectRevert(setup.vesting.factory.create(owner, beneficiary, start, setup.vesting.params.cliffDuration, setup.vesting.params.duration, setup.vesting.params.revocable), 'VestingFactory: owner is the zero address');
            });
            it('beneficiary is the zero address', async () => {
                owner = accounts[0];
                beneficiary = constants.ZERO_ADDRESS;
                start = await time.latest();
                await expectRevert(setup.vesting.factory.create(owner, beneficiary, start, setup.vesting.params.cliffDuration, setup.vesting.params.duration, setup.vesting.params.revocable), 'TokenVesting: beneficiary is the zero address');
            });
            it('cliff is longer than duration', async () => {
                owner = accounts[0];
                beneficiary = accounts[1];
                start = await time.latest();
                let badCliff = setup.vesting.params.duration + 1;
                await expectRevert(setup.vesting.factory.create(owner, beneficiary, start, badCliff, setup.vesting.params.duration, setup.vesting.params.revocable), 'TokenVesting: cliff is longer than duration');
            });
            it('duration is 0', async () => {
                owner = accounts[0];
                beneficiary = accounts[1];
                start = await time.latest();
                let zeroDuration = 0;
                await expectRevert(setup.vesting.factory.create(owner, beneficiary, start, setup.vesting.params.cliffDuration, zeroDuration, setup.vesting.params.revocable), 'TokenVesting: duration is 0');
            });
            it('final time is before current time', async () => {
                owner = accounts[0];
                beneficiary = accounts[1];
                start = await time.latest();
                let badStart = 0;
                await expectRevert(setup.vesting.factory.create(owner, beneficiary, badStart, setup.vesting.params.cliffDuration, setup.vesting.params.duration, setup.vesting.params.revocable), 'TokenVesting: final time is before current time');
            });
        });
        context('» parameters are valid', () => {
            it('it should create a vesting contract', async () => {
                owner = accounts[0];
                beneficiary = accounts[1];
                start = await time.latest();
                let tx = await setup.vesting.factory.create(owner, beneficiary, start, setup.vesting.params.cliffDuration, setup.vesting.params.duration, setup.vesting.params.revocable);
                setup.data.tx = tx;
                await expectEvent.inTransaction(setup.data.tx.tx, setup.vesting.factory, 'VestingCreated');
                vestingAddress = setup.data.tx.logs[0].args.vestingContractAddress;
            });
            it('it should fail on release', async () => {
                vestingContract = await TokenVesting.at(vestingAddress);
                await expectRevert(vestingContract.release(setup.tokens.primeToken.address, {from: beneficiary}), 'TokenVesting: no tokens are due');
            });
            it('it should top up a vesting contract', async () => {
                tokenVestAmount = toWei('100000');
                await setup.tokens.primeToken.transfer(vestingAddress, tokenVestAmount);
                expect((await setup.tokens.primeToken.balanceOf(vestingAddress)).toString()).to.equal(tokenVestAmount.toString());
            });
            it('it should release succesfully', async () => {
                // check half time passed
                await time.increase(setup.vesting.params.duration/2);
                halfVested = toWei('50000');
                let tx = await vestingContract.release(setup.tokens.primeToken.address, {from: beneficiary});
                setup.data.tx = tx;
                await expectEvent.inTransaction(setup.data.tx.tx, vestingContract, 'TokensReleased');
                expect((await setup.tokens.primeToken.balanceOf(beneficiary)).toString()).to.equal(halfVested.toString());
            });
            it('it should revoke succesfully', async () => {
                // check half time passed
                let tx = await vestingContract.revoke(setup.tokens.primeToken.address, {from: owner});
                setup.data.tx = tx;
                await expectEvent.inTransaction(setup.data.tx.tx, vestingContract, 'TokenVestingRevoked');
            });
            it('it should fail on a second revoke', async () => {
                await expectRevert(vestingContract.revoke(setup.tokens.primeToken.address, {from: owner}), 'TokenVesting: token already revoked');
            });
        });
    });
});