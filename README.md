﻿# "DeFi Uniswap/TraderJoe Staking With Rewards"
### Built with Solidity, Javscript, Hardhat, Ethers
### Tested with Ethers , Chai

## Contributors
- myself
- Amaechi Okolobi

## Description

This repository is a project I developed to provide passive income for users by staking tokens. In future I intend to add a suite of gambling smart contracts to provide a use case for the rewards.

This projects shows my ability to interact with existing DeFi exchange platforms, in this case I used TraderJoe which is an Avalanche Fork of Uniswap.

In the tests I used hardhat forking to replicate the state of the mainnet, allowing me to verify the setup of the liquidity pool for the token I created.

## How To Run
 1. Clone Repository
 2. Install Dependencies:
 $ npm install
 3. Deploy Contracts
 $ npx hardhat run --network NETWORK_NAME scripts/deploy.js
