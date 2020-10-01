const DAOstackMigration = require('@daostack/migration');
const specs = require('./primeDAO.json');

const migrate = async () => {
  // const { log, get } = bre.deployments;

  // const proxy = await get('BalancerProxy');
  // specs.CustomSchemes[0].address = proxy.address;
  // specs.CustomSchemes[1].params[2] = proxy.address;

  const options = {
    network: "rinkeby",
    provider: "https://rinkeby.infura.io/v3/dcc8666668a54add9186aefcd22f23bf",
    privateKey: process.env.KEY || '7847a6d27aad97d4c6fdc93f47ccd386f3a9da8065eaf1a64db5a284fe6ba76d',
    customAbisLocation: './artifacts',
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
