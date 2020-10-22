const CRPFactory = artifacts.require("CRPFactory");
const ConfigurableRightsPool = artifacts.require("ConfigurableRightsPool");
const PrimeToken = artifacts.require('PrimeToken');
const USDC = artifacts.require('IERC20');

const contracts = require('../contractAddresses.json');

const fs = require("fs");

module.exports = async function(callback) {
	const { toWei } = web3.utils;
	const MAX = web3.utils.toTwosComplement(-1);

	// pool params
	const usdcAmount = (BigInt(40000 * 1000000)).toString();
	const swapFee = toWei('0.01') ;
	const tokenAddresses = [contracts.kovan.PrimeToken, contracts.kovan.USDC];
	const startWeights = [toWei('32'), toWei('8')];
	const startBalances = [toWei('500000'), usdcAmount];
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
	const usdc = await USDC.at(contracts.kovan.USDC);

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

	await usdc.approve(POOL, MAX);
	await prime.approve(POOL, MAX);

	await console.log("***   Success");

	await console.log("***   Consuming the collateral; mint and xfer N BPTs to caller ");

	await pool.createPool(bPrimeAmount);

	await console.log("***   Success");

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
