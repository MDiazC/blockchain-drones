pragma solidity 0.4.24;

import "./ownership/Ownable.sol";
import "./token/ERC721/ERC721Mintable.sol";
import "./token/ERC721/ERC721Burnable.sol";
import "./token/ERC721/ERC721Enumerable.sol";

contract DroneToken is ERC721Mintable,ERC721Burnable, ERC721Enumerable, Ownable {

  bool contractActive;
  uint256 tokensCreated;

  modifier isContractActive() {
      require(contractActive == true, "Contract is not active");
       _;
   }

  constructor (string memory _name, string memory _symbol) public {
    require(bytes(_name).length > 0, "You need to define a token name");
    require(bytes(_symbol).length > 0, "You need to define a token symbol");
    contractActive = true;
  }

  function mint() public onlyOwner isContractActive returns(uint256){
    tokensCreated++;
    uint256 droneId = tokensCreated;
    mint(msg.sender, droneId);

    return droneId;
  }

  function transfernOwnership(address newOwner) public onlyOwner isContractActive{
      transferOwnership(newOwner);
 }

  function deleteContract() public onlyOwner isContractActive{
      selfdestruct(msg.sender);
  }

  function disableContract() public isContractActive{
      contractActive = false;
  }

  function enableContract() public {
      require(contractActive == false, "Contract is already active");
      contractActive = true;
  }
}
