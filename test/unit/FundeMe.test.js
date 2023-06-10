const { deployments, ethers, network } = require('hardhat');
const { assert, expect } = require('chai');

network.name != 'local' && network.name != 'hardhat'
  ? describe.skip
  : describe('FundMe', async function () {
      let contract_FundMe;
      let contract_MockV3Aggregator;
      let deployer;
      const sendValue = ethers.utils.parseEther('1');
      this.beforeEach(async function () {
        deployer = (await ethers.getSigners())[0].address;
        await deployments.fixture(['all']);
        contract_FundMe = await ethers.getContract('FundMe', deployer);
        contract_MockV3Aggregator = await ethers.getContract('MockV3Aggregator', deployer);
      });

      describe('constructor', async function () {
        it('sets the aggregator Addresses correctly', async function () {
          const response = await contract_FundMe.s_priceFeed();
          assert.equal(response, contract_MockV3Aggregator.address);
        });
      });

      describe('fund', async function () {
        it("Fails if you don't send enough ETH", async function () {
          await expect(contract_FundMe.fund()).to.be.revertedWith('You need to spend more ETH!');
        });
        it('updated the amount funded data structure', async function () {
          await contract_FundMe.fund({ from: deployer, value: sendValue });
          const response = await contract_FundMe.s_addressToAmountFunded(deployer);
          assert.equal(sendValue.toString(), response.toString());
        });
        it('Adds funder to array of funders', async function () {
          await contract_FundMe.fund({ value: sendValue });
          const funder = await contract_FundMe.s_funders(0);
          assert.equal(funder, deployer);
        });
      });

      describe('withdraw', async function () {
        this.beforeEach(async function () {
          await contract_FundMe.fund({ value: sendValue });
        });

        it('Withdraw ETH from a single founder', async function () {
          // Arange
          const startingFundMeBalance = await contract_FundMe.provider.getBalance(contract_FundMe.address);
          const startingDeployerBalance = await contract_FundMe.provider.getBalance(deployer);
          // Act
          const transactionResponse = await contract_FundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await contract_FundMe.provider.getBalance(contract_FundMe.address);
          const endingDeployerBalance = await contract_FundMe.provider.getBalance(deployer);
          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it('allows us to withdraw with multiple funders', async function () {
          // Arrange
          const accounts = await ethers.getSigners();
          for (let i = 0; i < 6; i++) {
            const fundMeConnectedContract = await contract_FundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }

          const startingFundMeBalance = await contract_FundMe.provider.getBalance(contract_FundMe.address);
          const startingDeployerBalance = await contract_FundMe.provider.getBalance(deployer);
          // Act
          const transactionResponse = await contract_FundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await contract_FundMe.provider.getBalance(contract_FundMe.address);
          const endingDeployerBalance = await contract_FundMe.provider.getBalance(deployer);
          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );

          // Make sure that the funders are reset properly
          await expect(contract_FundMe.s_funders(0)).to.be.reverted;

          for (i = 1; i < 6; i++) {
            assert.equal(await contract_FundMe.s_addressToAmountFunded(accounts[i].address), 0);
          }
        });

        it('Only allows the owner to withdraw', async function () {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = await contract_FundMe.connect(attacker);
          await expect(attackerConnectedContract.withdraw()).to.be.revertedWithCustomError(
            contract_FundMe,
            'FundMe__NotOwner'
          );
        });
      });
    });
