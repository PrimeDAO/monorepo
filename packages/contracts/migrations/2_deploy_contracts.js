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
const PrimeToken = artifacts.require('PrimeToken');

const contracts = require('../contractAddresses.json');
const FileSystem = require("fs");

module.exports = async function (deployer, network) {
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

    if (network === 'rinkeby') {
        // overwrite contractAddresses.json
        contracts.rinkeby.RightsManager = await RightsManager.address
        contracts.rinkeby.SmartPoolManager = await SmartPoolManager.address
        contracts.rinkeby.BFactory = await BFactory.address
        contracts.rinkeby.BalancerSafeMath = await BalancerSafeMath.address
        contracts.rinkeby.BalancerSafeMathMock = await BalancerSafeMathMock.address
        contracts.rinkeby.BalancerProxy = await BalancerProxy.address
        contracts.rinkeby.CRPFactory = await CRPFactory.address

        const { toWei } = web3.utils
        const MAX = web3.utils.toTwosComplement(-1)

        // TODO: add gnosis safe setup
        const prime = await deployer.deploy(PrimeToken, toWei('21000000'), toWei('90000000'), deployer.networks.rinkeby.from);
        const dai = await deployer.deploy(ERC20Mock, 'DAI Stablecoin', 'DAI', 18);
        const weth = await deployer.deploy(WETH);

        await weth.deposit({ value: toWei('3') });

        const tokenAddresses = [prime.address, dai.address, weth.address];
     
        const swapFee = 10 ** 15;
        const startWeights = [toWei('12'), toWei('1.5'), toWei('1.5')];
        const startBalances = [toWei('500000'), toWei('10000'), toWei('3')];
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
        await prime.approve(POOL, MAX);

        await pool.createPool(toWei('1000'));

        contracts.rinkeby.BalancerProxy = await pool.address
        contracts.rinkeby.CRPFactory = await pool.bPool()

        await console.log('> contract address: ' + (pool.address).toString())
        await console.log('> bPool address:    ' + (await pool.bPool()).toString())  

        FileSystem.writeFile('../contractAddresses.json', JSON.stringify(contracts), (err) => {
           if (e) throw e;
         });
    }
};