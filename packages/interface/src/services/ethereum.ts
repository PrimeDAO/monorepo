/* eslint-disable no-console */
import { ethers } from "ethers";
import { BaseProvider, Web3Provider } from "@ethersproject/providers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Torus from "@toruslabs/torus-embed";

interface IEIP1193 {
  on(eventName: "accountsChanged", handler: (accounts: string[]) => void);
  on(eventName: "chainChanged", handler: (chainId: number) => void);
  on(eventName: "connect", handler: (info: { chainId: number }) => void);
  on(eventName: "disconnect", handler: (error: { code: number; message: string }) => void);
}

export type AllowedNetworks = "mainnet" | "rinkeby" | "xdai";

export class Ethereum {
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
          1: Ethereum.ProviderEndpoints["mainnet"],
          4: Ethereum.ProviderEndpoints["rinkeby"],
          100: Ethereum.ProviderEndpoints["xdai"],
        },
      },
    },
  };

  private static web3Modal: Web3Modal;
  /**
   * provided by Web3Modal
   */
  private static web3ModalProvider: Web3Provider & IEIP1193;

  private static chainNameById = new Map<number, string>([
    [ 1, "mainnet" ],
    [ 4, "rinkeby" ],
    [ 100, "xdai" ],
  ]);

  private static chainIdByName = new Map<string, number>([
    ["mainnet", 1],
    ["rinkeby", 4],
    ["xdai", 100],
  ]);

  private static async getChainId(provider: Web3Provider): Promise<number> {
    return Number((await provider.send("net_version", [])));
  }

  /**
   * using `Set` means dups are prevented.  They are maintained in the order added.
   */
  private static onAccountsChangedHandlers: Set<(accounts: string[]) => void> = new Set();
  private static onChainChangedHandlers: Set<(chainId: number) => void> = new Set();
  private static onConnectHandlers: Set<(info: { chainId: number }) => void> = new Set();
  private static onDisconnectHandlers: Set<(error: { code: number; message: string }) => void> = new Set();

  private static fireAccountsChangedHandler(accounts: string[]) {
    this.onAccountsChangedHandlers.forEach((fn) => fn(accounts));
  }
  private static fireChainChangedHandler(chainId: number) {
    this.onChainChangedHandlers.forEach((fn) => fn(chainId));
  }
  private static fireConnectHandler(info: { chainId: number, chainName: string }) {
    this.onConnectHandlers.forEach((fn) => fn(info));
  }
  private static fireDisconnectHandler(error: { code: number; message: string }) {
    this.onDisconnectHandlers.forEach((fn) => fn(error));
  }
  /**
   * provided by ethers
   */
  public static readOnlyProvider: BaseProvider;
  /**
   * provided by ethers given web3ModalProvider
   */
  public static walletProvider: Web3Provider;

  public static initialize(network: AllowedNetworks): void {

    if (!network) {
      throw new Error("Ethereum.initialize: `network` must be specified");
    }

    this.readOnlyProvider = ethers.getDefaultProvider(Ethereum.ProviderEndpoints[network]);
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
      const readonlyEndPoint = Ethereum.ProviderEndpoints[chainName];
      if (!readonlyEndPoint) {
        alert("Please connect to either mainnet, rinkeby or xdai");
        return;
      }
      this.readOnlyProvider = ethers.getDefaultProvider(readonlyEndPoint);
      this.walletProvider = walletProvider;
      this.web3ModalProvider = web3ModalProvider;
      this.fireConnectHandler({ chainId, chainName});

      // Subscribe to accounts change
      this.web3ModalProvider.on("accountsChanged", (accounts: string[]) => {
        console.info(`web3ModalProvider.accountsChanged: ${accounts?.[0]}`);
        this.fireAccountsChangedHandler(accounts);
      });

      // Subscribe to chainId change
      this.web3ModalProvider.on("chainChanged", (chainId: number) => {
        console.info(`web3ModalProvider.chainChanged: ${chainId}`);
        this.fireChainChangedHandler(chainId);
      });

      // Subscribe to provider disconnection
      this.web3ModalProvider.on("disconnect", (error: { code: number; message: string }) => {
        console.info(`web3ModalProvider.disconnect: ${error?.code}: ${error?.message}`);
        this.web3ModalProvider = undefined;
        this.walletProvider = undefined;
        this.fireDisconnectHandler(error);
      });
    }
  }

  public static onAccountsChanged(handler: (accounts: string[]) => void): void {
    this.onAccountsChangedHandlers.add(handler);
  }
  public static onChainChanged(handler: (chainId: number) => void): void {
    this.onChainChangedHandlers.add(handler);
  }
  public static onConnect(handler: (info: { chainId: number; chainName: string }) => void): void {
    this.onConnectHandlers.add(handler);
  }
  public static onDisconnect(handler: (error: { code: number; message: string; }) => void): void {
    this.onDisconnectHandlers.add(handler);
  }
}
