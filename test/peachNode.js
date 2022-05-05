const hre = require("hardhat")
const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");

const amount10 = ethers.utils.parseEther('10')
const amount20 = ethers.utils.parseEther('20')
const amount100 = ethers.utils.parseEther('100')
const maxInt = ethers.constants.MaxUint256;

const JOE_ROUTER_ABI = require("../abi/joe_router_abi.json");
const JOE_FACTORY_ABI = require("../abi/joe_factory_abi.json");
const WAVAX_ABI = require("../abi/wavax_abi.json");

const JOE_ROUTER_ADDRESS = '0x60aE616a2155Ee3d9A68541Ba4544862310933d4';
const WAVAX_ADDRESS = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";

const { PeachHelper } = require("../helpers/liquidity");

const largeAmount = ethers.utils.parseEther('100');
const amount200 = ethers.utils.parseEther('200')

describe("Deploy PeachNode", () => {
    let peachToken;
    let peachNode;
    let peachOwner;
    let teamWallet;
    let treasury;
    let rewardsPool;

    beforeEach(async function () {
        await ethers.provider.send(
            "hardhat_reset",
            [
                {
                    forking: {
                        jsonRpcUrl: "https://api.avax.network/ext/bc/C/rpc",
                        blockNumber: 2975762,
                    }
                }
            ]
        );

        [peachOwner, acc1, acc2] = await ethers.getSigners();

        
        const dead = '0x000000000000000000000000000000000000dEaD';
        const dead2 = '0x100000000000000000000000000000000000dEaD';

        // deploy PeachToken
        const PeachToken = await hre.ethers.getContractFactory("PeachToken");
        peachToken = await PeachToken.connect(peachOwner).deploy(dead, dead2);

        const TeamWallet = await hre.ethers.getContractFactory("TeamWallet");
        teamWallet = await TeamWallet.connect(peachOwner).deploy();
        
        // define Joe Router contract
        joeRouterContract = await ethers.getContractAt(JOE_ROUTER_ABI, JOE_ROUTER_ADDRESS);
        JOE_FACTORY_ADDRESS = await joeRouterContract.factory();

        // define Joe Factory contract
        joeFactoryContract = await ethers.getContractAt(JOE_FACTORY_ABI, JOE_FACTORY_ADDRESS);

        // define wavax contract
        wavaxContract = await ethers.getContractAt(WAVAX_ABI, WAVAX_ADDRESS);
        // send avax to peachOwner
        await wavaxContract.connect(peachOwner).deposit({
            value: largeAmount
        })

        // deploy rewardsPool
        const RewardsPool = await hre.ethers.getContractFactory("RewardsPool");
        rewardsPool = await RewardsPool.deploy(peachToken.address)

        // deploy peachManager
        const PeachManager = await hre.ethers.getContractFactory("PeachManager");
        peachManager = await PeachManager.deploy(
            JOE_FACTORY_ADDRESS,
            JOE_ROUTER_ADDRESS,
            peachToken.address,
            WAVAX_ADDRESS,
            [peachToken.address, WAVAX_ADDRESS],
            rewardsPool.address
        );

        //deploy PeachNode
        const PeachNode = await hre.ethers.getContractFactory("PeachNode")
        peachNode = await PeachNode.connect(peachOwner).deploy(peachToken.address, dead2, teamWallet.address, dead);

        expect(await peachToken.owner()).equal(await peachNode.owner())

        //peachNode Added To Exempt Fee List
        await peachToken.connect(peachOwner).setFeeExempt(peachNode.address, true);
        
        await wavaxContract.connect(peachOwner).approve(peachManager.address, ethers.constants.MaxUint256);
        await peachToken.connect(peachOwner).approve(peachManager.address, ethers.constants.MaxUint256)
        PeachHelper.provideLiquidity(peachManager, peachOwner, peachToken.address, amount200, amount200);
    })

    it("Should Create Tier 1 Node Using Peach Tokens", async () =>{
        //Acc1 Should Receive Tokens
        await peachToken.connect(peachOwner).transfer(acc1.address, amount20)
        const acc1Bal = await peachToken.connect(peachOwner).balanceOf(acc1.address)
        expect(acc1Bal).equal(amount20);

        //PeachNode Contract Must Be Approved Before Node Can Be Created
        //Create Tier 1 Node For Acc1
        await peachToken.connect(acc1).approve(peachNode.address, maxInt);
        await peachNode.connect(acc1).createNode(1,1);
        const nodes = await peachNode.balanceOf(acc1.address, 1)
        expect(nodes).equal(1)

        //Acc2 Should Receive Tokens And Create Tier 2 Node
        await peachToken.connect(peachOwner).transfer(acc2.address, amount20)
        await peachToken.connect(acc2).approve(peachNode.address, maxInt);
        await peachNode.connect(acc2).createNode(2,1);

        //Total Node Count Should Be 2
        const nodeCount = await peachNode.nodeCount()
        expect(nodeCount).equal(2)
      
    })

    it("Should Throw If Sender Has Insufficient Peach Tokens To Create Node", async () =>{
        expect(await peachNode.connect(acc1).createNode(1,1)).to.throw
    })

    // it("Should Revert If Sender Has Insufficient Rewards To Compound Node", async () =>{

    // })
    
    // it("Should Revert If Sender Has No Rewards To Claim", async() =>{

    // })

    // it("Should Revert If Node Tier Has Reached Max Capacity", async() =>{

    // })
})