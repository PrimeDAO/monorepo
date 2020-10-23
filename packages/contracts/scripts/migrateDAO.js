require('dotenv').config();

const DAOstackMigration = require('@daostack/migration');
const specs = require('./primeDAO.json');
const contracts = require('../contractAddresses.json');

const migrateDAO = async () => {

  specs.CustomSchemes[0].address = contracts.kovan.BalancerProxy;
  specs.CustomSchemes[0].params = [contracts.kovan.ConfigurableRightsPool, contracts.kovan.BPool];
  specs.CustomSchemes[1].params[2] = contracts.kovan.BalancerProxy;
  specs.CustomSchemes[2].params[5] = contracts.kovan.PriceOracle;
  specs.CustomSchemes[2].params[6] = "0x0000000000000000000000000000000000000000";

  const options = {
    arcVersion: '0.0.1-rc.44',
    network: process.env.NETWORK,
    provider: process.env.PROVIDER,
    privateKey: '0x'+process.env.KEY,
    customAbisLocation: './build/contracts',
    gasPrice: 10,
    quiet: false,
    force: true,
    restart: true,
    params: {
      kovan: specs,
    },
  };

  const result = await DAOstackMigration.migrateDAO(options);
  console.log('+ Deployed DAO at ' + result.dao['0.0.1-rc.44'].Avatar);
};

migrateDAO();
