require('dotenv').config();
const { ethers, run, network } = require('hardhat');
const { verify } = require('../utils/verify');

module.exports = async ({ deployments }) => {
  const { deploy, log } = deployments;
  const networkName = network.name;

  // Get Eth/USD Adress for network
  let networkPriceFeedAddress;
  const localDeploy = networkName == 'hardhat' || networkName == 'local';

  log('Deploying to Network: ', networkName);

  // Get Account
  const [deployer] = await ethers.getSigners();
  log('Deploying contract with account:', deployer.address);

  // Check if Mock must be deployed
  if (localDeploy) {
    networkPriceFeedAddress = (await deployments.get('MockV3Aggregator')).address;
  } else {
    networkPriceFeedAddress = network.config.ethUsdPriceFeed;
  }
  log('Eth/USD address: ', networkPriceFeedAddress);

  // Deploy
  const contract_FundMe = await deploy('FundMe', {
    from: deployer.address,
    args: [networkPriceFeedAddress],
    log: false,
  });
  log('Deployed "FundMe" contract to: ', contract_FundMe.address);

  // Check to Verify
  if (networkName == 'sepolia' && process.env.ETHERSCAN_TOKEN) {
    log('Waiting for block txes...');
    await contract_FundMe.deployTransaction.wait(6);
    await verify(contract_FundMe.address, [networkPriceFeedAddress]);
  }

  log('Finished Deploy!');
};

async function deployMock() {
  log('Deploying local Mock');
  const factory_Mock = await ethers.getContractFactory('MockV3Aggregator');

  const _decimals = 8;
  const _initialAnswer = 200000000000;
  contract_Mock = await factory_Mock.deploy(_decimals, _initialAnswer);
  log('Mock Deployed!');
  log('--------------------------------------------');
  return contract_Mock.address;
}

module.exports.tags = ['all', 'fundme'];
