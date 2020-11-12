const PrimeToken = artifacts.require('PrimeToken');
const StakingRewards = artifacts.require('StakingRewards');


const contracts = require('../../contractAddresses.json');
const config = require('../../config.json');


module.exports = async function(callback) {
	const { toWei } = web3.utils;

    const yieldReward = toWei(config.yieldRewards.reward);
    const yieldStarTime = config.yieldRewards.startTime;
    const yieldDuration = config.yieldRewards.duration; 

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



