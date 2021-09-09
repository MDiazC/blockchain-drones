pragma solidity 0.4.24;

import "./ownership/Ownable.sol";
import "./token/ERC20/ERC20Mintable.sol";
import "./token/ERC20/ERC20Burnable.sol";

contract DroniGateToken is ERC20Mintable, ERC20Burnable, Ownable {

  bool contractActive;

  modifier isContractActive() {
      require(contractActive == true, "Contract is not active");
       _;
   }

    constructor (address _owner, uint256 _amount) public {
        mint(_owner, _amount);
        contractActive = true;
    }

    function transfernOwnership(address newOwner) public onlyOwner isContractActive{
      transferOwnership(newOwner);
    }

    function deleteContract() public onlyOwner{
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
