const hre = require("hardhat")
const JOE_ROUTER_ABI = require("../abi/joe_router_abi.json");
const JOE_FACTORY_ABI = require("../abi/joe_factory_abi.json");
const WAVAX_ABI = require("../abi/wavax_abi.json");
const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");
const { BigNumber } = require("ethers");
const { expectRevert } = require('@openzeppelin/test-helpers');
const { PeachHelper } = require("../helpers/liquidity");


const JOE_ROUTER_ADDRESS = '0x60aE616a2155Ee3d9A68541Ba4544862310933d4';
const WAVAX_ADDRESS = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";
const DEPOSIT_NUMBER = "2000000000000000000000000"; // 50000

const largeAmount = ethers.utils.parseEther('100');
const amount8k = ethers.utils.parseEther('8000');
const amount1200 = ethers.utils.parseEther('1200');
const amount200 = ethers.utils.parseEther('200');
const amount80 = ethers.utils.parseEther('80');
const amount78 = ethers.utils.parseEther('78');
const amount1 = ethers.utils.parseEther('1');

describe("Deploy contracts", () => {
    let peachManager, peachToken, joeRouterContract, joeFactoryContract, JOE_FACTORY_ADDRESS, wavaxContract;
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

        [peachOwner, peachManagerOwner] = await ethers.getSigners();

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
        const currBalance = await wavaxContract.balanceOf(peachOwner.address);
        const peachOwnerWavaxBalance = ethers.utils.formatEther(currBalance);

        // console.log('peachOwnerWavaxBalance ', peachOwnerWavaxBalance)
        // expect(+peachOwnerWavaxBalance).equal(5000);
        expect(+peachOwnerWavaxBalance).equal(100);

        const dead = '0x000000000000000000000000000000000000dEaD';
        const dead2 = '0x100000000000000000000000000000000000dEaD';

        // deploy PeachToken
        const PeachToken = await hre.ethers.getContractFactory("PeachToken");
        peachToken = await PeachToken.connect(peachOwner).deploy(dead, dead2);

        // deploy peachManager
        const PeachManager = await hre.ethers.getContractFactory("PeachManager");
        peachManager = await PeachManager.deploy(
            JOE_FACTORY_ADDRESS,
            JOE_ROUTER_ADDRESS,
            peachToken.address,
            WAVAX_ADDRESS,
            [peachToken.address, WAVAX_ADDRESS]
        );

        const lpAddress = await joeFactoryContract.getPair(peachToken.address, WAVAX_ADDRESS);
        const lpCreatedBypeachManager = await peachManager.getPair2();
        
        //@notice check to see if LP created by peachManager is the same as in JoeFactory;
        expect(lpAddress).equal(lpCreatedBypeachManager);

        // TODO: negative checks
        //await expectRevert(joeFactoryContract.connect(peachOwner).createPair(peachToken.address, WAVAX_ADDRESS),"Joe: PAIR_EXISTS");

        // We might need to move approvement into the contract functions
        await wavaxContract.connect(peachOwner).approve(peachManager.address, ethers.constants.MaxUint256);
        await peachToken.connect(peachOwner).approve(peachManager.address, ethers.constants.MaxUint256)
    });

    it.only("should add liquidity via peachManager and test swaps", async () => {
        const lpCreatedBypeachManager = await peachManager.getPair2();
        await peachToken.setFeeExempt(lpCreatedBypeachManager, true);
        const lp = await peachManager.connect(peachOwner).checkLPTokenBalance();
        const lpBalanceBefore = ethers.utils.formatUnits(lp, 18);
        console.log("lpBalanceBefore ",lpBalanceBefore)
        
        console.log(await peachToken.connect(peachOwner).balanceOf(peachOwner.address))
        
        PeachHelper.provideLiquidity(peachManager, peachOwner, peachToken.address, amount200, amount200);

        // check peachOwner LP balance
        const lpBalance = await peachManager.connect(peachOwner).checkLPTokenBalance();
        const lpBalanceAfter = ethers.utils.formatUnits(lpBalance, 18);

        console.log("LP BALANCE After", lpBalanceAfter)
        
        expect(+lpBalanceBefore).lessThan(+lpBalanceAfter);

        // SWAP peachTokens for AVAX
        const peachBeforeSwap = ethers.utils.formatEther(await peachToken.balanceOf(peachOwner.address));
        const peachOwnerAvaxBeforeSwap = ethers.utils.formatEther(await ethers.provider.getBalance(peachOwner.address));

        const swap = await peachManager.connect(peachOwner).swapExactTokensForAVAX(
            peachToken.address,
            amount80,
            [peachToken.address, wavaxContract.address]
        );

        await swap.wait();

        const peachAfterSwap = ethers.utils.formatEther(await peachToken.balanceOf(peachOwner.address))
        const peachOwnerAvaxAfterSwap = ethers.utils.formatEther(await ethers.provider.getBalance(peachOwner.address));


        console.log("peachBeforeSwap: ", peachBeforeSwap)
        console.log("peachAfterSwap: ", peachAfterSwap)

        expect(+peachBeforeSwap).greaterThan(+peachAfterSwap);
        // expect(+peachOwnerAvaxBeforeSwap).lessThan(+peachOwnerAvaxAfterSwap);


        //SWAP 2
        const peachBeforeSwap2 = ethers.utils.formatEther(await peachToken.balanceOf(peachOwner.address));
        const peachOwnerAvaxBeforeSwap2 = ethers.utils.formatEther(await ethers.provider.getBalance(peachOwner.address));
               
        const lpBalance2 = await peachManager.connect(peachOwner).checkLPTokenBalance();
        const lpBalanceAfter2 = ethers.utils.formatUnits(lpBalance2, 18);
        console.log("LP BALANCE", lpBalanceAfter2)

        console.log('peachBeforeSwap2 ', peachBeforeSwap2)
        console.log('peachOwnerAvaxBeforeSwap2 ', peachOwnerAvaxBeforeSwap2)
        const out = ethers.utils.format
        const swap2 = await peachManager.connect(peachOwner).swapAVAXForExactTokens(
            peachToken.address,
            amount80, // Must Be Less Than ETH Value Sent
            [wavaxContract.address, peachToken.address],
            { value: amount80 }
        );
        await swap2.wait();

        const peachAfterSwap2 = ethers.utils.formatEther(await peachToken.balanceOf(peachOwner.address))
        const peachOwnerAvaxAfterSwap2 = ethers.utils.formatEther(await ethers.provider.getBalance(peachOwner.address));

        expect(+peachBeforeSwap2).lessThan(+peachAfterSwap2);
        expect(+peachOwnerAvaxBeforeSwap2).greaterThan(+peachOwnerAvaxAfterSwap2);
    })

    it("should swap 200 AVAX for 190 PeachTokens", async () => {
        await PeachHelper.provideLiquidity(peachManager, peachOwner, peachToken.address, amount8k, amount8k);

        const peachBeforeSwap2 = ethers.utils.formatEther(await peachToken.balanceOf(peachOwner.address));
        const peachOwnerAvaxBeforeSwap2 = ethers.utils.formatEther(await ethers.provider.getBalance(peachOwner.address));

        const swap2 = await peachManager.connect(peachOwner).swapAVAXForExactTokens(
            peachToken.address,
            ethers.utils.parseEther("190"),
            [wavaxContract.address, peachToken.address],
            { value: amount200 }
        );
        await swap2.wait();

        const peachAfterSwap2 = ethers.utils.formatEther(await peachToken.balanceOf(peachOwner.address))
        const peachOwnerAvaxAfterSwap2 = ethers.utils.formatEther(await ethers.provider.getBalance(peachOwner.address));

        expect(+peachBeforeSwap2).lessThan(+peachAfterSwap2);
        expect(+peachOwnerAvaxBeforeSwap2).greaterThan(+peachOwnerAvaxAfterSwap2);
    })

    it("should swap 200 PeachTokens for max AVAX", async () => {
        await PeachHelper.provideLiquidity(peachManager, peachOwner, peachToken.address, amount8k, amount8k);

        // SWAP peachTokens for AVAX
        const peachBeforeSwap = ethers.utils.formatEther(await peachToken.balanceOf(peachOwner.address));
        const peachOwnerAvaxBeforeSwap = ethers.utils.formatEther(await ethers.provider.getBalance(peachOwner.address));

        const swap = await peachManager.connect(peachOwner).swapExactTokensForAVAX(
            peachToken.address,
            ethers.utils.parseEther("200"),
            [peachToken.address, wavaxContract.address]
        );
        await swap.wait();

        const peachAfterSwap = ethers.utils.formatEther(await peachToken.balanceOf(peachOwner.address))
        const peachOwnerAvaxAfterSwap = ethers.utils.formatEther(await ethers.provider.getBalance(peachOwner.address));
        
        expect(+peachBeforeSwap).greaterThan(+peachAfterSwap);
        expect(+peachOwnerAvaxBeforeSwap).lessThan(+peachOwnerAvaxAfterSwap);

    })

    it.skip("should directly call joeRouter", async () => {
        await wavaxContract.connect(peachOwner).approve(joeRouterContract.address, largeAmount);
        await peachToken.connect(peachOwner).approve(joeRouterContract.address, largeAmount)

        // add liquidity
        const tx = await joeRouterContract.connect(peachOwner).addLiquidityAVAX(
            peachToken.address,
            largeAmount,
            0,
            0,
            peachOwner.address,
            ethers.BigNumber.from(minutesFromNow(30)),
            { value: largeAmount } // not taken from the sender
        )
        await tx.wait();
    })
})


function minutesFromNow(minAmount) {
    return Math.floor(Date.now() / 1000) + 60 * minAmount;
};