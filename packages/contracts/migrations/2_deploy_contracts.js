const RightsManager = artifacts.require('RightsManager');
const SmartPoolManager = artifacts.require('SmartPoolManager');
const CRPFactory = artifacts.require('CRPFactory');
const BFactory = artifacts.require('BFactory');
const BalancerSafeMath = artifacts.require('BalancerSafeMath');
const BalancerSafeMathMock = artifacts.require('BalancerSafeMathMock');
const BalancerProxy = artifacts.require('BalancerProxy');
const PrimeToken = artifacts.require('PrimeToken');
const PriceOracle = artifacts.require('PriceOracle');

const StakingRewards = artifacts.require('StakingRewards');

const contracts = require('../contractAddresses.json');
const fs = require("fs");

module.exports = async function (deployer, network) {
    const { toWei } = web3.utils;

    if (network === 'kovan') {

        await deployer.deploy(PrimeToken, primeSupply, primeSupply, deployer.networks.kovan.from);
        await deployer.deploy(StakingRewards);
        await deployer.deploy(PriceOracle);
        await deployer.deploy(BalancerProxy);

        contracts.kovan.PrimeToken = PrimeToken.address;
        contracts.kovan.StakingRewards = StakingRewards.address;
        contracts.kovan.PriceOracle = PriceOracle.address;
        contracts.kovan.BalancerProxy = BalancerProxy.address;

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
        contracts.rinkeby.RightsManager = RightsManager.address;
        contracts.rinkeby.SmartPoolManager = SmartPoolManager.address;
        contracts.rinkeby.BFactory = BFactory.address;
        contracts.rinkeby.BalancerSafeMath = BalancerSafeMath.address;
        contracts.rinkeby.BalancerSafeMathMock = BalancerSafeMathMock.address;
        contracts.rinkeby.BalancerProxy = BalancerProxy.address;
        contracts.rinkeby.CRPFactory = CRPFactory.address;
        contracts.rinkeby.PriceOracle = PriceOracle.address;

        await deployer.deploy(PrimeToken, primeSupply, primeSupply, deployer.networks.kovan.from);
        await deployer.deploy(StakingRewards);

        // overwrite contranctAddresses.json
        fs.writeFile('./contractAddresses.json', JSON.stringify(contracts), (err) => {
           if (err) throw err;
         });
    }
};
