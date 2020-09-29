import { Contract, ethers, Signer } from "ethers";
import { Web3Provider } from "@ethersproject/providers";
import EthereumService, { AllowedNetworks } from "services/ethereumService";

const SmartPoolManagerABI = require("@primedao/contracts/build/contracts/SmartPoolManager.json");
const WETHABI = require("@primedao/contracts/build/contracts/WETH.json");

export enum IContract {
  SmartPoolManager,
  WETH,
}

interface INetworkContractAddresses {
  [network: string]: Map<IContract, string>;
}

const ContractAddresses: INetworkContractAddresses = {
  "rinkeby": new Map([
    [ IContract.SmartPoolManager, "0x18fD8D945491AECc689bB88Af036499BFfBCd7e8" ],
    [ IContract.WETH, "0xD896FBFA5045D2e34Ba5bcf6b6d6047e14572dd0" ],
  ]),
};

export class ContractsService {
  private static signer: Signer;
  private static walletProvider: Web3Provider;
  private static ABIs = new Map<IContract, any>(
    [
      [IContract.SmartPoolManager, SmartPoolManagerABI.abi],
      [IContract.WETH, WETHABI.abi],
    ]
  );

  private static Contracts = new Map<IContract, Contract>([
    [IContract.SmartPoolManager, null],
    [IContract.WETH, null],
  ]);

  // private static readOnlyProvider = EthereumService.readOnlyProvider;

  private static initializeContracts(network: AllowedNetworks) {
    const defaultAccount = EthereumService.defaultAccount;
    if (this.walletProvider && defaultAccount) {
      this.Contracts.forEach((_value, key) => {
        if (Signer.isSigner(defaultAccount)) {
          this.Contracts.set(key, new ethers.Contract(
            ContractAddresses[network].get(key),
            this.ABIs.get(key),
            defaultAccount));
        // } else if (this.isInfuraProvider) {
        //   return new Contract(address, abi, this.web3)
        } else {
          this.Contracts.set(key, new ethers.Contract(
            ContractAddresses[network].get(key),
            this.ABIs.get(key),
            this.walletProvider.getSigner(defaultAccount)));
        }
      });
    } else {
      throw new Error("initializeContracts: there is no provider");
    }
  }

  public static initialize(): void {
    EthereumService.onConnect((info) => {
      ContractsService.walletProvider = info.provider;
      ContractsService.initializeContracts(info.chainName);
    });
  }
}
