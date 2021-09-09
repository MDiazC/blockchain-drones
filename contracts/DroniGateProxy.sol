pragma solidity 0.4.24;

import "./ownership/Ownable.sol";
import "./DroneManager.sol";
import "./DroniGateToken.sol";
import "./PlotManager.sol";

contract DroniGateProxy is Ownable{

  bool contractActive;
  DroneManager droneManContract;
  PlotManager plotManContract;
  DroniGateToken droniGateTknContract;
  mapping (address => bool) addressWhitelist;

  modifier isContractActive() {
      require(contractActive == true, "Contract is not active");
       _;
   }

   modifier whitelistedAddress(address addr) {
       require(addressWhitelist[addr] == true, "You are not allowed to acces here");
        _;
    }

  // Drone related events
   event FumigationStarted(uint256 _plotId, address addr);
   event DroneBooked(uint256 _droneId, address addr);

   // Drone related events
    event DroneCreated(uint256 _droneId);
    event DroneRemoved(uint256 _droneId);
    event DroneBlocked(uint256 _droneId, address addr);

    // Plot related events
     event PlotCreated(uint256 _plotId, address _owner);
     event PlotRemoved(uint256 _plotId, address _owner);
     event PlotBlocked(uint256 _plotId, address _owner);

     event TokensPurchased(uint256 quantity, address addr);

     constructor (address _droneManAddres, address _plotManAddres, address _tknAddres) public{
         require(_droneManAddres != address(0x0), "Drone manager address given invalid");
         require(_plotManAddres != address(0x0), "Plot manager address given invalid");
         require(_tknAddres != address(0x0), "Plot manager address given invalid");
         droneManContract = DroneManager(_droneManAddres);
         plotManContract = PlotManager(_plotManAddres);
         droniGateTknContract = DroniGateToken(_tknAddres);
         contractActive = true;
       }

    function createDrone(uint256 max_height, uint256 min_height, uint256 pesticide, uint256 cost) public onlyOwner isContractActive {

      require(max_height > 0, "Max height value incorrect");
      require(min_height > 0, "Min height value incorrect");
      require(cost > 0, "Cost value incorrect");
      require(pesticide >= 0, "Pesticide incorrect");
      require(pesticide < 5, "Pesticide incorrect");

      uint256 droneId = droneManContract.createDrone(max_height, min_height, pesticide, cost);
      emit DroneCreated(droneId);
    }

    function destroyDrone(uint256 droneId) public onlyOwner isContractActive {
      require(droneId > 0, "Drone id is incorrect");
      droneManContract.destroyDrone(droneId);
      emit DroneRemoved(droneId);
    }

    function getAllDrones() public view onlyOwner isContractActive returns(uint256 [] memory,bool[] memory, uint256){
      return droneManContract.getAllDrones();
    }

    function deleteDroneManagerContract() public onlyOwner isContractActive{
      droneManContract.deleteContract();
    }

    function changeDroneManagerContract(address contractAddress) public onlyOwner isContractActive{
      require(contractAddress != address(0x0), "Drone manager address given invalid");
      droneManContract.deleteContract();
      droneManContract = DroneManager(contractAddress);
    }

    function createPlot(uint256 max_height, uint256 min_height, uint256 pesticide) public isContractActive whitelistedAddress(msg.sender) returns(uint256) {
      require(max_height > 0, "Max height value incorrect");
      require(min_height > 0, "Min height value incorrect");
      require(pesticide >= 0, "Pesticide incorrect");
      require(pesticide < 5, "Pesticide incorrect");

      uint256 plotId = plotManContract.createPlot(max_height, min_height, pesticide, msg.sender);
      emit PlotCreated(plotId, msg.sender);
      return plotId;
    }

    function destroyPlot(uint256 plotId) public isContractActive  whitelistedAddress(msg.sender){
      require(plotId > 0, "Plot id incorrect");
      plotManContract.destroyPlot(plotId, msg.sender);
      emit PlotRemoved(plotId, msg.sender);
    }

    function getAllPlotsByOwner() public view isContractActive whitelistedAddress(msg.sender) returns(uint256 [] memory, bool[] memory, uint256){
      return plotManContract.getAllPlotsByOwner(msg.sender);
    }

    function deletePlotManagerContract() public onlyOwner isContractActive{
      plotManContract.deleteContract();
    }

    function changePlotManagerContract(address contractAddress) public onlyOwner isContractActive{
      require(contractAddress != address(0x0), "Drone manager address given invalid");
      plotManContract.deleteContract();
      plotManContract = PlotManager(contractAddress);
    }

    function requestFumigation(uint256 plotId) public view isContractActive whitelistedAddress(msg.sender) returns(uint256, uint256){
      require(plotId > 0, "Plot id incorrect");
      uint256 max_height;
      uint256 min_height;
      uint256 pesticide;

      (max_height, min_height, pesticide) = validatePlot(plotId);

      return matchDronPlot(max_height, min_height, pesticide);
    }

    function validatePlot(uint256 plotId) view internal returns (uint256, uint256, uint256){
      uint256 max_height;
      uint256 min_height;
      uint256 pesticide;
      address owner;

      (max_height, min_height, pesticide, owner) = plotManContract.getPlot(plotId);
      require(owner == msg.sender, "You can't acess to this plot information");

      bool plotAvailable = plotManContract.isPlotAvailable(plotId);
      require(plotAvailable, "The plot is not available");

      return (max_height, min_height, pesticide);
    }

    function matchDronPlot(uint256 plot_max_height, uint256 plot_min_height, uint256 plot_pesticide) view internal returns (uint256, uint256){
      uint256 [] memory dronesIds;
      uint256 dronesAdded;
      (dronesIds, dronesAdded) = droneManContract.getDronesByPesticide(plot_pesticide);

      require(dronesAdded > 0, "There are no drones available");

      uint256 cheapestDroneId;
      uint256 cheapestDroneCost = 100000;
      uint256 i;
      uint256 drone_max_height;
      uint256 drone_min_height;
      uint256 drone_pesticide;
      uint256 cost;

      for(i=0;i<dronesAdded;i++){
        (drone_max_height, drone_min_height, drone_pesticide, cost) = droneManContract.getDrone(dronesIds[i]);
        if(drone_max_height >= plot_max_height && drone_min_height <= plot_min_height && cheapestDroneCost > cost){
          cheapestDroneId = dronesIds[i];
          cheapestDroneCost = cost;
        }
      }

      require(cheapestDroneId >= 0, "No drones available");

      return (cheapestDroneId, cheapestDroneCost);
    }

    function bookDrone(uint256 plotId, uint256 droneId) public payable whitelistedAddress(msg.sender) isContractActive{
      require(plotId > 0, "Plot id incorrect");
      require(droneId > 0, "Drone id incorrect");
      uint256 balance = droniGateTknContract.allowance(msg.sender, address(this));
      require(balance > 0, "You have no credit");

      bool plotAvailable = plotManContract.isPlotAvailable(plotId);
      require(plotAvailable, "The plot is not available");

      bool droneAvailable = droneManContract.isDroneAvailable(droneId);
      require(droneAvailable, "The drone is not available");

      uint256 max_height;
      uint256 min_height;
      uint256 pesticide;
      uint256 cost;

      (max_height, min_height, pesticide, cost) = droneManContract.getDrone(droneId);
      require(balance >= cost, "You don't have enough credit");

      droniGateTknContract.transferFrom(msg.sender, address(this), cost);

      plotManContract.blockPlot(plotId, msg.sender);
      droneManContract.blockDrone(droneId);

      emit DroneBlocked(droneId, msg.sender);
      emit PlotBlocked(droneId, msg.sender);

      emit FumigationStarted(plotId, msg.sender);
      emit DroneBooked(droneId, msg.sender);
    }

    function deleteTokenContract() public onlyOwner isContractActive{
      droniGateTknContract.deleteContract();
    }

    function changeTokenContract(address contractAddress) public onlyOwner isContractActive{
      require(contractAddress != address(0x0), "Drone manager address given invalid");
      droniGateTknContract.deleteContract();
      droniGateTknContract = DroniGateToken(contractAddress);
    }

    function transfernOwnership(address newOwner) public onlyOwner isContractActive{
        transferOwnership(newOwner);
    }

    function deleteContract() public onlyOwner isContractActive{
        droneManContract.deleteContract();
        plotManContract.deleteContract();
        droniGateTknContract.deleteContract();
        selfdestruct(msg.sender);
    }

    function disableContract() public isContractActive{
        contractActive = false;
    }

    function enableContract() public {
        require(contractActive == false, "Contract is already active");
        contractActive = true;
    }

    function() external payable {
        require(false, "Function you are calling doesn't exists");
    }

    function withdraw() onlyOwner public{
        uint256 amount = address(this).balance;
        owner().transfer(amount);
    }

    function whitelistAddress (address addr) onlyOwner public {
        addressWhitelist[addr] = true;
    }

    function removeWhitelistAddress (address addr) onlyOwner public{
        addressWhitelist[addr] = false;
    }

    function buyTokens() public payable {
      require(msg.value != 0, "Value sent is incorrect");
      uint256 tokens = msg.value /(1 ether);
      droniGateTknContract.transfer(msg.sender, tokens);
      emit TokensPurchased(tokens, msg.sender);
    }

    function getTokens() public view returns(uint256) {
        return droniGateTknContract.balanceOf(msg.sender);
    }

    // for testing purposes. need to be removed

    function sayHello () pure public returns (string memory){ return "Hello World!"; }

/*
    //only active when doing unit tests in .sol
    modifier onlyOwner() {
         _;
     }*/

}
