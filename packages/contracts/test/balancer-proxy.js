/*global artifacts, web3, contract, beforeEach, it, context*/
/*eslint no-undef: "error"*/

const { expect } = require('chai');
const { constants } = require('@openzeppelin/test-helpers');
const helpers = require('./helpers');
const BPool = artifacts.require('BPool');
const Controller = artifacts.require('Controller');

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
  beforeEach('!! deploy setup', async () => {
    setup = await deploy(accounts);
  });
  context('» parameters are valid', () => {
    // proxy has already been initialized during setup
    it('it checks that proxy is a registered scheme', async () => {
      const controller = await Controller.at(await setup.organization.avatar.owner());
      expect(await controller.isSchemeRegistered(setup.proxy.address, setup.organization.avatar.address)).to.equal(true);
    });
    it('it initializes proxy', async () => {
      expect(await setup.proxy.initialized()).to.equal(true);
      expect(await setup.proxy.avatar()).to.equal(setup.organization.avatar.address);
    });
  });
  context('» execute setPublicSwap', async () => {
    it('it sends setPublicSwap proposal and votes', async () => {
      const publicSwap = false;
      const calldata = helpers.encodeSetPublicSwap(publicSwap);
      const _tx = await setup.scheme.proposeCall(calldata, 0, constants.ZERO_BYTES32);
      const proposalId = helpers.getNewProposalId(_tx);
      await setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
      // const tx = await setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
      // const proposal = await setup.scheme.organizationProposals(proposalId);

      const pool = await setup.balancer.pool.bPool();
      const bPool = await BPool.at(pool);

      expect(await bPool.isPublicSwap()).to.equal(publicSwap);
    });
  });
  context('» execute setSwapFee', async () => {
    it('it sends setSwapFee proposal and votes', async () => {
      const newFee = 11 ** 15
      const calldata = helpers.encodeSetSwapFee(newFee);
      const _tx = await setup.scheme.proposeCall(calldata, 0, constants.ZERO_BYTES32);
      const proposalId = helpers.getNewProposalId(_tx);
      await setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
      // const tx = await setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
      // const proposal = await setup.scheme.organizationProposals(proposalId);

      const pool = await setup.balancer.pool.bPool();
      const bPool = await BPool.at(pool);

      const swapFee = await bPool.getSwapFee();
      expect(await swapFee.toString()).to.equal(newFee.toString());
    });
  });
  context('» execute addToken', async () => {
    it('it sends addToken proposal and votes', async () => {
      const calldata = helpers.encodeAddToken(setup.tokens.weth.address, toWei('10'), toWei('2'));
      const _tx = await setup.scheme.proposeCall(calldata, 0, constants.ZERO_BYTES32);
      const proposalId = helpers.getNewProposalId(_tx);
      await setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
      // const tx = await setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
      // const proposal = await setup.scheme.organizationProposals(proposalId);
    });
  });
  context('» execute removeToken', async () => {
    it('it sends removeToken proposal and votes', async () => {
      const calldata = helpers.encodeRemoveToken(setup.tokens.weth.address);
      const _tx = await setup.scheme.proposeCall(calldata, 0, constants.ZERO_BYTES32);
      const proposalId = helpers.getNewProposalId(_tx);
      await setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
      // const tx = await setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
      // const proposal = await setup.scheme.organizationProposals(proposalId);
    });
  });
  context('» execute updateWeightsGradually', async () => {
    it('it sends updateWeightsGradually proposal and votes', async () => {

      const startBlock = (await web3.eth.getBlock()).timestamp+1;
      const endBlock = await startBlock+100;
      const calldata = helpers.encodeUpdateWeightsGradually([toWei('5'), toWei('2'), toWei('2')], startBlock, endBlock);
      const _tx = await setup.scheme.proposeCall(calldata, 0, constants.ZERO_BYTES32);
      const proposalId = helpers.getNewProposalId(_tx);
      await setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
      // const tx = await setup.scheme.voting.absoluteVote.vote(proposalId, 1, 0, constants.ZERO_ADDRESS);
      // const proposal = await setup.scheme.organizationProposals(proposalId);
    });
  });
});
