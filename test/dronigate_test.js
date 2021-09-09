var DroniGateProxy = artifacts.require("./DroniGateProxy.sol");
var PlotManager = artifacts.require("./PlotManager.sol");
var DroniGateToken = artifacts.require("./DroniGateToken.sol");
var PlotToken = artifacts.require("./PlotToken.sol");

var chai = require("./setupChai.js");
var BN = web3.utils.BN;
var expect = chai.expect;
const truffleAssert = require('truffle-assertions');

contract("TokenSale test", async (accounts) => {

  const [droneAccount, plotAccount, secondPlotAccount] = accounts;

  it("Remove from whitelist test address", async ()=> {
    var instance = await DroniGateProxy.deployed();
    await instance.removeWhitelistAddress(plotAccount, {from: droneAccount});
  });

  it("Contract deployed", async ()=> {
    var instance = await DroniGateProxy.deployed();
    return expect(await instance.sayHello()).to.be.a.equal("Hello World!");
  });

  it("Error while drone company try access plot panel", async ()=> {
    var instance = await DroniGateProxy.deployed();
    await truffleAssert.reverts(instance.getAllPlotsByOwner({from: droneAccount}), "You are not allowed to acces here");
  });

  it("Error while plot client try access drone panel", async ()=> {
    var instance = await DroniGateProxy.deployed();
    await truffleAssert.reverts(instance.getAllDrones({from: plotAccount}), "");
  });

  it("Whitelist plot account", async ()=> {
    var instance = await DroniGateProxy.deployed();
    await truffleAssert.reverts(instance.getAllPlotsByOwner({from: plotAccount}), "You are not allowed to acces here");

    await instance.whitelistAddress(plotAccount, {from: droneAccount});

    let plots = await instance.getAllPlotsByOwner({from: plotAccount});
    expect (plots[0].length).to.be.equal(0);
    expect (plots[1].length).to.be.equal(0);
    expect (plots[2]).to.be.a.bignumber.equal(new BN(0));
  });

  it("Error while plot company try create a drone", async ()=> {
    var instance = await DroniGateProxy.deployed();
    await instance.whitelistAddress(plotAccount, {from: droneAccount});

    await truffleAssert.reverts(instance.createDrone(100,10,1,2, {from: plotAccount}), "");
  });


  it("Error while drone company try create a plot", async ()=> {
    var instance = await DroniGateProxy.deployed();

    await truffleAssert.reverts(instance.createPlot(100,10,1, {from: droneAccount}), "");
  });

  it("Error while creating a drone with incorrect pesticide", async ()=> {
    var instance = await DroniGateProxy.deployed();
    let drones = await instance.getAllDrones({from: droneAccount});
    expect (drones[0].length).to.be.equal(0);
    expect (drones[1].length).to.be.equal(0);
    expect (drones[2]).to.be.a.bignumber.equal(new BN(0));

    await truffleAssert.reverts(instance.createDrone(110,5,7,2, {from: droneAccount}), "Pesticide incorrect -- Reason given: Pesticide incorrect");
  });

  it("Create and drestroy a drone", async ()=> {
    var instance = await DroniGateProxy.deployed();
    let drones = await instance.getAllDrones({from: droneAccount});
    expect (drones[0].length).to.be.equal(0);
    expect (drones[1].length).to.be.equal(0);
    expect (drones[2]).to.be.a.bignumber.equal(new BN(0));

    let drone_id = 1;
    let tx = await instance.createDrone(110,5,1,2, {from: droneAccount});
    truffleAssert.eventEmitted(tx, 'DroneCreated', (ev) => {return ev._droneId == drone_id;});

    let plots = await instance.getAllDrones({from: droneAccount});
    expect (plots[0].length).to.be.equal(1);
    expect (plots[1].length).to.be.equal(1);
    expect (plots[2]).to.be.a.bignumber.equal(new BN(1));

    tx = await instance.destroyDrone(drone_id, {from: droneAccount});
    truffleAssert.eventEmitted(tx, 'DroneRemoved', (ev) => {return ev._droneId == drone_id;});

    drones = await instance.getAllDrones({from: droneAccount});
    expect (drones[2]).to.be.a.bignumber.equal(new BN(0));
  });

  it("Error while creating a plot with incorrect pesticide", async ()=> {
    var instance = await DroniGateProxy.deployed();
    await instance.whitelistAddress(plotAccount, {from: droneAccount});

    let plots = await instance.getAllPlotsByOwner({from: plotAccount});
    expect (plots[0].length).to.be.equal(0);
    expect (plots[1].length).to.be.equal(0);
    expect (plots[2]).to.be.a.bignumber.equal(new BN(0));

    await truffleAssert.reverts(instance.createPlot(110,5,7, {from: plotAccount}), "Pesticide incorrect -- Reason given: Pesticide incorrect");
  });

  it("Create and remove a plot", async ()=> {
    var instance = await DroniGateProxy.deployed();
    var plotTokenInstance = await PlotToken.deployed();
    var plotManagerInstance = await PlotManager.deployed();
    await instance.whitelistAddress(plotAccount, {from: droneAccount});

    let plots = await instance.getAllPlotsByOwner({from: plotAccount});
    expect (plots[0].length).to.be.equal(0);
    expect (plots[1].length).to.be.equal(0);
    expect (plots[2]).to.be.a.bignumber.equal(new BN(0));

    var plot_id = 1;
    let tx = await instance.createPlot(100,10,1, {from: plotAccount});
    truffleAssert.eventEmitted(tx, 'PlotCreated', (ev) => {return ev._plotId == plot_id && ev._owner == plotAccount;});

    plots = await instance.getAllPlotsByOwner({from: plotAccount});
    expect (plots[0].length).to.be.equal(1);
    expect (plots[1].length).to.be.equal(1);
    expect (plots[2]).to.be.a.bignumber.equal(new BN(1));

    tx = await plotTokenInstance.approve(plotManagerInstance.address, plot_id, {from: plotAccount});

    tx = await instance.destroyPlot(plot_id, {from: plotAccount});
    truffleAssert.eventEmitted(tx, 'PlotRemoved', (ev) => {return ev._plotId == plot_id && ev._owner == plotAccount;});

    plots = await instance.getAllPlotsByOwner({from: plotAccount});
    expect (plots[2]).to.be.a.bignumber.equal(new BN(0));
  });

  it("Buy tokens", async ()=> {
    var instance = await DroniGateProxy.deployed();
    var droniGateTokenInstance = await DroniGateToken.deployed();
    await instance.whitelistAddress(plotAccount, {from: droneAccount});

    let current_tokens = await instance.getTokens({from: plotAccount});
    expect (current_tokens).to.be.a.bignumber.equal(new BN(0));
    var num_tokens = 3;
    var num_tokens_bn = new BN(num_tokens);
    let tx = await instance.buyTokens({value: web3.utils.toWei(num_tokens_bn, "ether"), from: plotAccount});
    truffleAssert.eventEmitted(tx, 'TokensPurchased', (ev) => {return ev.quantity == num_tokens && ev.addr == plotAccount;});

    tx = await droniGateTokenInstance.increaseAllowance(instance.address,3, {from: plotAccount});

    current_tokens = await instance.getTokens({from: plotAccount});
    expect (current_tokens).to.be.a.bignumber.equal(num_tokens_bn);

  });

  it("Error while plot company tries to destroy a drone", async ()=> {
    var instance = await DroniGateProxy.deployed();
    await instance.whitelistAddress(plotAccount, {from: droneAccount});

    let drone_id = 0;
    let tx = await instance.createDrone(110,5,1,2, {from: droneAccount});
    truffleAssert.eventEmitted(tx, 'DroneCreated', (ev) => {drone_id = ev._droneId;return ev._droneId == drone_id;});
    expect (drone_id).to.be.not.equal(0);

    await truffleAssert.reverts(instance.destroyDrone(drone_id, {from: plotAccount}), "");
  });

  it("Error while drone company try destroy a plot", async ()=> {
    var instance = await DroniGateProxy.deployed();
    var plotTokenInstance = await PlotToken.deployed();
    var plotManagerInstance = await PlotManager.deployed();

    await instance.whitelistAddress(plotAccount, {from: droneAccount});

    var plot_id = 0;
    let tx = await instance.createPlot(100,10,1, {from: plotAccount});
    truffleAssert.eventEmitted(tx, 'PlotCreated', (ev) => {plot_id = parseInt(ev._plotId);return ev._plotId == plot_id && ev._owner == plotAccount;});
    expect (plot_id).to.be.not.equal(0);

    tx = await plotTokenInstance.approve(plotManagerInstance.address, plot_id, {from: plotAccount});

    await truffleAssert.reverts(instance.destroyPlot(plot_id, {from: droneAccount}), "");
  });

  it("Error while trying to destroy a non existant drone", async ()=> {
    var instance = await DroniGateProxy.deployed();
    await instance.whitelistAddress(plotAccount, {from: droneAccount});

    let drone_id = 0;
    let tx = await instance.createDrone(110,5,1,2, {from: droneAccount});
    truffleAssert.eventEmitted(tx, 'DroneCreated', (ev) => {drone_id = ev._droneId;return ev._droneId == drone_id;});
    expect (drone_id).to.be.not.equal(0);

    drone_id ++;
    await truffleAssert.reverts(instance.destroyDrone(drone_id, {from: droneAccount}), "");
  });

  it("Error while trying to destroy a non existant plot", async ()=> {
    var instance = await DroniGateProxy.deployed();
    var plotTokenInstance = await PlotToken.deployed();
    var plotManagerInstance = await PlotManager.deployed();

    await instance.whitelistAddress(plotAccount, {from: droneAccount});

    var plot_id = 0;
    let tx = await instance.createPlot(100,10,1, {from: plotAccount});
    truffleAssert.eventEmitted(tx, 'PlotCreated', (ev) => {plot_id = parseInt(ev._plotId);return ev._plotId == plot_id && ev._owner == plotAccount;});
    expect (plot_id).to.be.not.equal(0);

    tx = await plotTokenInstance.approve(plotManagerInstance.address, plot_id, {from: plotAccount});

    plot_id++;
    await truffleAssert.reverts(instance.destroyPlot(plot_id, {from: plotAccount}), "");
  });

  it("Error while trying to destroy plot is not yours", async ()=> {
    var instance = await DroniGateProxy.deployed();
    var plotTokenInstance = await PlotToken.deployed();
    var plotManagerInstance = await PlotManager.deployed();

    await instance.whitelistAddress(plotAccount, {from: droneAccount});
    await instance.whitelistAddress(secondPlotAccount, {from: droneAccount});

    var plot_id = 0;
    let tx = await instance.createPlot(100,10,1, {from: plotAccount});
    truffleAssert.eventEmitted(tx, 'PlotCreated', (ev) => {plot_id = parseInt(ev._plotId);return ev._plotId == plot_id && ev._owner == plotAccount;});
    expect (plot_id).to.be.not.equal(0);

    tx = await plotTokenInstance.approve(plotManagerInstance.address, plot_id, {from: plotAccount});

    await truffleAssert.reverts(instance.destroyPlot(plot_id, {from: secondPlotAccount}), "");
  });

});
