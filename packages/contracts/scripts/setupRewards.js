const PrimeToken = artifacts.require('PrimeToken');
const StakingRewards = artifacts.require('StakingRewards');


const contracts = require('../contractAddresses.json');


module.exports = async function(callback) {
	const { toWei } = web3.utils;

    const yieldReward = toWei('500000');
    const yieldStarTime = 1603411200; // 10/23/2020 @ 12:00am (UTC)
    const yieldDuration = 7; // 7 days

	const prime = await PrimeToken.at(contracts.kovan.PrimeToken);
	const staking = await StakingRewards.at(contracts.kovan.StakingRewards);

    try {

		await console.log("***   Initializing StakingRewards");
		await staking.initialize(prime.address, contracts.kovan.ConfigurableRightsPool, yieldReward, yieldStarTime, yieldDuration);
		await console.log("***   Success");

    } catch(error) {

        await console.log(error);

    }

    callback();
}



