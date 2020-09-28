let HDWalletProvider = require("@truffle/hdwallet-provider");
let privateKey="7847a6d27aad97d4c6fdc93f47ccd386f3a9da8065eaf1a64db5a284fe6ba76d"; 

module.exports = {
  networks: {
      rinkeby: {
          provider: function() {
              return new HDWalletProvider(privateKey,"https://rinkeby.infura.io/v3/dcc8666668a54add9186aefcd22f23bf");
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
