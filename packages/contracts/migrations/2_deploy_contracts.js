const RightsManager = artifacts.require('RightsManager');
const SmartPoolManager = artifacts.require('SmartPoolManager');
const CRPFactory = artifacts.require('CRPFactory');
const BFactory = artifacts.require('BFactory');
const BalancerSafeMath = artifacts.require('BalancerSafeMath');
const BalancerSafeMathMock = artifacts.require('BalancerSafeMathMock');
const ConfigurableRightsPool = artifacts.require('ConfigurableRightsPool')
const ERC20Mock = artifacts.require('ERC20Mock');
const WETH = artifacts.require('WETH');
const BalancerProxy = artifacts.require('BalancerProxy');

module.exports = async function (deployer, network, accounts) {
    await deployer.deploy(RightsManager);
    await deployer.deploy(SmartPoolManager);
    await deployer.deploy(BFactory);
    await deployer.deploy(BalancerSafeMath);
    await deployer.deploy(BalancerSafeMathMock);
    await deployer.deploy(BalancerProxy);

    deployer.link(BalancerSafeMath, CRPFactory);
    deployer.link(RightsManager, CRPFactory);
    deployer.link(SmartPoolManager, CRPFactory);
    
    await deployer.deploy(CRPFactory);

 
    const { toWei } = web3.utils
    const MAX = web3.utils.toTwosComplement(-1)

    const dai = await deployer.deploy(ERC20Mock, 'DAI Stablecoin', 'DAI', 18);
    const weth = await deployer.deploy(WETH);
  
    await weth.deposit({ value: toWei('3') });

    const tokenAddresses = [dai.address, weth.address];
 
    const swapFee = 10 ** 15;
    const startWeights = [toWei('5'), toWei('5')];
    const startBalances = [toWei('10000'), toWei('3')];
    const SYMBOL = 'BPOOL';
    const NAME = 'Prime Balancer Pool Token';

    const permissions = {
          canPauseSwapping: true,
          canChangeSwapFee: true,
          canChangeWeights: true,
          canAddRemoveTokens: true,
          canWhitelistLPs: false,
    };

    const poolParams = {
          poolTokenSymbol: SYMBOL,
          poolTokenName: NAME,
          constituentTokens: tokenAddresses,
          tokenBalances: startBalances,
          tokenWeights: startWeights,
          swapFee: swapFee,
    };

    await console.log("   Creating 'Balancer' pool")
    await console.log("   --------------------")

    const crpFactory = await CRPFactory.deployed();
    const bfactory = await BFactory.deployed();

    POOL = await crpFactory.newCrp.call(
            bfactory.address,
            poolParams,
            permissions,
    );
    
    await crpFactory.newCrp(
            bfactory.address,
            poolParams,
            permissions,
    );

    const pool = await ConfigurableRightsPool.at(POOL);

    await dai.approve(POOL, MAX);
    await weth.approve(POOL, MAX);

    await pool.createPool(toWei('1000'));

    await console.log('> contract address: ' + (pool.address).toString())
    await console.log('> bPool address:    ' + (await pool.bPool()).toString())
};