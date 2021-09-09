pragma solidity 0.4.24;

import "./ownership/Ownable.sol";
import "./PlotToken.sol";

contract PlotManager is Ownable {

    address plotContractAddress;

     struct Plot {
       uint256 _id;
       address _owner;
       uint256 _max_height;
       uint256 _min_height;
       uint256 _pesticide;
       bool _available;
       bool _exists;
   }

   PlotToken plotTknContract;
   bool contractActive;
   mapping (uint256 => Plot) Plots;

   modifier isContractActive() {
       require(contractActive == true, "Contract is not active");
        _;
    }

   modifier plotExists(uint256 plotId) {
       require(plotId > 0, "Plot selected incorrect");
       require(Plots[plotId]._exists == true, "Plot doesn't exists.");
        _;
    }

    constructor (address _plotTknAddres) public{
        require(_plotTknAddres != address(0x0), "Adress given invalid");
        plotTknContract = PlotToken(_plotTknAddres);
        contractActive = true;
    }

    function createPlot(uint256 max_height, uint256 min_height, uint256 pesticide, address owner) public onlyOwner isContractActive returns(uint256){
      uint256 plotId = plotTknContract.mint(owner);

      Plot memory newPlot = Plot({
          _id: plotId,
          _owner: owner,
          _max_height: max_height,
          _min_height: min_height,
          _pesticide: pesticide,
          _available: true,
          _exists: true
      });
      Plots[plotId] = newPlot;

      return plotId;
    }

    function destroyPlot(uint256 plotId, address owner) public onlyOwner isContractActive plotExists(plotId) {
      require(Plots[plotId]._owner == owner, "You can't destroy to this plot information");
      plotTknContract.burn(plotId);
      delete Plots[plotId];
    }

    function getPlot(uint256 plotId) public view onlyOwner plotExists(plotId) isContractActive returns(uint256, uint256, uint256, address) {
      return (Plots[plotId]._max_height, Plots[plotId]._min_height, Plots[plotId]._pesticide, Plots[plotId]._owner);
    }

    function getAllPlotsByOwner(address owner) public view onlyOwner isContractActive returns(uint256 [] memory, bool[] memory, uint256){
      uint256 numberOfPlots = plotTknContract.balanceOf(owner);
      uint256 [] memory plotsIds = new uint256[](numberOfPlots);
      bool [] memory plotsStatus = new bool[](numberOfPlots);
      uint256 i;
      uint256 plotId;
      uint256 plostAdded;

      for(i=0;i<numberOfPlots;i++){
        plotId = plotTknContract.tokenByIndex(i);
        if(Plots[plotId]._exists == false){
            continue;
        }
        plotsIds[plostAdded] = plotId;
        plotsStatus[plostAdded] = Plots[plotId]._available;
        plostAdded++;
      }

      return (plotsIds, plotsStatus, plostAdded);
    }

    function isPlotAvailable(uint256 plotId) public view isContractActive plotExists(plotId) returns(bool){
      return Plots[plotId]._available;
    }

    function blockPlot(uint256 plotId, address owner) public onlyOwner isContractActive plotExists(plotId) {
      require(Plots[plotId]._owner == owner, "You can't block to this plot");
      Plots[plotId]._available = false;
    }

    function freePlot(uint256 plotId, address owner) public onlyOwner isContractActive plotExists(plotId) {
      require(Plots[plotId]._owner == owner, "You can't free to this plot");
      Plots[plotId]._available = true;
    }

    function transfernOwnership(address newOwner) public onlyOwner isContractActive{
        transferOwnership(newOwner);
    }

    function deleteContract() public onlyOwner isContractActive{
        plotTknContract.deleteContract();
        selfdestruct(msg.sender);
    }

    function disableContract() public onlyOwner isContractActive{
        contractActive = false;
    }

    function enableContract() public onlyOwner {
        require(contractActive == false, "Contract is already active");
        contractActive = true;
    }
}
