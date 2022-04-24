pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract NodeManager is ERC1155, Ownable{
    using SafeMath for uint256;

    uint16 public priceStandard = 20;
    uint16 public priceSlotmachine = 20;
    
    struct Nodes {
        uint16 tier1;
        uint16 tier2;
        uint16 tier3;
        uint16 tier4;
        uint16 tier5;
        uint16 tier6;
    }

    Nodes public _rewards = Nodes({
        tier1: 20,
        tier2: 50,
        tier3: 67,
        tier4: 80,
        tier5: 100,
        tier6: 267
    });

    Nodes public _limit = Nodes({
        tier1: 450,
        tier2: 2500,
        tier3: 5000,
        tier4: 10000,
        tier5: 20000,
        tier6: 0
    });

    struct Games {
        uint256 id;
        uint256 lastClaim;
    }

    constructor() ERC1155("") {} 

    // Number Of Nodes Owned By User In Each Tier
    mapping(uint256 => mapping(address => uint256)) private _nodeCountOfOwnerByTier;
    // Number of Nodes Created By Tier
    mapping(uint256 => uint256) private _nodes;
    // Node Of User
    mapping(address => mapping(uint256 => Games[])) private _nodesOfOwner;
    // Price Of Node per User
    mapping(address => uint16) private _prices;

    // Number of Nodes Created
    uint256 public nodeCount;

    function createNode(uint256 _tier, uint256 amount) 
    external
    {
        address sender = msg.sender;
 
        require(
            isNodeAvailable(_tier, amount),"Node not available"
        );

        _nodesOfOwner[sender][_tier].push(
            Games({
                id: _tier,
                lastClaim: block.timestamp
            })
        );

        _nodeCountOfOwnerByTier[_tier][sender]++;
        _nodes[_tier]++;
    }

    //Claim rewards
    function claimRewards(uint256 _tier)
    external
    {
        address sender = msg.sender;

    }

    // Calculate Rewards
    function getRewards(address _sender, uint256 _tier)
    internal
    returns(uint256)
    {
        require(_nodes[_tier] >= 1 && _nodes[_tier] <=6);
        uint256 multiplier;

        if(_tier ==1){
            multiplier = _rewards.tier1;
        }else if(_tier ==2){
            multiplier = _rewards.tier2;
        }else if(_tier ==3){
            multiplier = _rewards.tier3;
        }else if(_tier ==4){
            multiplier = _rewards.tier4;
        }else if(_tier ==5){
            multiplier = _rewards.tier5;
        }else if(_tier ==6){
            multiplier = _rewards.tier6;
        }

        address sender = _sender;

        Games[] storage nodes = _nodesOfOwner[sender][_tier];
        uint256 nodesCount = nodes.length;
        require(nodesCount > 0, "No available nodes");

        Games storage _game;
        uint256 rewards = 0;

        for (uint256 i = 0; i < nodesCount; i++) {
            _game = nodes[i];
            rewards += ((block.timestamp - _game.lastClaim)*multiplier)/100;
            _game.lastClaim = block.timestamp;
        }

        return rewards;
    }


    function isNodeAvailable(uint256 _id, uint256 amount)
    private
    view
    returns (bool)
    {
        require(_nodes[_id] >= 1 && _nodes[_id] <=6);

        if (_nodes[_id] == 1) {
            if (_nodes[_id] + amount > _limit.tier1) return false;
        }else if (_nodes[_id] == 2) {
            if (_nodes[_id] + amount > _limit.tier2) return false;
        }else if (_nodes[_id] == 3) {
            if (_nodes[_id] + amount > _limit.tier3) return false;
        }else if (_nodes[_id] == 4) {
            if (_nodes[_id] + amount > _limit.tier4) return false;
        }else if (_nodes[_id] == 5) {
            if (_nodes[_id] + amount > _limit.tier5) return false;
        }else if (_nodes[_id] == 6) {
            return true;
        }

        return true;
    }

    //Handle Upgrade Price for Games
    function setStandardPrice() 
    public 
    {
        address owner = msg.sender;
        uint256 count = 
            _nodeCountOfOwnerByTier[1][owner]
            +_nodeCountOfOwnerByTier[2][owner]
            +_nodeCountOfOwnerByTier[3][owner]
            +_nodeCountOfOwnerByTier[4][owner]
            +_nodeCountOfOwnerByTier[5][owner];

        if (count < 10){
            _prices[msg.sender] = 20;
        }else if (count >=10 && count < 20){
            _prices[msg.sender] = 25;
        } else if (count >=20 && count < 40){
            _prices[msg.sender] = 30;
        }else if (count >=40 && count < 80){
            _prices[msg.sender] = 35;
        }else if (count >=80 && count < 100){
            _prices[msg.sender] = 40;
        }else if (count >=100){
            _prices[msg.sender] = 45;
        }
    }

    //Handle Upgrade Price For Slot Machine
    function setSlotPrice() 
    public 
    {
        address owner = msg.sender;
        uint256 count = _nodeCountOfOwnerByTier[6][owner];

        if (count < 10){
            _prices[msg.sender] = 20;
        }else if (count >=10 && count < 20){
            _prices[msg.sender] = 25;
        } else if (count >=20 && count < 40){
            _prices[msg.sender] = 30;
        }else if (count >=40 && count < 80){
            _prices[msg.sender] = 35;
        }else if (count >=80 && count < 100){
            _prices[msg.sender] = 40;
        }else if (count >=100){
            _prices[msg.sender] = 45;
        }
    }
}