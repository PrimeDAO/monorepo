import { Contract, ethers, Signer } from "ethers";
import { Web3Provider } from "@ethersproject/providers";
import { AllowedNetworks, EthereumService } from "services/EthereumService";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";
import { IDisposable } from "services/IDisposable";

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

@autoinject
export class ContractsService {

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
  private initializingContracts: Promise<void>;
  private initializingContractsResolver: () => void;

  constructor(
    private eventAggregator: EventAggregator,
    private ethereumService: EthereumService) {
    /**
     * jump through this hook because the order of receipt of `EthereumService.onConnect`
     * is indeterminant, but we have to make sure `ContractsService.initializeContracts`
     * has completed before someone tries to use `this.Contracts` (see `getContractFor`).
     */
    this.initializingContracts = new Promise<void>((resolve: () => void) => {
      this.initializingContractsResolver = resolve;
    });
    this.eventAggregator.subscribe("Network.Changed.Connected", (info) => {
      this.initializeContracts(info.chainName, info.provider);
    });
  }
  private async assertContracts(): Promise<void> {
    return this.initializingContracts;
  }

  private initializeContracts(network: AllowedNetworks, walletProvider: Web3Provider): void {
    if (!ContractAddresses) {
      throw new Error("initializeContracts: ContractAddresses not set");
    }
    const defaultAccount = this.ethereumService.defaultAccount;
    if (walletProvider && defaultAccount) {
      ContractsService.Contracts.forEach((_value, key) => {
        if (Signer.isSigner(defaultAccount)) {
          ContractsService.Contracts.set(key, new ethers.Contract(
            ContractAddresses[network][key],
            ContractsService.ABIs.get(key),
            defaultAccount));
        } else {
          ContractsService.Contracts.set(key, new ethers.Contract(
            ContractAddresses[network][key],
            ContractsService.ABIs.get(key),
            walletProvider.getSigner(defaultAccount)));
        }
      });
    }
    this.initializingContractsResolver();
  }

  public async getContractFor(contractName: IContract): Promise<any> {
    await this.assertContracts();
    return ContractsService.Contracts.get(contractName);
  }
}
