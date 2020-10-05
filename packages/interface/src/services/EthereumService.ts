/* eslint-disable no-console */
import { ethers, Signer } from "ethers";
import { BaseProvider, Web3Provider } from "@ethersproject/providers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Torus from "@toruslabs/torus-embed";

interface IEIP1193 {
  on(eventName: "accountsChanged", handler: (accounts: string) => void);
  on(eventName: "chainChanged", handler: (chainId: number) => void);
  on(eventName: "connect", handler: (info: { chainId: number }) => void);
  on(eventName: "disconnect", handler: (error: { code: number; message: string }) => void);
}

export type AllowedNetworks = "mainnet" | "rinkeby" | "xdai";

export default class EthereumService {
  private static ProviderEndpoints =
  {
    "mainnet": `https://${process.env.RIVET_ID}.eth.rpc.rivet.cloud/`,
    "rinkeby": `https://${process.env.RIVET_ID}.rinkeby.rpc.rivet.cloud/`,
    "xdai": "https://dai.poa.network",
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
          1: EthereumService.ProviderEndpoints["mainnet"],
          4: EthereumService.ProviderEndpoints["rinkeby"],
          100: EthereumService.ProviderEndpoints["xdai"],
        },
      },
    },
  };

  private static web3Modal: Web3Modal;
  /**
   * provided by Web3Modal
   */
  private static web3ModalProvider: Web3Provider & IEIP1193;

  private static chainNameById = new Map<number, AllowedNetworks>([
    [ 1, "mainnet" ],
    [ 4, "rinkeby" ],
    [ 100, "xdai" ],
  ]);

  // private static chainIdByName = new Map<AllowedNetworks, number>([
  //   ["mainnet", 1],
  //   ["rinkeby", 4],
  //   ["xdai", 100],
  // ]);

  private static async getChainId(provider: Web3Provider): Promise<number> {
    return Number((await provider.send("net_version", [])));
  }

  private static async getCurrentAccountFromProvider(provider: Web3Provider): Promise<Signer | string> {
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

  /**
   * using `Set` means dups are prevented.  They are maintained in the order added.
   */
  private static onAccountsChangedHandlers: Set<(account: string) => void> = new Set();
  private static onChainChangedHandlers: Set<(chainId: number) => void> = new Set();
  private static onConnectHandlers: Set<(info: { chainId: number, chainName: AllowedNetworks, provider: Web3Provider }) => void> = new Set();
  private static onDisconnectHandlers: Set<(error: { code: number; message: string }) => void> = new Set();

  private static fireAccountsChangedHandler(account: string) {
    console.info(`account changed: ${account}`);
    this.onAccountsChangedHandlers.forEach((fn) => fn(account));
  }
  private static fireChainChangedHandler(chainId: number) {
    console.info(`chain changed: ${chainId}`);
    this.onChainChangedHandlers.forEach((fn) => fn(chainId));
  }
  private static fireConnectHandler(info: { chainId: number, chainName: AllowedNetworks, provider: Web3Provider }) {
    console.info(`connected: ${info.chainName}`);
    this.onConnectHandlers.forEach((fn) => fn(info));
  }
  private static fireDisconnectHandler(error: { code: number; message: string }) {
    console.info(`disconnected: ${error?.code}: ${error?.message}`);
    this.onDisconnectHandlers.forEach((fn) => fn(error));
  }
  /**
   * provided by ethers
   */
  public static readOnlyProvider: BaseProvider;
  /**
   * provided by ethers given provider from Web3Modal
   */
  public static walletProvider: Web3Provider;

  public static defaultAccount: Signer | string;

  public static targettedNetwork: Signer | string;

  public static async getDefaultAccountAddress(): Promise<string | undefined> {
    if (Signer.isSigner(this.defaultAccount)) {
      return await this.defaultAccount.getAddress();
    } else {
      return this.defaultAccount;
    }
  }

  public static initialize(network: AllowedNetworks): void {

    if (!network) {
      throw new Error("Ethereum.initialize: `network` must be specified");
    }

    this.targettedNetwork = network;

    const readonlyEndPoint = EthereumService.ProviderEndpoints[this.targettedNetwork];
    if (!readonlyEndPoint) {
      alert("Please connect to either mainnet, rinkeby or xdai");
      return;
    }

    this.readOnlyProvider = ethers.getDefaultProvider(EthereumService.ProviderEndpoints[this.targettedNetwork]);
  }

  public static async connect(network = "mainnet"): Promise<void> {

    if (!this.web3Modal) {
      this.web3Modal = new Web3Modal({
        network, // optional
        // cacheProvider: true, // optional
        providerOptions: this.providerOptions, // required
      });
    }

    const web3ModalProvider = await this.web3Modal.connect();
    if (web3ModalProvider) {
      const walletProvider = new ethers.providers.Web3Provider(web3ModalProvider);
      const chainId = await this.getChainId(walletProvider);
      const chainName = this.chainNameById.get(chainId);
      const readonlyEndPoint = EthereumService.ProviderEndpoints[chainName];
      if (chainName !== this.targettedNetwork) {
        alert(`Please connect to ${this.targettedNetwork}`);
        return;
      }
      this.readOnlyProvider = ethers.getDefaultProvider(readonlyEndPoint);
      this.walletProvider = walletProvider;
      this.web3ModalProvider = web3ModalProvider;
      this.defaultAccount = await this.getCurrentAccountFromProvider(this.walletProvider);
      /**
       * because the events aren't fired on first connection
       */
      this.fireConnectHandler({ chainId, chainName, provider: this.walletProvider});
      this.fireAccountsChangedHandler(await this.getDefaultAccountAddress());

      this.web3ModalProvider.on("accountsChanged", async (accounts: string) => {
        this.defaultAccount = await this.getCurrentAccountFromProvider(this.walletProvider);
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

  public static onAccountsChanged(handler: (account: string) => void): void {
    this.onAccountsChangedHandlers.add(handler);
  }
  public static onChainChanged(handler: (chainId: number) => void): void {
    this.onChainChangedHandlers.add(handler);
  }
  public static onConnect(handler: (info: { chainId: number; chainName: AllowedNetworks; provider: Web3Provider }) => void): void {
    this.onConnectHandlers.add(handler);
  }
  public static onDisconnect(handler: (error: { code: number; message: string; }) => void): void {
    this.onDisconnectHandlers.add(handler);
  }
}
