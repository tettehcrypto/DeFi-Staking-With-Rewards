//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VaultWallet is Ownable{

    uint public unlockDate;
    uint256 public createdAt;

    event Received(address from, uint256 amount);
    event WithdrawTokens(address tokenContract, address to, uint256 amount);

    constructor() {
        unlockDate = 365 days;
        createdAt = block.timestamp;
    }

    // callable by owner only, after specified time, only for Tokens implementing ERC20
    function withdrawTokens(address _tokenContract) onlyOwner public {
       require(block.timestamp >= unlockDate);
       ERC20 token = ERC20(_tokenContract);
       //now send all the token balance
       uint256 tokenBalance = token.balanceOf(address(this));
       token.transfer(_msgSender(), tokenBalance);
       emit WithdrawTokens(_tokenContract, _msgSender(), tokenBalance);
    }

    function info() public view returns(uint256, uint256, uint256) {
        return (unlockDate, createdAt, address(this).balance);
    }

}