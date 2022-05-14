require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
// task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
//     const accounts = await hre.ethers.getSigners();

//     for (const account of accounts) {
//         console.log(account.address);
//     }
// });

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    defaultNetwork: "hardhat",
    solidity: "0.8.4",
    networks: {
        hardhat: {
            chainId: 43114,
            gasPrice: 225000000000,
            throwOnTransactionFailures: false,
            loggingEnabled: true,
            forking: {
                url: "https://api.avax.network/ext/bc/C/rpc",
                enabled: true,
                blockNumber: 2975762
            },
        },
        rinkeby: {
            url: 'https://rinkeby.infura.io/v3/69fe3fe6aa8c4ef6bc985be0a283b349',
            accounts: ['d7922c2059c30e2df5c8b3af450e0c177b63cdd685333e0b143fb10cc42ee0ef']
        }
    }
};
