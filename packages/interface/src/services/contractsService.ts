import { Contract, ethers, Signer } from "ethers";
import { Web3Provider } from "@ethersproject/providers";
import EthereumService, { AllowedNetworks } from "services/ethereumService";

const ConfigurableRightsPoolABI = require("@primedao/contracts/build/contracts/ConfigurableRightsPool.json");
const WETHABI = require("@primedao/contracts/build/contracts/WETH.json");

export enum IContract {
  ConfigurableRightsPool,
  WETH,
}

interface INetworkContractAddresses {
  [network: string]: Map<IContract, string>;
}

const ContractAddresses: INetworkContractAddresses = {
  "rinkeby": new Map([
    [IContract.ConfigurableRightsPool, "0x7Cb9dAfCB3E9841c939fa8ECB1C1697C02014e8A" ],
    [ IContract.WETH, "0xD896FBFA5045D2e34Ba5bcf6b6d6047e14572dd0" ],
  ]),
};

export class ContractsService {
  private static ABIs = new Map<IContract, any>(
    [
      [IContract.ConfigurableRightsPool, ConfigurableRightsPoolABI.abi],
      [IContract.WETH, WETHABI.abi],
    ]
  );

  private static Contracts = new Map<IContract, Contract>([
    [IContract.ConfigurableRightsPool, null],
    [IContract.WETH, null],
  ]);

  // private static readOnlyProvider = EthereumService.readOnlyProvider;

  private static initializeContracts(network: AllowedNetworks, walletProvider: Web3Provider) {
    const defaultAccount = EthereumService.defaultAccount;
    if (walletProvider && defaultAccount) {
      this.Contracts.forEach((_value, key) => {
        if (Signer.isSigner(defaultAccount)) {
          this.Contracts.set(key, new ethers.Contract(
            ContractAddresses[network].get(key),
            this.ABIs.get(key),
            defaultAccount));
        } else {
          this.Contracts.set(key, new ethers.Contract(
            ContractAddresses[network].get(key),
            this.ABIs.get(key),
            walletProvider.getSigner(defaultAccount)));
        }
      });
    }
  }

  public static initialize(): void {
    EthereumService.onConnect((info) => {
      ContractsService.initializeContracts(info.chainName, info.provider);
    });
  }

  public static getContractFor(contractName: IContract): any {
    return this.Contracts.get(contractName);
  }
}
