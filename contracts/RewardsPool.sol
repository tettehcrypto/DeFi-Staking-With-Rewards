// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardsPool is Ownable{
    IERC20 public PeachToken;
    address sentry;

    constructor(address _PeachToken) {
        PeachToken = IERC20(_PeachToken);
    }

    function pay(address _to, uint _amount) external onlyOwner returns (bool) {
        return PeachToken.transfer(_to, _amount);
    }

    function approve(address _to) external onlyOwner returns (bool) {
        PeachToken.approve(_to, 2**256 - 1);
    }
}