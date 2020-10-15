let HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  networks: {
      rinkeby: {
          provider: function() {
              return new HDWalletProvider(process.env.KEY, process.env.PROVIDER);
          },
          network_id: 4,
          networkCheckTimeout: 100000000
      },
      development: {
          host: "127.0.0.1",
          port: 8545,
          network_id: "*" // Match any network id
      }
  },
  compilers: {
    solc: {
      version: "0.5.13",
      //docker: true,
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      }
    }
  }
};
