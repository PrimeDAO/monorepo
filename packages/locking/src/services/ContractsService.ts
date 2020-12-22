import { Contract, ethers, Signer } from "ethers";
import { Address, EthereumService, Hash, IChainEventInfo } from "services/EthereumService";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";

const ContractAddresses = require("../contracts/contractAddresses.json") as INetworkContractAddresses;

const LockingToken4Reputation = require("../contracts/LockingToken4Reputation.json");
const PriceOracleInterface = require("../contracts/PriceOracleInterface.json");
const ERC20ABI = require("../contracts/ERC20.json");
const Avatar = require("../contracts/Avatar.json");
const Reputation = require("../contracts/Reputation.json");

export enum ContractNames {
  LockingToken4Reputation = "LockingToken4Reputation"
  , PRIMETOKEN = "PrimeToken"
  , PriceOracleInterface = "PriceOracleInterface"
  , IERC20 = "IERC20"
  , Avatar = "Avatar"
  , Reputation = "Reputation"
}

export interface IStandardEvent {
  args: any;
  transactionHash: Hash;
  blockNumber: number;
}

interface INetworkContractAddresses {
  [network: string]: Map<ContractNames, string>;
}

@autoinject
export class ContractsService {

  private static ABIs = new Map<ContractNames, any>(
    [
      [ContractNames.LockingToken4Reputation, LockingToken4Reputation.abi]
      , [ContractNames.PRIMETOKEN, ERC20ABI.abi]
      , [ContractNames.PriceOracleInterface, PriceOracleInterface.abi]
      , [ContractNames.IERC20, ERC20ABI.abi]
      , [ContractNames.Avatar, Avatar.abi]
      , [ContractNames.Reputation, Reputation.abi]
      ,
    ],
  );

  private static Contracts = new Map<ContractNames, Contract & any>([
    [ContractNames.LockingToken4Reputation, null]
    , [ContractNames.PRIMETOKEN, null]
    , [ContractNames.Avatar, null]
    // don't get a contract for Reputation, it is just used for its ABI
    // don't get a contract for PriceOracleInterface, it is just used for its ABI
    // don't get a contract for IERC20, it is just used for its ABI
    ,
  ]);

  private initializingContracts: Promise<void>;
  private initializingContractsResolver: () => void;
  private networkInfo: IChainEventInfo;
  private accountAddress: Address;

  constructor(
    private eventAggregator: EventAggregator,
    private ethereumService: EthereumService) {

    this.eventAggregator.subscribe("Network.Changed.Account", (account: Address): void => {
      if (account !== this.accountAddress) {
        this.accountAddress = account;
        this.initializeContracts();
      }
    });

    const networkChange = (info) => {
      if ((this.networkInfo?.chainId !== info?.chainId) ||
        (this.networkInfo?.chainName !== info?.chainName) ||
        (this.networkInfo?.provider !== info?.provider)) {
        this.networkInfo = info;
        this.initializeContracts();
      }
    };

    this.eventAggregator.subscribe("Network.Changed.Disconnect", (): void => {
      networkChange(null);
    });

    this.eventAggregator.subscribe("Network.Changed.Connected", (info: IChainEventInfo): void => {
      networkChange(info);
    });

    this.eventAggregator.subscribe("Network.Changed.Id", (info: IChainEventInfo): void => {
      networkChange(info);
    });

    this.initializeContracts();
  }

  private setInitializingContracts(): void {
    if (!this.initializingContractsResolver) {
    /**
     * jump through this hook because the order of receipt of `EthereumService.onConnect`
     * is indeterminant, but we have to make sure `ContractsService.initializeContracts`
     * has completed before someone tries to use `this.Contracts` (see `getContractFor`).
     */
      this.initializingContracts = new Promise<void>((resolve: () => void) => {
        this.initializingContractsResolver = resolve;
      });
    }
  }

  private resolveInitializingContracts(): void {
    this.initializingContractsResolver();
    this.initializingContractsResolver = null;
  }

  private async assertContracts(): Promise<void> {
    return this.initializingContracts;
  }

  private createProvider() {
    let signerOrProvider;
    if (this.accountAddress) {
      signerOrProvider = Signer.isSigner(this.accountAddress) ? this.accountAddress : this.networkInfo.provider.getSigner(this.accountAddress);
    } else {
      signerOrProvider = this.ethereumService.readOnlyProvider;
    }
    return signerOrProvider;
  }

  private initializeContracts(): void {
    if (!ContractAddresses || !ContractAddresses[this.ethereumService.targetedNetwork]) {
      throw new Error("initializeContracts: ContractAddresses not set");
    }

    /**
     * to assert that contracts are not available during the course of this method
     */
    if (!this.initializingContractsResolver) {
      this.setInitializingContracts();
    }

    const reuseContracts = // at least one random contract already exists
      ContractsService.Contracts.get(ContractNames.LockingToken4Reputation);

    const signerOrProvider = this.createProvider();

    ContractsService.Contracts.forEach((_contract, contractName) => {
      let contract;

      if (reuseContracts) {
        contract = ContractsService.Contracts.get(contractName).connect(signerOrProvider);
      } else {
        contract = new ethers.Contract(
          ContractAddresses[this.ethereumService.targetedNetwork][contractName],
          this.getContractAbi(contractName),
          signerOrProvider);
      }
      ContractsService.Contracts.set(contractName, contract);
    });

    this.eventAggregator.publish("Contracts.Changed");

    this.resolveInitializingContracts();
  }

  public async getContractFor(contractName: ContractNames): Promise<Contract & any> {
    await this.assertContracts();
    return ContractsService.Contracts.get(contractName);
  }

  public getContractAbi(contractName: ContractNames): Address {
    return ContractsService.ABIs.get(contractName);
  }

  public getContractAddress(contractName: ContractNames): Address {
    return ContractAddresses[this.ethereumService.targetedNetwork][contractName];
  }

  public getContractAtAddress(contractName: ContractNames, address: Address): Contract & any {
    return new ethers.Contract(
      address,
      this.getContractAbi(contractName),
      this.createProvider());
  }
}
