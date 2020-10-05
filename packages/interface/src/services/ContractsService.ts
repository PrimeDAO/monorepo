import { Contract, ethers, Signer } from "ethers";
import { Web3Provider } from "@ethersproject/providers";
import EthereumService, { AllowedNetworks } from "services/EthereumService";

const ContractAddresses = require("../contracts/contractAddresses.json") as INetworkContractAddresses;
const ConfigurableRightsPoolABI = require("../contracts/ConfigurableRightsPool.json");
const WETHABI = require("../contracts/WETH.json");

export enum IContract {
  ConfigurableRightsPool = "ConfigurableRightsPool",
  WETH = "WETH",
}

interface INetworkContractAddresses {
  [network: string]: Map<IContract, string>;
}

export default class ContractsService {
  private static ABIs = new Map<IContract, any>(
    [
      [IContract.ConfigurableRightsPool, ConfigurableRightsPoolABI.abi],
      [IContract.WETH, WETHABI.abi],
    ],
  );

  private static Contracts = new Map<IContract, Contract>([
    [IContract.ConfigurableRightsPool, null],
    [IContract.WETH, null],
  ]);

  // private static readOnlyProvider = EthereumService.readOnlyProvider;
  private static initializingContracts: Promise<void>;
  private static initializingContractsResolver: () => void;

  private static async assertContracts(): Promise<void> {
    return this.initializingContracts;
  }

  private static initializeContracts(network: AllowedNetworks, walletProvider: Web3Provider): void {
    if (!ContractAddresses) {
      throw new Error("initializeContracts: ContractAddresses not set");
    }
    const defaultAccount = EthereumService.defaultAccount;
    if (walletProvider && defaultAccount) {
      this.Contracts.forEach((_value, key) => {
        if (Signer.isSigner(defaultAccount)) {
          this.Contracts.set(key, new ethers.Contract(
            ContractAddresses[network][key],
            this.ABIs.get(key),
            defaultAccount));
        } else {
          this.Contracts.set(key, new ethers.Contract(
            ContractAddresses[network][key],
            this.ABIs.get(key),
            walletProvider.getSigner(defaultAccount)));
        }
      });
    }
    this.initializingContractsResolver();
  }

  public static initialize(): void {
    /**
     * jump through this hook because the order of receipt of `EthereumService.onConnect`
     * is indeterminant, but we have to make sure `ContractsService.initializeContracts`
     * has completed before someone tries to use `this.Contracts` (see `getContractFor`).
     */
    this.initializingContracts = new Promise<void>((resolve: () => void) => {
      this.initializingContractsResolver = resolve;
    });
    EthereumService.onConnect((info) => {
      ContractsService.initializeContracts(info.chainName, info.provider);
    });
  }

  public static async getContractFor(contractName: IContract): Promise<any> {
    await this.assertContracts();
    return this.Contracts.get(contractName);
  }
}
