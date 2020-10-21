const RightsManager = artifacts.require('RightsManager');
const SmartPoolManager = artifacts.require('SmartPoolManager');
const CRPFactory = artifacts.require('CRPFactory');
const BFactory = artifacts.require('BFactory');
const BalancerSafeMath = artifacts.require('BalancerSafeMath');
const BalancerSafeMathMock = artifacts.require('BalancerSafeMathMock');
const ConfigurableRightsPool = artifacts.require('ConfigurableRightsPool')
const ERC20Mock = artifacts.require('ERC20Mock');
const USDP = artifacts.require('USDP');
const WETH = artifacts.require('WETH');
const BalancerProxy = artifacts.require('BalancerProxy');
const PrimeToken = artifacts.require('PrimeToken');
const PriceOracle = artifacts.require('PriceOracle');

const StakingRewards = artifacts.require('StakingRewards');


const contracts = require('../contractAddresses.json');
const fs = require("fs");

module.exports = async function (deployer, network) {
    const { toWei } = web3.utils
    const MAX = web3.utils.toTwosComplement(-1)

    if (network === 'kovan') {
        let primeSupply = toWei('90000000');
        let bPrime = toWei('10000');
        let yieldReward = toWei('500000');
        let yieldStarTime = 1603324800; // 10/22/2020 @ 12:00am (UTC)
        let yieldDuration = 7; // 7 days

        // USDC uses 6 decimals 
        const usdpSupply = (BigInt(100000 * 1000000)).toString();
        const usdpAmount = (BigInt(40000 * 1000000)).toString();

        await deployer.deploy(USDP, 6, usdpSupply);
        await deployer.deploy(PrimeToken, primeSupply, primeSupply, deployer.networks.kovan.from);

        // // NOTE: I don't know why is it needed, maybe some kovan issue
        let primeAddress = await PrimeToken.address;
        let usdpAddress = await USDP.address;
        let prime = await PrimeToken.at(primeAddress);
        let usdp = await  USDP.at(usdpAddress);

        // await console.log(prime);

        contracts.kovan.PrimeToken = prime.address;
        contracts.kovan.USDP = usdp.address;

        let crpFactory = await CRPFactory.at(contracts.kovan.CRPFactory);
        let bfactory = await CRPFactory.at(contracts.kovan.BFactory);

        const tokenAddresses = [prime.address, usdp.address];
        const swapFee = toWei('0.01') ;
        const startWeights = [toWei('32'), toWei('8')];
        const startBalances = [toWei('500000'), usdpAmount];

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

        await console.log("   Deploying a PRIME Configurable Rights Pool");
        await console.log("   --------------------");

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

        await console.log("   New crpPool was returned from CRPFactory.newCRP() ");
        await console.log("   --------------------");

        const pool = await ConfigurableRightsPool.at(POOL);

        await console.log("   Approving tokens for public swapping");

        await usdp.approve(POOL, MAX);
        await prime.approve(POOL, MAX);

        await console.log("   Consuming the collateral; mint and xfer N BPTs to caller ");
        await console.log("   --------------------");

        await pool.createPool(bPrime);

        contracts.kovan.BalancerProxy = await pool.address;
        contracts.kovan.CRPFactory = await pool.bPool();

        const staking = await deployer.deploy(StakingRewards);

        await console.log("   Initializing StakingRewards");
        await console.log("   --------------------");

        await staking.initialize(prime.address, pool.address, yieldReward, yieldStarTime, yieldDuration);

        await console.log("   Transfering PRIME to StakingRewards contract and calling notifyRewardAmount");
        await console.log("   --------------------");

        await prime.trasfer(staking.address, yieldReward);
        await staking.notifyRewardAmount(yieldReward);  

        contracts.kovan.StakingRewards = await StakingRewards.address;

        // overwrite contranctAddresses.json
        fs.writeFile('./contractAddresses.json', JSON.stringify(contracts), (err) => {
           if (err) throw err;
         });
    }
    else if (network === 'rinkeby') {
        // deploy balancer configurable rights pool
        await deployer.deploy(RightsManager);
        await deployer.deploy(SmartPoolManager);
        await deployer.deploy(BFactory);
        await deployer.deploy(BalancerSafeMath);
        await deployer.deploy(BalancerSafeMathMock);
        await deployer.deploy(BalancerProxy);
        await deployer.deploy(PriceOracle);

        await deployer.link(BalancerSafeMath, CRPFactory);
        await deployer.link(RightsManager, CRPFactory);
        await deployer.link(SmartPoolManager, CRPFactory);

        await deployer.deploy(CRPFactory);

        // overwrite contrancts object
        contracts.rinkeby.RightsManager = await RightsManager.address
        contracts.rinkeby.SmartPoolManager = await SmartPoolManager.address
        contracts.rinkeby.BFactory = await BFactory.address
        contracts.rinkeby.BalancerSafeMath = await BalancerSafeMath.address
        contracts.rinkeby.BalancerSafeMathMock = await BalancerSafeMathMock.address
        contracts.rinkeby.BalancerProxy = await BalancerProxy.address
        contracts.rinkeby.CRPFactory = await CRPFactory.address
        contracts.rinkeby.PriceOracle = await PriceOracle.address

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

        await console.log('> ConfigurableRightsPool address: ' + (pool.address).toString())
        await console.log('> Balancer Pool address:    ' + (await pool.bPool()).toString())

        // overwrite contranctAddresses.json
        fs.writeFile('./contractAddresses.json', JSON.stringify(contracts), (err) => {
           if (err) throw err;
         });
    }
};
