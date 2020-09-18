const ERC20 = artifacts.require('ERC20Mock');
const ControllerCreator = artifacts.require('./ControllerCreator.sol');
const DaoCreator = artifacts.require('./DaoCreator.sol');
const DAOTracker = artifacts.require('./DAOTracker.sol');
// const WETH = artifacts.require('WETH');
const GenericScheme = artifacts.require('GenericScheme');
const Avatar = artifacts.require('./Avatar.sol');
const DAOToken = artifacts.require('./DAOToken.sol');
const Reputation = artifacts.require('./Reputation.sol');
const AbsoluteVote = artifacts.require('./AbsoluteVote.sol');
// Balancer imports
const ConfigurableRightsPool = artifacts.require('ConfigurableRightsPool')
const BPool = artifacts.require('BPool')
const BFactory = artifacts.require('BFactory')
const CRPFactory = artifacts.require('CRPFactory')
const BalancerSafeMath = artifacts.require('BalancerSafeMath');
const RightsManager = artifacts.require('RightsManager');
const SmartPoolManager = artifacts.require('SmartPoolManager');
const BalancerProxy = artifacts.require('BalancerProxy');

const { constants } = require('@openzeppelin/test-helpers');

const MAX = web3.utils.toTwosComplement(-1)

const { toWei } = web3.utils
const { fromWei } = web3.utils

const ARC_GAS_LIMIT = 6200000;
const INITIAL_CASH_SUPPLY = '2000000000000000000000';
const INITIAL_CASH_BALANCE = '100000000000000';
const DAO_TOKENS = '10000000000000000000000000';
const REPUTATION = '1000';

const deployOrganization = async (daoCreator, daoCreatorOwner, founderToken, founderReputation, cap = 0) => {
  var org = {};
  var tx = await daoCreator.forgeOrg('testOrg', 'TEST', 'TST', daoCreatorOwner, founderToken, founderReputation, cap, { gas: constants.ARC_GAS_LIMIT });
  assert.equal(tx.logs.length, 1);
  assert.equal(tx.logs[0].event, 'NewOrg');
  var avatarAddress = tx.logs[0].args._avatar;
  org.avatar = await Avatar.at(avatarAddress);
  var tokenAddress = await org.avatar.nativeToken();
  org.token = await DAOToken.at(tokenAddress);
  var reputationAddress = await org.avatar.nativeReputation();
  org.reputation = await Reputation.at(reputationAddress);
  return org;
};

const setAbsoluteVote = async (voteOnBehalf = constants.ZERO_ADDRESS, precReq = 50) => {
  var votingMachine = {};
  votingMachine.absoluteVote = await AbsoluteVote.new();
  // register some parameters
  await votingMachine.absoluteVote.setParameters(precReq, voteOnBehalf);
  votingMachine.params = await votingMachine.absoluteVote.getParametersHash(precReq, voteOnBehalf);
  return votingMachine;
};

const initialize = async (root) => {
  const setup = {};
  setup.root = root;
  setup.data = {};
  setup.data.balances = [];
  return setup;
};

const tokens = async (setup) => {
  // const weth = await WETH.new();
  const erc20s = [await ERC20.new('DAI Stablecoin', 'DAI', 18), await ERC20.new('USDC Stablecoin', 'USDC', 15)];
  // await weth.deposit({ value: INITIAL_CASH_BALANCE });

  return { /*weth,*/ erc20s };
};

const balancer = async (setup) => {
  // deploy balancer infrastructure
  const bfactory = await BFactory.new();

  const balancerSafeMath = await BalancerSafeMath.new();
  const rightsManager = await RightsManager.new();
  const smartPoolManager = await SmartPoolManager.new();

  await CRPFactory.link("BalancerSafeMath", balancerSafeMath.address);
  await CRPFactory.link("RightsManager", rightsManager.address);
  await CRPFactory.link("SmartPoolManager", smartPoolManager.address);

  const crpFactory = await CRPFactory.new();

  const usdc = await setup.tokens.erc20s[1];
  const dai = await setup.tokens.erc20s[0];
  const daotoken = await setup.organization.token;

  const USDC = await usdc.address;
  const DAI = await dai.address;
  const DAOToken = await daotoken.address;

  const tokenAddresses = [DAOToken, DAI, USDC];
  
  const swapFee = 10 ** 15;
  const startWeights = [toWei('8'), toWei('1'), toWei('1')];
  const endWeights = [toWei('2'), toWei('4'), toWei('4')];
  const startBalances = [toWei('10000'), toWei('5000'), toWei('5000')];
  const SYMBOL = 'BPOOL';

  const permissions = {
        canPauseSwapping: true,
        canChangeSwapFee: true,
        canChangeWeights: true,
        canAddRemoveTokens: true,
        canWhitelistLPs: false,
  };

  POOL = await crpFactory.newCrp.call(
          bfactory.address,
          SYMBOL,
          tokenAddresses,
          startBalances,
          startWeights,
          swapFee,
          permissions,
  );
    
  await crpFactory.newCrp(
          bfactory.address,
          SYMBOL,
          tokenAddresses,
          startBalances,
          startWeights,
          swapFee,
          permissions,
      );

  const pool = await ConfigurableRightsPool.at(POOL);

  await usdc.approve(POOL, MAX);
  await dai.approve(POOL, MAX);
  await daotoken.approve(POOL, MAX);

  await pool.createPool(toWei('1000'));

  // move ownership to avatar
  await pool.setController(setup.organization.avatar.address);

  return { pool };
};

const DAOStack = async () => {
  const controllerCreator = await ControllerCreator.new();
  const daoTracker = await DAOTracker.new();
  const daoCreator = await DaoCreator.new(controllerCreator.address, daoTracker.address);

  return { controllerCreator, daoTracker, daoCreator };
};

const organization = async (setup) => {
  // deploy organization
  const organization = await deployOrganization(setup.DAOStack.daoCreator, [setup.root], [DAO_TOKENS], [REPUTATION]);

  return organization;
};

const proxy = async (setup) => {
  // deploy proxy
  const proxy = await BalancerProxy.new();
  // initialize proxy
  await proxy.initialize(setup.organization.avatar.address, setup.balancer.pool.address);

  return proxy;
};

const scheme = async (setup) => {
  // deploy scheme
  const scheme = await GenericScheme.new();
  // deploy scheme voting machine
  scheme.voting = await setAbsoluteVote(constants.ZERO_ADDRESS, 50, scheme.address);
  // initialize scheme
  await scheme.initialize(setup.organization.avatar.address, scheme.voting.absoluteVote.address, scheme.voting.params, setup.proxy.address);
  // register scheme
  const permissions = '0x00000010';
  await setup.DAOStack.daoCreator.setSchemes(
    setup.organization.avatar.address,
    [setup.proxy.address, scheme.address],
    [constants.ZERO_BYTES32, constants.ZERO_BYTES32],
    [permissions, permissions],
    'metaData'
  );

  return scheme;
};

module.exports = {
  initialize,
  tokens,
  balancer,
  DAOStack,
  organization,
  proxy,
  scheme,
};
