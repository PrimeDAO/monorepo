import { Contract, ethers, Signer } from "ethers";
import { Web3Provider } from "@ethersproject/providers";
import { Address, AllowedNetworks, EthereumService, IChainEventInfo } from "services/EthereumService";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";

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
  private networkInfo: IChainEventInfo;
  private accountAddress: Address;

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
    this.eventAggregator.subscribe("Network.Changed.Account", (account: Address): void => {
      if (account !== this.accountAddress) {
        this.accountAddress = account;
        this.initializeContracts();
      }
    });
    this.eventAggregator.subscribe("Network.Changed.Connected", (info: IChainEventInfo): void => {

      if ((this.networkInfo?.chainId !== info.chainId) ||
        (this.networkInfo?.chainName !== info.chainName) ||
        (this.networkInfo?.provider !== info.provider)) {
        this.networkInfo = info;
        this.initializeContracts();
      }
    });
  }

  private async assertContracts(): Promise<void> {
    return this.initializingContracts;
  }

  private initializeContracts(): void {
    if (!ContractAddresses) {
      throw new Error("initializeContracts: ContractAddresses not set");
    }

    const account = this.accountAddress;
    const networkInfo = this.networkInfo;

    if (networkInfo.provider && account) {
      ContractsService.Contracts.forEach((_value, key) => {
        if (Signer.isSigner(account)) {
          ContractsService.Contracts.set(key, new ethers.Contract(
            ContractAddresses[networkInfo.chainName][key],
            ContractsService.ABIs.get(key),
            account));
        } else {
          ContractsService.Contracts.set(key, new ethers.Contract(
            ContractAddresses[networkInfo.chainName][key],
            ContractsService.ABIs.get(key),
            networkInfo.provider.getSigner(account)));
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
