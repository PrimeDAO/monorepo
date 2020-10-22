import { Contract, ethers, Signer } from "ethers";
import { Address, EthereumService, IChainEventInfo } from "services/EthereumService";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";

const ContractAddresses = require("../contracts/contractAddresses.json") as INetworkContractAddresses;
const ConfigurableRightsPoolABI = require("../contracts/ConfigurableRightsPool.json");
const WETHABI = require("../contracts/WETH.json");
const BPOOL = require("../contracts/BPool.json");
const ERC20ABI = require("../contracts/ERC20.json");

export enum ContractNames {
  ConfigurableRightsPool = "ConfigurableRightsPool"
  , BPOOL = "BPool"
  , WETH = "WETH"
  , PRIMETOKEN = "PRIMETOKEN"
  , USDC = "USDC"
  ,
}

interface INetworkContractAddresses {
  [network: string]: Map<ContractNames, string>;
}

@autoinject
export class ContractsService {

  private static ABIs = new Map<ContractNames, any>(
    [
      [ContractNames.ConfigurableRightsPool, ConfigurableRightsPoolABI.abi]
      , [ContractNames.BPOOL, BPOOL.abi]
      , [ContractNames.WETH, WETHABI.abi]
      , [ContractNames.PRIMETOKEN, ERC20ABI.abi]
      , [ContractNames.USDC, ERC20ABI.abi]
      ,
    ],
  );

  private static Contracts = new Map<ContractNames, Contract>([
    [ContractNames.ConfigurableRightsPool, null]
    , [ContractNames.BPOOL, null]
    , [ContractNames.WETH, null]
    , [ContractNames.PRIMETOKEN, null]
    , [ContractNames.USDC, null]
    ,
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

  public async getContractFor(contractName: ContractNames): Promise<any> {
    await this.assertContracts();
    return ContractsService.Contracts.get(contractName);
  }
}
