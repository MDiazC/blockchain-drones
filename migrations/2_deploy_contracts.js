const droneManager = artifacts.require("./DroneManager.sol");
const droneToken = artifacts.require("./DroneToken.sol");
const plotManager = artifacts.require("./PlotManager.sol");
const plotToken = artifacts.require("./PlotToken.sol");
const dronigateToken = artifacts.require("./DroniGateToken.sol");
const dronigateProxy = artifacts.require("./DroniGateProxy.sol");

module.exports = async function(deployer) {
  const accounts = await web3.eth.getAccounts();
	const owner = accounts[0];

  // deploy DroneToken contract
  await deployer.deploy(droneToken, "Drone Token", "DRTK", {gas:4000000});
  const droneTokenAddress = droneToken.address;

  //deploy dront manager contract
  await deployer.deploy(droneManager, droneTokenAddress, {gas:4000000});
  const droneManagerAddress = droneManager.address;

  //we are going to transfer the ownership of droneToken to the recently deployed droneManager contract
  const droneTokenInstance = new web3.eth.Contract(droneToken.abi, droneToken.address);
  await droneTokenInstance.methods.addMinter(droneManagerAddress).send({from: owner});
  await droneTokenInstance.methods.renounceMinter().send({from: owner});
  await droneTokenInstance.methods.transferOwnership(droneManagerAddress).send({from: owner});

  //deploy plot token contract
  await deployer.deploy(plotToken, "Plot Token", "PLTK", {gas:4000000});
  const plotTokenAddress = plotToken.address;

  //deply plot manager contract
  await deployer.deploy(plotManager, plotTokenAddress, {gas:4000000});
  const plotManagerAddress = plotManager.address;

  //we are going to transfer the ownership of plotToken to the recently deployed plotManager contract
  const plotTokenInstance = new web3.eth.Contract(plotToken.abi, plotToken.address);
  await plotTokenInstance.methods.addMinter(plotManagerAddress).send({from: owner});
  await plotTokenInstance.methods.renounceMinter().send({from: owner});
  await plotTokenInstance.methods.transferOwnership(plotManagerAddress).send({from: owner});

  // deploy pay token
  await deployer.deploy(dronigateToken, owner, 100000, {gas:4000000});
  const dronigateTokenAddress = dronigateToken.address;

  //deploy drone proxy token
  await deployer.deploy(dronigateProxy, droneManagerAddress, plotManagerAddress, dronigateTokenAddress, {gas:5000000});
  const dronigateProxyAddress = dronigateProxy.address;

  //we are going to transfer the ownership of payment token to the recently deployed drone proxy contract
  const dronigateTokenInstance = new web3.eth.Contract(dronigateToken.abi, dronigateToken.address);
  await dronigateTokenInstance.methods.transferOwnership(dronigateProxyAddress).send({from: owner});
  await dronigateTokenInstance.methods.transfer(dronigateProxyAddress, 100000).send({from: owner});

  //transfer ownership for plot manager contract to proxy contract
  const plotManagerInstance = new web3.eth.Contract(plotManager.abi, plotManager.address);
  await plotManagerInstance.methods.transferOwnership(dronigateProxyAddress).send({from: owner});

  //transfer ownership for plot manager contract to proxy contract
  const droneManagerInstance = new web3.eth.Contract(droneManager.abi, droneManager.address);
  await droneManagerInstance.methods.transferOwnership(dronigateProxyAddress).send({from: owner});


};
