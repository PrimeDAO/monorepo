const { expect } = require('chai');
const { BN, balance, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const helpers = require('./helpers');
const BPool = artifacts.require('BPool');
const Controller = artifacts.require('Controller');

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
  beforeEach('!! deploy setup', async () => {
    setup = await deploy(accounts);
  });
  context('» parameters are valid', () => {
    // proxy has already been initialized during setup
    it('it checks that proxy is a registered scheme', async () => {
      const controller = await Controller.at(await setup.organization.avatar.owner())
      expect(await controller.isSchemeRegistered(setup.proxy.address, setup.organization.avatar.address)).to.equal(true);
    });
    it('it initializes proxy', async () => {
      expect(await setup.proxy.initialized()).to.equal(true);
      expect(await setup.proxy.avatar()).to.equal(setup.organization.avatar.address);
    });
  });
  context('!! execute setPublicSwap', async () => {
    // execute swap
    it('it sends setPublicSwap proposal and votes', async () => {
      const calldata = helpers.encodeSetPublicSwap(false);
      const _tx = await setup.scheme.proposeCall(calldata, 0, constants.ZERO_BYTES32);
      const proposalId = helpers.getNewProposalId(_tx);
      const tx = await setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
      const proposal = await setup.scheme.organizationProposals(proposalId);
      // store data
      setup.data.tx = tx;
      setup.data.proposal = proposal;

      let pool = await setup.balancer.pool.bPool();
      let bPool = await BPool.at(pool);

      expect(await bPool.isPublicSwap()).to.equal(false);
    });
  });
  context('!! execute setSwapFee', async () => {
    // execute swap
    it('it sends setSwapFee proposal and votes', async () => {
      const calldata = helpers.encodeSetSwapFee(10 ** 15);
      const _tx = await setup.scheme.proposeCall(calldata, 0, constants.ZERO_BYTES32);
      const proposalId = helpers.getNewProposalId(_tx);
      const tx = await setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
      const proposal = await setup.scheme.organizationProposals(proposalId);
      // store data
      setup.data.tx = tx;
      setup.data.proposal = proposal;

      let pool = await setup.balancer.pool.bPool();
      let bPool = await BPool.at(pool);

      let swapFee = await bPool.getSwapFee();
      expect(await swapFee.toString()).to.equal("1000000000000000");
    });
  });
});
