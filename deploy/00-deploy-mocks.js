const { network } = require('hardhat');

module.exports = async ({ deployments }) => {
  const { deploy, log } = deployments;
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;
  if (networkName == 'hardhat' || networkName == 'local' || networkName == 'node') {
    log('Deploying local Mock');
    const _decimals = 8;
    const _initialAnswer = 200000000000;

    const contract_Mock = await deploy('MockV3Aggregator', {
      from: deployer.address,
      log: false,
      args: [_decimals, _initialAnswer],
    });
    log('Mock Deployed!');
    log('--------------------------------------------');
  }
};

module.exports.tags = ['all', 'mocks'];
