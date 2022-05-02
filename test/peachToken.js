const { expect, assert, should } = require("chai");
const { ethers } = require("hardhat");
const EVM_REVERT = "VM Exception while processing transaction: reverted with reason string 'ERC20: transfer amount exceeds balance"

let Token;
let Peach;
let owner;
let addr1;
let addr2;
let treasuryPool;
let teamPool;
amount100 = ethers.utils.parseEther('100')
const amount50 = ethers.utils.parseEther('50');
const amount1 = ethers.utils.parseEther('1');
//More Negative Tests

beforeEach(async function () {
    Token = await ethers.getContractFactory("PeachToken");
    [owner, addr1, addr2, treasuryPool, teamPool] = await ethers.getSigners();
    Peach = await Token.deploy(
        treasuryPool.address,
        teamPool.address,
    );
    await Peach.deployed();
})

describe("PEACH Token Deployment", function () {
    it("Should be deployed", async function () {
        expect(await Peach.symbol()).to.equal("PEACH");
    });

    it("Should set the right owner", async function () {
      expect(await Peach.owner()).to.equal(owner.address);
    });
});


describe("Transactions", function () {
    it("Owner Should Have 2 Million Tokens", async function () {
        let  supply = 2000000;
        let  _decimals = 18;
        let  _totalSupply = supply * (10 ** _decimals);
        
        // Get Balance Of Owner
        const ownerBalance = await Peach.balanceOf(
            owner.address
        );
        assert.equal(ownerBalance,_totalSupply, 'Tokens Minted To Owner')
    });

    it("Owner Should Transfer 50 Tokens to Address 1 using Transfer", async function () {
        // Transfer 50 tokens to addr1 
        // We use .connect(signer) to send a transaction from another account
        await Peach.connect(owner).transfer(addr1.address, amount50);
        let  _decimals = 18;
        let expected = 50*(10**_decimals)
        const addr1Balance = await Peach.balanceOf(
            addr1.address
        );
        assert.equal(addr1Balance,expected, 'Tokens Transferred to Address 1');
    });

    it("Transfer Tax Between Address 1 and 2. Treasury Should Recieve Fees", async function () {
      let  _decimals = 18;
      let expected = 25*(10**_decimals)

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await Peach.connect(owner).transfer(addr1.address, amount50);
      const addr1Balance = await Peach.balanceOf(
        addr1.address
      );

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await Peach.connect(addr1).transfer(addr2.address, amount50);
      const addr2Balance = await Peach.balanceOf(
        addr2.address
      );
      const treasuryPoolBalance = await Peach.balanceOf(treasuryPool.address)

      //25 as 50% Tax
      assert.equal(addr2Balance, expected, 'Fee Taken From Transfer Between Addr1 and Addr2')
      assert.equal(treasuryPoolBalance,expected, 'Fee Deposited To Treasury')
    });

    it("Should fail if sender doesn’t have enough tokens", async function () {
      const initialOwnerBalance = await Peach.balanceOf(
        owner.address
      );
      
      //addr1Balance should be 0
      const addr1Balance = await Peach.balanceOf(
        addr1.address
      );

      expect(addr1Balance).to.equal(0)

      expect(await Peach.connect(addr1).transfer(owner.address,amount1)).to.throw
      
    });

    it("Should update balances after transfers", async function () {
      let  _decimals = 18;
      let expected1 = 100*(10**_decimals)
      let expected2 = 50*(10**_decimals)
      const initialOwnerBalance = await Peach.balanceOf(
        owner.address
      );
  
      // Transfer 100 tokens from owner to addr1.
      await Peach.transfer(addr1.address, amount100);
  
      // Transfer another 50 tokens from owner to addr2.
      await Peach.transfer(addr2.address, amount50);
  
      // Check balances.
      const finalOwnerBalance = await Peach.balanceOf(
        owner.address
      );
      expect(finalOwnerBalance < initialOwnerBalance);
  
      const addr1Balance = await Peach.balanceOf(
        addr1.address
      );
      assert.equal(addr1Balance,expected1);
  
      const addr2Balance = await Peach.balanceOf(
        addr2.address
      );
      assert.equal(addr2Balance,expected2);
    });

    it("Team Wallet Tokens Should Be Allocated", async function (){
      let  _decimals = 18;

      const totalSupply = 2000000 * (10**_decimals)
      const teamSupply = 100000 * (10**_decimals)

      // Get Balance Of Owner
      const ownerBalance = await Peach.balanceOf(
        owner.address
      );
      assert.equal(ownerBalance,totalSupply, 'Tokens Minted To Owner')

      await Peach.lockInTeamWallet();
        
      const teamBalance = await Peach.balanceOf(teamPool.address);

      assert.equal(teamBalance,teamSupply, 'Team Wallet Tokens Sent')
    });

    it("Should Fail If Non-Owner Runs exludeAccountFromFees", async function (){
      expect(await Peach.connect(addr1).setFeeExempt(addr1.address, true)).to.throw
    })

    it("Should Fail if Non-Owner Runs transferOwnership", async function (){
      expect(await Peach.connect(addr1).transferOwnership(addr2.address)).to.throw
    })

    it("Owner, treasuryPool, teamPool, PeachToken should be excluded from fees", async function () {
      expect(await Peach.shouldTakeFee(owner.address)).to.be.false;
      expect(await Peach.shouldTakeFee(treasuryPool.address)).to.be.false;
      expect(await Peach.shouldTakeFee(teamPool.address)).to.be.false;
      expect(await Peach.shouldTakeFee(Peach.address)).to.be.false;
    })

});