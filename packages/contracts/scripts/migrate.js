const DAOstackMigration = require('@daostack/migration');
const specs = require('./primeDAO.json');
const contracts = require('../contractAddresses.json');

const migrate = async () => {

  specs.CustomSchemes[0].address = contracts.rinkeby.BalancerProxy;
  specs.CustomSchemes[1].params[2] = contracts.rinkeby.BalancerProxy;

  const options = {
    arcVersion: '0.0.1-rc.44',
    network: process.env.NETWORK,
    provider: process.env.PROVIDER,
    privateKey: process.env.KEY,
    customAbisLocation: './build/contracts',
    gasPrice: 10,
    quiet: false,
    force: true,
    restart: true,
    params: {
      rinkeby: specs,
    },
  };

  const result = await DAOstackMigration.migrateDAO(options);
  console.log('+ Deployed DAO at ' + result.dao['0.0.1-rc.44'].Avatar);
};

migrate();