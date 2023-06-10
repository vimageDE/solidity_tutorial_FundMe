const { assert } = require('chai');
const hardhat = require('hardhat');
const network = hardhat.network;
const ethers = hardhat.ethers;

network.name != 'sepolia'
  ? describe.skip
  : describe('FundMe Staging Tests', function () {
      let deployer;
      let fundMe;
      const sendValue = ethers.utils.parseEther('0.032598');
      beforeEach(async () => {
        deployer = (await ethers.getSigners())[0].address;
        fundMe = await ethers.getContract('FundMe', deployer);
      });

      it('allows people to fund and withdraw', async function () {
        const fundTxResponse = await fundMe.fund({ value: sendValue });
        await fundTxResponse.wait(1);
        const withdrawTxResponse = await fundMe.withdraw();
        await withdrawTxResponse.wait(1);

        const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
        console.log(endingFundMeBalance.toString() + ' should equal 0, running assert equal...');
        assert.equal(endingFundMeBalance.toString(), '0');
      });
    });
