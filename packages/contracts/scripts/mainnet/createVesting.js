const VestingFactory = artifacts.require("VestingFactory");

const contracts = require('../../contractAddresses.json');
const config = require('../../config.json');

const fs = require("fs");

module.exports = async function(callback) {
	let tx;

    try {

		const benefeciaries = config.vesting.beneficiaries;
		const owner = config.vesting.owner;
		const start = config.vesting.start;
		const cliffDuration = config.vesting.cliffDuration;
		const duration = config.vesting.duration;

 		const factory = await VestingFactory.at(contracts.mainnet.VestingFactory);

		for (const benefeciary of benefeciaries) {

			await console.log(" ");
			await console.log("***   Creating vesting");
			await console.log(" ");
			await console.log("***   benefeciary address:");
			await console.log(" ");

		  	await console.log(benefeciary);

	 		tx = await factory.create(owner, benefeciary, start, cliffDuration, duration, true);

			await console.log(" ");
			await console.log("***   transaction id:");
			await console.log(" ");

		  	await console.log(tx.tx);

			await console.log(" ");
		  	await console.log("***   contract address:");
			await console.log(" ");

		  	await console.log(tx.logs[0].args.vestingContractAddress);

		};

		await console.log(" ");
		await console.log("***   Success");

    } catch(error){

        await console.log(error);

    }
    callback();
}
