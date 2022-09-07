// import

// function deployFunc() {
//     console.log("Hi")
// }
//
// module.exports.default = deployFunc

// module.exports = async (hre) => {
//    const {getNamedAccounts, deployments} = hre
// hre.getNamedAccounts
// hre.deployments
//}

const { getNamedAccounts, deployments, network } = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../helper-hardhat-config.js")
const { verify } = require("../utils/verify.js")

// Above code equals to below codes !
// const helperConfig = require("../helper-hardhat-config.js")
// const networkConfig = helperConfig[networkConfig] or helperConfig.networkConfig

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // if chainId is X use address A
    // if chainId is Z use address B

    //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"] // now whenever we run the hardhat deploy, the priceFeed address will dynamically run accordingly

    let ethUsdPriceFeedAddress // if (developmentChains.includes(network.name))
    if (chainId == 31337) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    // if the contract doesn't exist, we deploy a minimal version of it for our local testing.

    // well what happens when we want to change chains?
    // when going for localhost or harhat network we want to use a mock

    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }

    console.log("-------------------------------------------------------")
}

module.exports.tags = ["all", "fundMe"]
