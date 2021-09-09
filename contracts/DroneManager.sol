pragma solidity 0.4.24;

import "./ownership/Ownable.sol";
import "./DroneToken.sol";

contract DroneManager is Ownable {

    address droneContractAddress;

     struct Drone {
       uint256 _id;
       address _owner;
       uint256 _max_height;
       uint256 _min_height;
       uint256 _pesticide;
       uint256 _cost;
       bool _available;
       bool _exists;
   }

   DroneToken droneTknContract;
   mapping (uint256 => Drone) Drones;
   bool contractActive;

   modifier isContractActive() {
       require(contractActive == true, "Contract is not active");
        _;
    }

   modifier droneExists(uint256 droneId) {
       require(droneId > 0, "Drone selected incorrect");
       require(Drones[droneId]._exists == true, "Drone doesn't exists.");
        _;
    }

    constructor (address _droneTknAddres) public{
        require(_droneTknAddres != address(0x0), "Adress given invalid");
        droneTknContract = DroneToken(_droneTknAddres);
        contractActive = true;
    }

    function createDrone(uint256 max_height, uint256 min_height, uint256 pesticide, uint256 cost) public onlyOwner isContractActive returns (uint256){
      uint256 droneId = droneTknContract.mint();

      Drone memory newDrone = Drone({
          _id: droneId,
          _owner: address(this),
          _max_height: max_height,
          _min_height: min_height,
          _pesticide: pesticide,
          _cost: cost,
          _available: true,
          _exists: true
      });

      Drones[droneId] = newDrone;

      return droneId;
    }

    function destroyDrone(uint256 droneId) public onlyOwner isContractActive droneExists(droneId){
      droneTknContract.burn(droneId);
      delete Drones[droneId];
    }

    function getDrone(uint256 droneId) public view onlyOwner droneExists(droneId) isContractActive returns(uint256, uint256, uint256, uint256) {
      return (Drones[droneId]._max_height, Drones[droneId]._min_height, Drones[droneId]._pesticide, Drones[droneId]._cost);
    }

    function getAllDrones() public view onlyOwner isContractActive returns(uint256 [] memory,bool[] memory, uint256){
      uint256 numberOfDrones = droneTknContract.balanceOf(address(this));
      uint256 [] memory dronesIds = new uint256[](numberOfDrones);
      bool [] memory dronesStatus = new bool[](numberOfDrones);
      uint256 i;
      uint256 droneId;
      uint256 dronesAdded;

      for(i=0;i<numberOfDrones;i++){
        droneId = droneTknContract.tokenOfOwnerByIndex(address(this),i);
        if(Drones[droneId]._exists == false){
            continue;
        }
        dronesIds[dronesAdded] = droneId;
        dronesStatus[dronesAdded] = Drones[droneId]._available;
        dronesAdded++;
      }

      return (dronesIds, dronesStatus, dronesAdded);
    }

    function getDronesByPesticide(uint256 pesticide) public view onlyOwner isContractActive returns(uint256 [] memory, uint256 ){
      uint256 numberOfDrones = droneTknContract.balanceOf(address(this));
      uint256 [] memory dronesIds = new uint256[](numberOfDrones);
      uint256 i;
      uint256 dronesAdded;
      uint256 droneId;

      for(i=0;i<numberOfDrones;i++){
        droneId = droneTknContract.tokenOfOwnerByIndex(address(this),i);
        if(Drones[droneId]._exists == false){
            continue;
        }

        if(Drones[droneId]._pesticide == pesticide && Drones[droneId]._available){
            dronesIds[dronesAdded] = droneId;
            dronesAdded++;
        }
      }

      if(dronesIds.length > numberOfDrones){
        revert();
      }

      return (dronesIds, dronesAdded);
    }

    function isDroneAvailable(uint256 droneId) public view onlyOwner droneExists(droneId) isContractActive returns(bool){
      return Drones[droneId]._available;
    }

    function blockDrone(uint256 droneId) public onlyOwner droneExists(droneId) isContractActive {
      Drones[droneId]._available = false;
    }

    function freeDrone(uint256 droneId) public onlyOwner droneExists(droneId) isContractActive {
      Drones[droneId]._available = true;
    }

    function transfernOwnership(address newOwner) public onlyOwner isContractActive{
        uint256 numberOfDrones = droneTknContract.balanceOf(address(this));
        transferOwnership(newOwner);
        uint256 droneId;
        uint256 i;

        for(i=0;i<numberOfDrones;i++){
          droneId = droneTknContract.tokenByIndex(i);
          droneTknContract.transferFrom(address(this), newOwner, droneId);
        }
    }

    function deleteContract() public onlyOwner isContractActive{
        droneTknContract.deleteContract();
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
