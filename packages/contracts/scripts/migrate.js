const DAOstackMigration = require('@daostack/migration');
const specs = require('./primeDAO.json');

const migrate = async () => {

  specs.CustomSchemes[0].address = "0x335ab915f42cfaeab50f51823af8f4b3905ea881";
  specs.CustomSchemes[1].params[2] = "0x335ab915f42cfaeab50f51823af8f4b3905ea881";

  const options = {
    arcVersion: '0.0.1-rc.44',
    network: "rinkeby",
    provider: "https://rinkeby.infura.io/v3/dcc8666668a54add9186aefcd22f23bf",
    privateKey: '7847a6d27aad97d4c6fdc93f47ccd386f3a9da8065eaf1a64db5a284fe6ba76d',
    customAbisLocation: './build/contracts',
    gasPrice: 20,
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
