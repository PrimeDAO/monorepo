let HDWalletProvider = require("@truffle/hdwallet-provider");
let privateKey="4993eebcf49f8136809b4231fea1e311e78637f16bea9b8cde34faaf6999a97c"; 

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
