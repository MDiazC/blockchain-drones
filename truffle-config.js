const path = require("path");

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    alastria: {
      host: "127.0.0.1",     // Localhost
      port: 22001,            // Puerto del nodo
      network_id: "*",       // Cualquier id de red
      gas: 0xfffffff,
      gasPrice: 0x0,
      from: "0x74d4c56d8dcbc10a567341bfac6da0a8f04dc41d"
     },
    ganache: {
      host: "127.0.0.1",     // Localhost
      port: 8545,            // Puerto del nodo
      network_id: "*"
   }
 },
 compilers: {
    solc: {
       version: "0.4.24",    // Fetch exact version from solc-bin (default: truffle's version)
    }
  }
};
