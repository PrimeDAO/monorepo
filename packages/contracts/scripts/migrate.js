const DAOstackMigration = require('@daostack/migration');
const specs = require('./primeDAO.json');
const contracts = require('../contractAddresses.json');

const migrate = async () => {

  specs.CustomSchemes[0].address = contracts.rinkeby.BalancerProxy;
  specs.CustomSchemes[1].params[2] = contracts.rinkeby.BalancerProxy;

  const options = {
    arcVersion: '0.0.1-rc.44',
    network: "rinkeby",
    provider: "https://rinkeby.infura.io/v3/dcc8666668a54add9186aefcd22f23bf",
    privateKey: '0x4993eebcf49f8136809b4231fea1e311e78637f16bea9b8cde34faaf6999a97c',
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
