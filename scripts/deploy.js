const hre = require("hardhat")
const { ethers, waffle } = require("hardhat");
const WAVAX_ABI = require("../abi/wavax_abi.json");
const dead = '0x000000000000000000000000000000000000dEaD';

let peachManager, peachToken, joeRouterContract, joeFactoryContract, JOE_FACTORY_ADDRESS, wavaxContract;
let rewardsPool, teamWallet;

async function main() {
    const JOE_FACTORY_ADDRESS = '0x3141110EDbf0c16c338F1e9A38570D0abD368064'
    const JOE_ROUTER_ADDRESS = '0x8Ba0297709D77CdFBdD35574aD60d5D4F5A92257'
    const WAVAX = '0xc778417E063141139Fce010982780140Aa0cD5Ab' //WETH

    // define wavax contract
    wavaxContract = await ethers.getContractAt(WAVAX_ABI, WAVAX);
    
    //deploy teamWallet
    const TeamWallet = await hre.ethers.getContractFactory("TeamWallet");
    teamWallet = await TeamWallet.deploy();
    console.log("Team Wallet Deployed TO: ", teamWallet.address)

    //deploy peachToken
    const PeachToken = await hre.ethers.getContractFactory("PeachToken");
    peachToken = await PeachToken.deploy(dead, teamWallet.address);
    console.log("PeachToken Deployed TO: ", peachToken.address)

    // deploy rewardsPools
    const RewardsPool = await hre.ethers.getContractFactory("RewardsPool");
    rewardsPool = await RewardsPool.deploy(peachToken.address)
    console.log("Rewards Pool Deployed TO: ", rewardsPool.address)

    // deploy peachManager
    const PeachManager = await hre.ethers.getContractFactory("PeachManager");
    peachManager = await PeachManager.deploy(
        JOE_FACTORY_ADDRESS, //JOE FACTORY RINKEBY
        JOE_ROUTER_ADDRESS, //JOE ROUTER RINKEBY
        peachToken.address,
        WAVAX, //WETH RINKEBY
        [peachToken.address, WAVAX], //PATH
        rewardsPool.address
    );
    console.log("PeachManager Deployed TO: ", peachManager.address)

    //deploy PeachNode
    const PeachNode = await hre.ethers.getContractFactory("PeachNode")
    peachNode = await PeachNode.deploy(peachToken.address, rewardsPool.address, teamWallet.address, dead);
    console.log("PeachNode Deployed TO: ", peachNode.address)

    // await wavaxContract.approve(peachManager.address, ethers.constants.MaxUint256);
    // await peachToken.approve(peachManager.address, ethers.constants.MaxUint256)
  }

  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });