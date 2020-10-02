let HDWalletProvider = require("@truffle/hdwallet-provider");
let privateKey = process.env.KEY;

module.exports = {
  networks: {
      rinkeby: {
          provider: function() {
              return new HDWalletProvider(privateKey, process.env.PROVIDER);
          },
          network_id: 4
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
