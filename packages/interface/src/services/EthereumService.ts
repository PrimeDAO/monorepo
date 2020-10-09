/* eslint-disable no-console */
import { ethers, Signer } from "ethers";
import { BaseProvider, Web3Provider } from "@ethersproject/providers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Torus from "@toruslabs/torus-embed";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";
import { EventConfigFailure } from "services/GeneralEvents";

interface IEIP1193 {
  on(eventName: "accountsChanged", handler: (accounts: string) => void);
  on(eventName: "chainChanged", handler: (chainId: number) => void);
  on(eventName: "connect", handler: (info: { chainId: number }) => void);
  on(eventName: "disconnect", handler: (error: { code: number; message: string }) => void);
}

export type AllowedNetworks = "mainnet" | "rinkeby";

export enum Networks {
  Mainnet = "mainnet",
  Rinkeby = "rinkeby",
}

@autoinject
export class EthereumService {

  constructor(private eventAggregator: EventAggregator) {}

  private static ProviderEndpoints =
  {
    "mainnet": `https://${process.env.RIVET_ID}.eth.rpc.rivet.cloud/`,
    "rinkeby": `https://${process.env.RIVET_ID}.rinkeby.rpc.rivet.cloud/`,
  }
  private static providerOptions = {
    torus: {
      package: Torus, // required
      options: {
        // networkParams: {
        //   host: "https://localhost:8545", // optional
        //   chainId: 1337, // optional
        //   networkId: 1337, // optional
        // },
        // config: {
        //   buildEnv: "development", // optional
        // },
      },
    },
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        rpc: {
          1: EthereumService.ProviderEndpoints[Networks.Mainnet],
          4: EthereumService.ProviderEndpoints[Networks.Rinkeby],
        },
      },
    },
  };

  public static targetedNetwork: Signer | string;
  /**
   * provided by ethers
   */
  public static readOnlyProvider: BaseProvider;

  public static initialize(network: AllowedNetworks): void {

    if (!network) {
      throw new Error("Ethereum.initialize: `network` must be specified");
    }

    this.targetedNetwork = network;

    const readonlyEndPoint = EthereumService.ProviderEndpoints[this.targetedNetwork];
    if (!readonlyEndPoint) {
      throw new Error(`Please connect to either ${Networks.Mainnet} or ${Networks.Rinkeby}`);
    }

    this.readOnlyProvider = ethers.getDefaultProvider(EthereumService.ProviderEndpoints[this.targetedNetwork]);
  }

  private web3Modal: Web3Modal;
  /**
   * provided by Web3Modal
   */
  private web3ModalProvider: Web3Provider & IEIP1193;

  private chainNameById = new Map<number, AllowedNetworks>([
    [1, Networks.Mainnet ],
    [4, Networks.Rinkeby ],
  ]);

  // private static chainIdByName = new Map<AllowedNetworks, number>([
  //   ["mainnet", 1],
  //   ["rinkeby", 4],
  // ]);

  private async getChainId(provider: Web3Provider): Promise<number> {
    return Number((await provider.send("net_version", [])));
  }

  private async getCurrentAccountFromProvider(provider: Web3Provider): Promise<Signer | string> {
    let account: Signer | string;
    if (Signer.isSigner(provider)) {
      account = provider;
    } else {
      const accounts = await provider.listAccounts();

      if (accounts) {
        account = accounts[0];
      } else {
        account = null;
      }
    }
    return account;
  }

  private fireAccountsChangedHandler(account: string) {
    console.info(`account changed: ${account}`);
    this.eventAggregator.publish("Network.Changed.Account", account);
  }
  private fireChainChangedHandler(chainId: number) {
    console.info(`chain changed: ${chainId}`);
    this.eventAggregator.publish("Network.Changed.Id", chainId);
  }
  private fireConnectHandler(info: { chainId: number, chainName: AllowedNetworks, provider: Web3Provider }) {
    console.info(`connected: ${info.chainName}`);
    this.eventAggregator.publish("Network.Changed.Connected", info);
  }
  private fireDisconnectHandler(error: { code: number; message: string }) {
    console.info(`disconnected: ${error?.code}: ${error?.message}`);
    this.eventAggregator.publish("Network.Changed.Disconnect", error);
  }

  /**
   * address, even if signer
   */
  private async getDefaultAccountAddress(): Promise<string | undefined> {
    if (Signer.isSigner(this.defaultAccount)) {
      return await this.defaultAccount.getAddress();
    } else {
      return this.defaultAccount;
    }
  }

  /**
   * provided by ethers given provider from Web3Modal
   */
  public walletProvider: Web3Provider;
  /**
   * signer or address
   */
  public defaultAccount: Signer | string;
  public defaultAccountAddress: string;

  public async connect(network = Networks.Mainnet): Promise<void> {

    if (!this.web3Modal) {
      this.web3Modal = new Web3Modal({
        network, // optional
        // cacheProvider: true, // optional
        providerOptions: EthereumService.providerOptions, // required
      });
    }

    const web3ModalProvider = await this.web3Modal.connect();
    if (web3ModalProvider) {
      const walletProvider = new ethers.providers.Web3Provider(web3ModalProvider);
      const chainId = await this.getChainId(walletProvider);
      const chainName = this.chainNameById.get(chainId);
      if (chainName !== EthereumService.targetedNetwork) {
        this.eventAggregator.publish("handleFailure", new EventConfigFailure(`Please connect to ${EthereumService.targetedNetwork}`));
        return;
      }
      /**
       * we will keep the original readonly provider which should still be fine since
       * the targeted network cannot have changed.
       */
      // const readonlyEndPoint = EthereumService.ProviderEndpoints[chainName];
      // this.readOnlyProvider = ethers.getDefaultProvider(readonlyEndPoint);
      this.walletProvider = walletProvider;
      this.web3ModalProvider = web3ModalProvider;
      this.defaultAccount = await this.getCurrentAccountFromProvider(this.walletProvider);
      this.defaultAccountAddress = await this.getDefaultAccountAddress();
      /**
       * because the events aren't fired on first connection
       */
      this.fireConnectHandler({ chainId, chainName, provider: this.walletProvider});
      this.fireAccountsChangedHandler(this.defaultAccountAddress);

      this.web3ModalProvider.on("accountsChanged", async (accounts: string) => {
        this.defaultAccount = await this.getCurrentAccountFromProvider(this.walletProvider);
        this.defaultAccountAddress = await this.getDefaultAccountAddress();
        this.fireAccountsChangedHandler(accounts?.[0]);
      });

      this.web3ModalProvider.on("chainChanged", (chainId: number) => {
        this.fireChainChangedHandler(chainId);
      });

      this.web3ModalProvider.on("disconnect", (error: { code: number; message: string }) => {
        this.web3ModalProvider = undefined;
        this.walletProvider = undefined;
        this.fireDisconnectHandler(error);
      });
    }
  }
}