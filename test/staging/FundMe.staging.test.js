const { ethers, getNamedAccounts, deployments } = require("hardhat")
const {
    developmentChains, // add it to run yarn hardhat test --network goerli
} = require("../../helper-hardhat-config")

const { expect, assert } = require("Chai")

developmentChains.includes(network.name)
    ? describe.skip // New feature. If we are not in a development chain, then we run this!
    : describe("FundMe", async () => {
          let FundMe
          let deployer
          let sendValue = ethers.utils.parseEther("1")

          // We are not gonna deploy this, we will not implement fixtures like we did in our unit test since we are assuming they are already deployed to test nets.
          // And we also don't need mock!
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              FundMe = await ethers.getContract("FundMe", deployer)
              console.log("Contract address:", FundMe.address)
          })
          it("Allows people to fund and withdraw ", async () => {
              const txnResponse = await FundMe.fund({ value: sendValue })
              await txnResponse.wait(1)
              const withdrawResponse = await FundMe.withdraw()
              await withdrawResponse.wait(1)
              const endingBalance = await FundMe.provider.getBalance(
                  FundMe.address
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })

// await FundMe.fund({ value: sendValue })
//         const withdrawResponse = await FundMe.withdraw()
//         await withdrawResponse.wait(1)
//         const endingBalance = await FundMe.provider.getBalance(
//             FundMe.address
//         )
//         assert.equal(endingBalance.toString(), "0")
