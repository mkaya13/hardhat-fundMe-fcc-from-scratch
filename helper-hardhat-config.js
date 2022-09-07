const networkConfig = {
    4: {
        name: "rinkeby",
        ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    },
    5: {
        name: "goerli",
        ethUsdPriceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
    },
    137: {
        name: "polygon",
        ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
    },
    // 31337
}

const developmentChains = ["hardhat", "localhost"]

const DECIMALS = 8
const INITIAL_PRICE = 200000000000

module.exports = {
    // Since we are gonna import couple of files, we do it like this
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_PRICE,
}
