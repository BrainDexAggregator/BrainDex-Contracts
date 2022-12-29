import * as dotenv from 'dotenv';

import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomiclabs/hardhat-etherscan';
import '@nomicfoundation/hardhat-chai-matchers';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import 'hardhat-contract-sizer';
// import "./tasks"; // Not implemented yet.

dotenv.config();

task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const MOONBEAM_ENDPOINT = process.env.MOONBEAM_ENDPOINT !== undefined ? process.env.MOONBEAM_ENDPOINT : "https://rpc.api.moonbeam.network";
const POLYGON_ENDPOINT = process.env.POLYGON_ENDPOINT !== undefined ? process.env.POLYGON_ENDPOINT : "https://polygon-rpc.com";


const config: HardhatUserConfig = {
  solidity: {
    compilers:[
      {
        version: '0.8.15',
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
        },
      },
      {
        version: '0.8.7',
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
        },
      },
      {
        version: '0.6.12',
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
        },
      },
    ]
  },
  networks: {
    hardhat: {
      forking:{
          url: POLYGON_ENDPOINT,
          // blockNumber: 2612198
      },
      accounts: {
        count: 50
      },
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    moonbaseAlpha: {
      url: 'https://rpc.testnet.moonbeam.network',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    moonriver: {
      url: 'https://rpc.api.moonriver.moonbeam.network',
      chainId: 1285,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    moonbeam: {
      url: MOONBEAM_ENDPOINT,
      chainId: 1284,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    telos: {
      url: 'https://mainnet.telos.net/evm',
      chainId: 40,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
    coinmarketcap: process.env.COIN_MARKET_CAP_KEY || '',
    gasPrice: 50,
  },
  etherscan: {
    apiKey: {
      moonriver: process.env.MOONRIVER_MOONSCAN_APIKEY || '', // Moonriver Moonscan API Key
      moonbaseAlpha: process.env.MOONBEAM_MOONSCAN_APIKEY || '', // Moonbeam Moonscan API Key
    },
  },
};

export default config;