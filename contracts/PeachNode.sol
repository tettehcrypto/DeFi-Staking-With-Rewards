pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract NodeManager is ERC1155, Ownable{
    using SafeMath for uint256;

    address peachToken;
    address taxContract;

    uint256 private _decimals = 10**18;
    uint256 public priceStandard = 20 * _decimals;
    uint256 public priceSlotmachine = 20* _decimals;

    uint64 public reward = 1157;
    uint128 public time = 86400;
    
    struct Nodes {
        uint16 tier1;
        uint16 tier2;
        uint16 tier3;
        uint16 tier4;
        uint16 tier5;
        uint16 tier6;
    }

    Nodes public _rewards = Nodes({
        tier1: 1000,
        tier2: 400,
        tier3: 300,
        tier4: 250,
        tier5: 200,
        tier6: 75
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

    constructor(
        address _peachToken,
        address _taxContract
    ) ERC1155("") {
        peachToken = _peachToken;
        taxContract = _taxContract;
    } 

    // Number Of Nodes Owned By User In Each Tier
    mapping(uint256 => mapping(address => uint256)) private _nodeCountOfOwnerByTier;
    // Number of Nodes Created By Tier
    mapping(uint256 => uint256) private _nodes;
    // Node Of User
    mapping(address => mapping(uint256 => Games[])) private _nodesOfOwner;
    // Price Of Node per User
    mapping(address => uint256) private _prices;

    // Number of Nodes Created
    uint256 public nodeCount;

    function createNode(uint256 _tier, uint256 amount) 
    external
    {
        address sender = msg.sender;
        require(_nodes[_tier] >= 1 && _nodes[_tier] <7);
        require(
            isNodeAvailable(_tier, amount),"Node not available"
        );

        if(_nodes[_tier] == 6) {
            setSlotPrice();
        }  else {
            setStandardPrice();
        }

        uint256 senderBalance = IERC20(peachToken).balanceOf(sender);
        require(senderBalance >= _prices[sender]);

        uint256 tokenAmount = _prices[sender] * amount;
        IERC20(peachToken).transferFrom(
            sender,
            address(this), //Where tokens sent to? Rewards pool?
            tokenAmount
        );

        for (uint256 i = 0; i < amount; i++) {
            _nodesOfOwner[sender][_tier].push(
                Games({
                    id: _tier,
                    lastClaim: block.timestamp
                })
            );
        }

        _nodeCountOfOwnerByTier[_tier][sender]+=amount;
        _nodes[_tier]+=amount;
        nodeCount+=amount;
    }

    //Claim rewards
    function claimRewards(uint256 _tier)
    external
    {
        address sender = msg.sender;
        uint256 rewards = getRewards(sender, _tier);
        require(rewards > 1, "You Don't Have Enough Rewards");
        
        uint256 rewardsUser =(rewards * 12) / 100;
        IERC20(peachToken).transferFrom(
            address(this),
            sender,
            rewardsUser
        );
    }

    function compoundRewards(uint256 _tier)
    external
    {
        address sender = msg.sender;
        uint256 rewards = getRewards(sender, _tier);

        if(_nodes[_tier] == 6) {
            setSlotPrice();
        }  else {
            setStandardPrice();
        }

        require(rewards >= _prices[sender], "You Don't Have Enough Rewards");

        _nodesOfOwner[sender][_tier].push(
            Games({
                id: _tier,
                lastClaim: block.timestamp
            })
        );

        _nodeCountOfOwnerByTier[_tier][sender]++;
        _nodes[_tier]++;
        nodeCount++;

    }

    // Calculate Rewards in Tier
    function getRewards(address _sender, uint256 _tier)
    internal
    returns(uint256)
    {
        require(_nodes[_tier] >= 1 && _nodes[_tier] <7, "Invalid Tier");
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
            uint claimDays = ((block.timestamp - _game.lastClaim)/time);
            rewards += (claimDays*_decimals*multiplier)/1000;
            _game.lastClaim = block.timestamp;
        }

        return rewards;
    }

    function isNodeAvailable(uint256 _id, uint256 amount)
    private
    view
    returns (bool)
    {
        require(_nodes[_id] >= 1 && _nodes[_id] <7);

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
            _prices[msg.sender] = 20* _decimals;
        }else if (count >=10 && count < 20){
            _prices[msg.sender] = 25* _decimals;
        } else if (count >=20 && count < 40){
            _prices[msg.sender] = 30* _decimals;
        }else if (count >=40 && count < 80){
            _prices[msg.sender] = 35* _decimals;
        }else if (count >=80 && count < 100){
            _prices[msg.sender] = 40* _decimals;
        }else if (count >=100){
            _prices[msg.sender] = 45* _decimals;
        }
    }

    //Handle Upgrade Price For Slot Machine
    function setSlotPrice() 
    public 
    {
        address owner = msg.sender;
        uint256 count = _nodeCountOfOwnerByTier[6][owner];

        if (count < 10){
            _prices[msg.sender] = 20* _decimals;
        }else if (count >=10 && count < 20){
            _prices[msg.sender] = 25* _decimals;
        } else if (count >=20 && count < 40){
            _prices[msg.sender] = 30* _decimals;
        }else if (count >=40 && count < 80){
            _prices[msg.sender] = 35* _decimals;
        }else if (count >=80 && count < 100){
            _prices[msg.sender] = 40* _decimals;
        }else if (count >=100){
            _prices[msg.sender] = 45* _decimals;
        }
    }
}