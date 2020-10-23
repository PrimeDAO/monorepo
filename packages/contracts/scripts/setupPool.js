const CRPFactory = artifacts.require("CRPFactory");
const ConfigurableRightsPool = artifacts.require("ConfigurableRightsPool");
const PrimeToken = artifacts.require('PrimeToken');
const WETH = artifacts.require('WETH');

const contracts = require('../contractAddresses.json');

const fs = require("fs");

module.exports = async function(callback) {
	const { toWei } = web3.utils;
	const MAX = web3.utils.toTwosComplement(-1);

	// pool params
	const primeAmount = toWei('50000');
	const wethAmount = toWei('30');

	const swapFee = toWei('0.01');
	const tokenAddresses = [contracts.kovan.PrimeToken, contracts.kovan.WETH];
	const startWeights = [toWei('32'), toWei('8')];
	const startBalances = [primeAmount, wethAmount];
	const SYMBOL = 'BPOOL';
	const NAME = 'Prime Balancer Pool Token';
	const bPrimeAmount = toWei('10000');

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

	const prime = await PrimeToken.at(contracts.kovan.PrimeToken);
	const weth = await WETH.at(contracts.kovan.WETH);

	const crpFactory = await CRPFactory.at(contracts.kovan.CRPFactory);

	await console.log("***   Deploying a PRIME Configurable Rights Pool");

	POOL = await crpFactory.newCrp.call(
	        contracts.kovan.BFactory,
	        poolParams,
	        permissions,
	);

	await crpFactory.newCrp(
	        contracts.kovan.BFactory,
	        poolParams,
	        permissions,
	);

	await console.log("***   Success ");

	const pool = await ConfigurableRightsPool.at(POOL);

	await console.log("***   Approving tokens for public swapping");

	await weth.approve(POOL, MAX);
	await prime.approve(POOL, MAX);

	await console.log("***   Success");

	await console.log("***   Consuming the collateral; mint and xfer N BPTs to caller ");

	await pool.createPool(bPrimeAmount);

	await console.log("***   Success");

	await console.log("***   Configurable Rights Pool address:");
	await console.log(pool.address);
	await console.log("***   Balancer Pool address:");
	await console.log(await pool.bPool());

	contracts.kovan.ConfigurableRightsPool = pool.address;
	contracts.kovan.BPool = await pool.bPool();

	// Commented out because currently it rewrites
	// contractAddresses to an empty file 
	// ¯\_(ツ)_/¯ 

    // fs.writeFile('./contractAddresses.json', JSON.stringify(contracts), (err) => {
    //    if (err) throw err;
    // });

    callback();
}
