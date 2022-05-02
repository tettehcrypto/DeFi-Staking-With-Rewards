const hre = require("hardhat")
const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");

const amount10 = ethers.utils.parseEther('10')
const amount20 = ethers.utils.parseEther('20')
const amount100 = ethers.utils.parseEther('100')
const maxInt = ethers.constants.MaxUint256;

describe("Deploy PeachNode", () => {
    let peachToken;
    let peachNode;
    let peachOwner;

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

        //deploy PeachNode
        const PeachNode = await hre.ethers.getContractFactory("PeachNode")
        peachNode = await PeachNode.connect(peachOwner).deploy(peachToken.address,dead2);

        expect(await peachToken.owner()).equal(await peachNode.owner())

        //peachNode Added To Exempt Fee List
        await peachToken.connect(peachOwner).setFeeExempt(peachNode.address, true);

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

        //Tokens Should Be Received By peachNode 
        //50% Tax
        const peachNodeTokenBalance = await peachToken.balanceOf(peachNode.address)
        expect(peachNodeTokenBalance).equal(amount20)

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