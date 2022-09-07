const { network } = require("hardhat")
const {
    developmentChains,
    DECIMALS,
    INITIAL_PRICE,
    networkConfig,
} = require("../helper-hardhat-config.js")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    //chainId = network.config.chainId

    //log(developmentChains)

    //log(developmentChains.includes(network.name))

    //log(network)

    //const chainId = network.config.chainId

    //log(chainId)

    if (developmentChains.includes(network.name)) {
        // if (developmentChains.includes(network.name))
        // we can also do if (chainId == "31337")
        log("Local network detected! Deploying mocks...")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_PRICE],
        })
        log("Mocks deployed! ")
        log("---------------------------------------------------")
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
        log(ethUsdPriceFeedAddress)
        // log(deployments)
        // log(await deployments.get("MockV3Aggregator"))
    }
}

module.exports.tags = ["all", "mocks"]
