pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/DroniGateProxy.sol";
//to use this test  we need to uncomment the modifier 'onlyOwner' at the very end of DroniGateProxy contract
contract TestDroniGate {
uint public initialBalance = 50 ether;

  function testItIsDeployed() public {
    DroniGateProxy droniGateProxy = DroniGateProxy(DeployedAddresses.DroniGateProxy());

    Assert.equal(droniGateProxy.sayHello(), "Hello World!", "IsDesployed test not working");
  }

  function testItCreateDestroyDrone() public {

    DroniGateProxy droniGateProxy = DroniGateProxy(DeployedAddresses.DroniGateProxy());
    (uint256 [] memory dronesIds,bool[] memory dronesStatus, uint256 dronesAdded) = droniGateProxy.getAllDrones();

    Assert.equal(dronesAdded, 0, "Number of drones before createincorrect");

    droniGateProxy.createDrone(100,10,1,2);

    (dronesIds, dronesStatus, dronesAdded) = droniGateProxy.getAllDrones();
    Assert.equal(dronesAdded, 1, "Number of drones after create incorrect");

    droniGateProxy.destroyDrone(1);

    (dronesIds, dronesStatus, dronesAdded) = droniGateProxy.getAllDrones();
    Assert.equal(dronesAdded, 0, "Number of drones after destroy incorrect");

  }

  function testItCreateDestroyPlot() public {

    DroniGateProxy droniGateProxy = DroniGateProxy(DeployedAddresses.DroniGateProxy());
    PlotToken plotToken = PlotToken(DeployedAddresses.PlotToken());
    droniGateProxy.whitelistAddress(address(this));

    (uint256 [] memory plotsIds,bool[] memory plotsStatus, uint256 plotsAdded) = droniGateProxy.getAllPlotsByOwner();
    Assert.equal(plotsAdded, 0, "Number of plots before createincorrect");

    droniGateProxy.createPlot(100,10,1);

    (plotsIds, plotsStatus, plotsAdded) = droniGateProxy.getAllPlotsByOwner();
    plotToken.approve(DeployedAddresses.PlotManager(), plotsIds[0]);
    Assert.equal(plotsAdded, plotsIds[0], "Number of drones after create incorrect");

    droniGateProxy.destroyPlot(plotsIds[0]);

    (plotsIds, plotsStatus, plotsAdded) = droniGateProxy.getAllPlotsByOwner();
    Assert.equal(plotsAdded, 0, "Number of drones after destroy incorrect");
  }

  function testItBuyTokens() public {

    DroniGateProxy droniGateProxy = DroniGateProxy(DeployedAddresses.DroniGateProxy());
    DroniGateToken droniGateToken = DroniGateToken(DeployedAddresses.DroniGateToken());
    droniGateProxy.whitelistAddress(address(this));

    uint256 tokens = droniGateProxy.getTokens();
    Assert.equal(tokens, 0, "Number of tokens before buying");

    uint256 tokens_to_buy = 3;
    droniGateProxy.BuyTokens.value(3 ether)();
    droniGateToken.increaseAllowance(DeployedAddresses.DroniGateProxy(), 3);

    tokens = droniGateProxy.getTokens();
    Assert.equal(tokens, tokens_to_buy, "Number of tokens before buying");
  }

  function testItLaunchFumigation() public {

    DroniGateProxy droniGateProxy = DroniGateProxy(DeployedAddresses.DroniGateProxy());
    DroniGateToken droniGateToken = DroniGateToken(DeployedAddresses.DroniGateToken());
    PlotToken plotToken = PlotToken(DeployedAddresses.PlotToken());
    droniGateProxy.whitelistAddress(address(this));

    //create drone
    uint256 defined_drone_cost = 2;
    droniGateProxy.createDrone(110,5,1,defined_drone_cost);
    //check drone creacted
    (uint256 [] memory dronesIds,bool [] memory dronesStatus,uint256 dronesAdded) = droniGateProxy.getAllDrones();
    Assert.equal(dronesAdded, 1, "Number of drones after create incorrect");
    Assert.isAbove(dronesIds[dronesAdded-1], 0, "Plot id incorrect");

    //create plot
    droniGateProxy.createPlot(100,10,1);
    (uint256 [] memory plotsIds,bool [] memory plotsStatus,uint256 plotsAdded) = droniGateProxy.getAllPlotsByOwner();
    Assert.equal(plotsAdded, 1, "Number of drones after create incorrect");
    Assert.isAbove(plotsIds[plotsAdded-1], 0, "Plot id incorrect");
    plotToken.approve(DeployedAddresses.PlotManager(), plotsIds[plotsAdded-1]);

    /*
    //buy tokens.
    //For some reason if I try to buy more tokens it returns an 'out of gas' error
    //As we bought tokens in the previous test we don't need to buy more, we 'use' those tokens
    uint256 tokens_to_buy = 3;
    droniGateProxy.BuyTokens.value(3 ether)();
    uint256 tokens = droniGateProxy.getTokens();
    droniGateToken.increaseAllowance(DeployedAddresses.DroniGateProxy(), 3);
    Assert.equal(tokens, tokens_to_buy, "Number of tokens before buying");
    */

    //request fumigation
    (uint256 droneId, uint256 cost) = droniGateProxy.requestFumigation(plotsIds[plotsAdded-1]);
    Assert.isAbove(droneId, 0, "Drone id incorrect");
    Assert.equal(cost, defined_drone_cost, "Cost incorrect");
    Assert.notEqual(cost, 1, "Cost incorrect");
    Assert.notEqual(cost, 0, "Cost incorrect");

    //launch fumigation
    droniGateProxy.bookDrone(plotsIds[plotsAdded-1], droneId);

    //check plot is busy
    (plotsIds, plotsStatus, plotsAdded) = droniGateProxy.getAllPlotsByOwner();
    Assert.equal(plotsAdded, 1, "Number of drones after create incorrect");
    Assert.isFalse(plotsStatus[plotsAdded-1], "error in plot status");

    //check drone is busy
    (dronesIds, dronesStatus, dronesAdded) = droniGateProxy.getAllDrones();
    Assert.equal(dronesAdded, 1, "Number of drones after create incorrect");
    Assert.isFalse(dronesStatus[dronesAdded-1], "error in drone status");
  }
}
