const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { expect, assert } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")
// const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace")

console.log("Network:", network.name)

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
          let FundMe
          let deployer
          let MockV3Aggregator
          const sendValue = ethers.utils.parseEther("1") // "1000000000000000000" = 1 ether -> docs.ethers.io/v5/api/utils/display-logic/#utils-parseEther

          beforeEach(async () => {
              // deploy our fundMe contract
              // using Hardhat-deploy

              // const accounts = await ethers.getSigners() // Another way you can get different accounts directly from your hardhat config (returns whatever in hardhat.config.js networks accounts value)
              // const accountZero = accounts[0]
              deployer = (await getNamedAccounts()).deployer

              deploymentProof = await deployments.fixture(["all"]) // It will run all the scripts with all tag
              FundMe = await ethers.getContract("FundMe", deployer) // Whenever we call a func with FundMe it will automatically be from the deployer account
              MockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", async () => {
              it("sets the aggregator address correctly", async () => {
                  const response = await FundMe.getPriceFeed() // Defined with priceFeed = AggregatorV3Interface(priceFeedAddress) returns address!
                  assert.equal(response, MockV3Aggregator.address)
              })
              it("sets the owner address correctly", async () => {
                  const response = await FundMe.getOwner()
                  assert.equal(response, deployer)
              })
          })
          describe("fund", async () => {
              it("Fails if you don't send enough ETH", async () => {
                  await expect(FundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH"
                  )
              })
              it("Updated the amount funded data structure", async () => {
                  await FundMe.fund({ value: sendValue })
                  const response = await FundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of funders", async () => {
                  await FundMe.fund({ value: sendValue })
                  const response = await FundMe.getFunders(0)
                  assert.equal(response, deployer)
              })
          })
          describe("withdraw", async () => {
              beforeEach(async () => {
                  await FundMe.fund({ value: sendValue })
              })
              it("Withdraw ETH from a single founder", async () => {
                  // Arrange Start with the balance of FundMe contract
                  const startingFundMeBalance =
                      await FundMe.provider.getBalance(FundMe.address)
                  // Since its calling from the blockhain, it's gonna be a type of big number. Deployer balance
                  const startingDeployerBalance =
                      await FundMe.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await FundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await FundMe.provider.getBalance(
                      FundMe.address
                  )
                  const endingDeployerBalance =
                      await FundMe.provider.getBalance(deployer)
                  // Assert docs.ethers.io/v5/api/utils/bignumber/#BigNumber
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(), // Since its calling from the blockhain, it's gonna be a type of big number so we use add
                      endingDeployerBalance.add(gasCost).toString() // When we called withdraw, our withdrawwer spend some gas. So we need to add gasCost!!!
                  )
              })
              it("Allows us to withdraw with multiple funders", async () => {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await FundMe.connect(
                          accounts[i] // if you do it accounts[i].address it fails !! Since it needs private key to sign the txn
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  // Initial money in contract address & deployer address

                  const startingFundMeBalance =
                      await FundMe.provider.getBalance(FundMe.address)
                  const startingDeployerBalance =
                      await FundMe.provider.getBalance(deployer)

                  console.log(
                      "Current money on SC:",
                      startingFundMeBalance.toString()
                  )
                  console.log(
                      "Current money on OW:",
                      startingDeployerBalance.toString()
                  )

                  // Act
                  const transactionResponse = await FundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  console.log("withdraw gas cost: ", gasCost.toString())

                  const endingFundMeBalance = await FundMe.provider.getBalance(
                      FundMe.address
                  )
                  const endingDeployerBalance =
                      await FundMe.provider.getBalance(deployer)

                  console.log(
                      "Sum of the money:",
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  )

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(), // Since its calling from the blockhain, it's gonna be a type of big number so we use add
                      endingDeployerBalance.add(gasCost).toString() // When we called withdraw, our withdrawwer spend some gas. So we need to add gasCost!!!
                  )

                  // Make sure that the funders are reset properly, Make sure all these funders updated to 0
                  await expect(FundMe.getFunders(0)).to.be.reverted

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await FundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("Only allows the owner to withdraw", async () => {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await FundMe.connect(
                      attacker
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
              })
          })

          it("Withdraw ETH from a single founder", async () => {
              // Arrange Start with the balance of FundMe contract
              const startingFundMeBalance = await FundMe.provider.getBalance(
                  FundMe.address
              )
              // Since its calling from the blockhain, it's gonna be a type of big number. Deployer balance
              const startingDeployerBalance = await FundMe.provider.getBalance(
                  deployer
              )

              // Act
              const transactionResponse = await FundMe.withdraw()
              const transactionReceipt = await transactionResponse.wait(1)
              const { gasUsed, effectiveGasPrice } = transactionReceipt
              const gasCost = gasUsed.mul(effectiveGasPrice)

              const endingFundMeBalance = await FundMe.provider.getBalance(
                  FundMe.address
              )
              const endingDeployerBalance = await FundMe.provider.getBalance(
                  deployer
              )
              // Assert docs.ethers.io/v5/api/utils/bignumber/#BigNumber
              assert.equal(endingFundMeBalance, 0)
              assert.equal(
                  startingFundMeBalance.add(startingDeployerBalance).toString(), // Since its calling from the blockhain, it's gonna be a type of big number so we use add
                  endingDeployerBalance.add(gasCost).toString() // When we called withdraw, our withdrawwer spend some gas. So we need to add gasCost!!!
              )
          })

          it("Apply cheaperWithdraw ETH from a single founder", async () => {
              // Arrange Start with the balance of FundMe contract
              const startingFundMeBalance = await FundMe.provider.getBalance(
                  FundMe.address
              )
              // Since its calling from the blockhain, it's gonna be a type of big number. Deployer balance
              const startingDeployerBalance = await FundMe.provider.getBalance(
                  deployer
              )

              // Act
              const transactionResponse = await FundMe.cheaperWithdraw()
              const transactionReceipt = await transactionResponse.wait(1)
              const { gasUsed, effectiveGasPrice } = transactionReceipt
              const gasCost = gasUsed.mul(effectiveGasPrice)

              const endingFundMeBalance = await FundMe.provider.getBalance(
                  FundMe.address
              )
              const endingDeployerBalance = await FundMe.provider.getBalance(
                  deployer
              )
              // Assert docs.ethers.io/v5/api/utils/bignumber/#BigNumber
              assert.equal(endingFundMeBalance, 0)
              assert.equal(
                  startingFundMeBalance.add(startingDeployerBalance).toString(), // Since its calling from the blockhain, it's gonna be a type of big number so we use add
                  endingDeployerBalance.add(gasCost).toString() // When we called withdraw, our withdrawwer spend some gas. So we need to add gasCost!!!
              )
          })

          it("cheaperWithdraw testing...", async () => {
              // Arrange
              const accounts = await ethers.getSigners()
              for (let i = 1; i < 6; i++) {
                  const fundMeConnectedContract = await FundMe.connect(
                      accounts[i] // if you do it accounts[i].address it fails !! Since it needs private key to sign the txn
                  )
                  await fundMeConnectedContract.fund({ value: sendValue })
              }

              // Initial money in contract address & deployer address

              const startingFundMeBalance = await FundMe.provider.getBalance(
                  FundMe.address
              )
              const startingDeployerBalance = await FundMe.provider.getBalance(
                  deployer
              )

              console.log(
                  "Current money on SC:",
                  startingFundMeBalance.toString()
              )
              console.log(
                  "Current money on OW:",
                  startingDeployerBalance.toString()
              )

              // Act
              const transactionResponse = await FundMe.cheaperWithdraw()
              const transactionReceipt = await transactionResponse.wait(1)
              const { gasUsed, effectiveGasPrice } = transactionReceipt
              const gasCost = gasUsed.mul(effectiveGasPrice)

              console.log("cheaperWithdraw gas cost: ", gasCost.toString())

              const endingFundMeBalance = await FundMe.provider.getBalance(
                  FundMe.address
              )
              const endingDeployerBalance = await FundMe.provider.getBalance(
                  deployer
              )

              console.log(
                  "Sum of the money:",
                  startingFundMeBalance.add(startingDeployerBalance).toString()
              )

              assert.equal(endingFundMeBalance, 0)
              assert.equal(
                  startingFundMeBalance.add(startingDeployerBalance).toString(), // Since its calling from the blockhain, it's gonna be a type of big number so we use add
                  endingDeployerBalance.add(gasCost).toString() // When we called cheaperWithdraw, our withdrawwer spend some gas. So we need to add gasCost!!!
              )

              // Make sure that the funders are reset properly, Make sure all these funders updated to 0
              //console.log("LOOK AT THERE:", await FundMe.getFunders(0))  -> It will give error since there is no account left
              await expect(FundMe.getFunders(0)).to.be.reverted

              for (let i = 1; i < 6; i++) {
                  assert.equal(
                      await FundMe.getAddressToAmountFunded(
                          accounts[i].address
                      ),
                      0
                  )
              }
          })
      })
