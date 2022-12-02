import fs from 'fs';
import { task, types } from 'hardhat/config';
import { Contract as EthersContract } from 'ethers';

task("deploy-router", "Deploys a router to a new network")
  .addParam("deployNetwork", "network to deploy to")
  .setAction(async (taskArgs) => {
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs');
    }
    fs.writeFileSync(
      'logs/deployments.json',
      JSON.stringify({
        contractAddresses: {
          RouterContract: "Test String Here"//contracts.NFTDescriptorV2.address
        },
        gitHub: {
          // Get the commit sha when running in CI
          sha: process.env.GITHUB_SHA,
        },
      }),
      { flag: 'w' },
    );

  });