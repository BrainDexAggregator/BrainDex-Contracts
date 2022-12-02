import { Contract } from 'ethers';

export enum ChainId {
  Mainnet = 1,
  Ropsten = 3,
  Rinkeby = 4,
  Kovan = 42,
  Moonbeam = 1284,
  Moonriver = 1285,
  MoonbaseAlpha = 1287,
}

export interface ContractDeployment {
  args?: (string | number | (() => string))[];
  libraries?: () => Record<string, string>;
  waitForConfirmation?: boolean;
  validateDeployment?: () => void;
}

export interface DeployedContract {
  name: string;
  address: string;
  instance: Contract;
  constructorArguments: (string | number)[];
  libraries: Record<string, string>;
}

export interface RouterContract {
  address: String,
  deploymentHash: String,
}

export interface Deployments {
  deployments: Record<ChainId, RouterContract>,
}