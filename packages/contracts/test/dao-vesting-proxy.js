/*global artifacts, web3, contract, before, it, context*/
/*eslint no-undef: "error"*/

const { expect } = require('chai');
const { constants, time, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const helpers = require('./helpers');
const DAOVestingProxy = artifacts.require('DAOVestingProxy');

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
    // deploy vestingProxy scheme
    setup.vestingProxy = await helpers.setup.vestingProxy(setup);
    // deploy generic scheme
    setup.scheme = await helpers.setup.scheme(setup);

    return setup;
};

contract('DAOVesting', (accounts) => {
	let setup;
	let beneficiary;
	let start;
    before('!! deploy setup', async () => {
        setup = await deploy(accounts);
    });
    context('» proxy is not initialized yet', () => {
        context('» parameters are valid', () => {
            // proxy has already been initialized during setup
            it('it initializes proxy', async () => {
                expect(await setup.vestingProxy.initialized()).to.equal(true);
                expect(await setup.vestingProxy.avatar()).to.equal(setup.organization.avatar.address);
                expect(await setup.vestingProxy.factory()).to.equal(setup.vesting.factory.address);
            });
        });
        context('» avatar parameter is not valid', () => {
            before('!! deploy proxy', async () => {
                setup.data.vestingProxy = await DAOVestingProxy.new();
            });
            it('it reverts', async () => {
                await expectRevert(setup.data.vestingProxy.initialize(constants.ZERO_ADDRESS, setup.vesting.factory.address, setup.tokens.primeToken.address), 'DAOVesting: avatar cannot be null');
            });
        });
        context('» factory parameter is not valid', () => {
            before('!! deploy proxy', async () => {
                setup.data.vestingProxy = await DAOVestingProxy.new();
            });
            it('it reverts', async () => {
                await expectRevert(setup.data.vestingProxy.initialize(setup.organization.avatar.address, constants.ZERO_ADDRESS, setup.tokens.primeToken.address), 'DAOVesting: vestingFactory cannot be null');
            });
        });
        context('» prime token parameter is not valid', () => {
            before('!! deploy proxy', async () => {
                setup.data.vestingProxy = await DAOVestingProxy.new();
            });
            it('it reverts', async () => {
                await expectRevert(setup.data.vestingProxy.initialize(setup.organization.avatar.address, setup.vesting.factory.address, constants.ZERO_ADDRESS), 'DAOVesting: primeToken cannot be null');
            });
        });
    });
    context('» proxy is already initialized', () => {
	    // proxy has already been initialized during setup
	    it('it reverts', async () => {
	        await expectRevert(setup.vestingProxy.initialize(setup.organization.avatar.address, setup.vesting.factory.address, setup.tokens.primeToken.address), 'DAOVesting: scheme already initialized');
	    });
 	});
    context('# createVesing', () => {
   	    context('» generics', () => {
            before('!! deploy setup', async () => {
                setup = await deploy(accounts);
                beneficiary = accounts[1];
                start = (await time.latest()).toNumber();
            });
            it('creates vesting', async () => {
                // const calldata = helpers.encodeCreateVesing(beneficiary, start, setup.vesting.params.cliffDuration, setup.vesting.params.duration, setup.vesting.params.revocable);
                // const _tx = await setup.scheme.proposeCall(calldata, 0, constants.ZERO_BYTES32);
                // const proposalId = helpers.getNewProposalId(_tx);
                // const tx = await  setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
                // //store data
                // setup.data.tx = tx;
                // await expectEvent.inTransaction(setup.data.tx.tx, setup.vestingProxy, 'VestingCreated');
            });
	    });
 	});
});