const StakingRewards = artifacts.require('StakingRewards');

const contracts = require('../../contractAddresses.json');

module.exports = async function(callback) {

    const yieldReward = toWei('500000');

	const staking = await StakingRewards.at(contracts.kovan.StakingRewards);

    try {

		await console.log("***   Notifying reward amount");
		await staking.notifyRewardAmount(yieldReward);  
		await console.log("***   Success: notifyRewardAmount");

    } catch(error){

        await console.log(error);

    }

    callback();
}
