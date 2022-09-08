const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    //const allAccounts = await ethers.getSigners()

    // for (let account of allAccounts) {
    //    console.log(account.address)
    //}

    //const firstAddress = (await getNamedAccounts()).deployer

    //console.log("-------------------------------------------")

    //console.log("firstAddress:", firstAddress)
    //console.log("deployer:", deployer)

    const { deployer } = await getNamedAccounts()
    const FundMe = await ethers.getContract("FundMe", deployer)

    console.log("Withdrawing!")
    const fundTransaction = await FundMe.withdraw()
    await fundTransaction.wait(1)
    console.log(fundTransaction)
    console.log("Got it back!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
