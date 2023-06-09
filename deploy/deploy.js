require('dotenv').config();
const { ethers, run, network } = require('hardhat');
const { verify } = require('../utils/verify');

async function main() {
  const networkName = network.name;

  // Get Eth/USD Adress for network
  let networkPriceFeedAddress;
  const localDeploy = networkName == 'hardhat' || networkName == 'local';

  console.log('Deploying to Network: ', networkName);

  // Get Account
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contract with account:', deployer.address);

  // Check if Mock must be deployed
  if (localDeploy) {
    networkPriceFeedAddress = await deployMock();
  } else {
    networkPriceFeedAddress = network.config.ethUsdPriceFeed;
  }
  console.log('Eth/USD address: ', networkPriceFeedAddress);

  // Get Factory
  const factory_FundMe = await ethers.getContractFactory('FundMe');
  const factory_PriceConverter = await ethers.getContractFactory('PriceConverter');
  // Deploy
  const contract_FundMe = await factory_FundMe.deploy(networkPriceFeedAddress);
  const contract_PriceConverter = await factory_PriceConverter.deploy();
  console.log('Deployed "FundMe" contract to: ', contract_FundMe.address);
  console.log('Deployed "PriceConverter" contract to: ', contract_PriceConverter.address);

  // Check to Verify
  if (networkName == 'Sepolia' && process.env.ETHERSCAN_TOKEN) {
    console.log('Waiting for block txes...');
    await contract_FundMe.deployTransaction.wait(6);
    await verify(contract_FundMe.address, [networkPriceFeedAddress]);
    // await contract_PriceConverter.deploytransaction.wait(6);
    // await verify(contract_PriceConverter.address, []);
  }

  console.log('Finished Deploy!');
}

async function deployMock() {
  console.log('Deploying local Mock');
  const factory_Mock = await ethers.getContractFactory('MockV3Aggregator');

  const _decimals = 8;
  const _initialAnswer = 200000000000;
  contract_Mock = await factory_Mock.deploy(_decimals, _initialAnswer);
  console.log('Mock Deployed!');
  console.log('--------------------------------------------');
  return contract_Mock.address;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
