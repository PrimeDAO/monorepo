/* eslint-disable no-console */
import { ethers } from "ethers";
import { BaseProvider, Web3Provider, ExternalProvider } from "@ethersproject/providers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Torus from "@toruslabs/torus-embed";

interface IEIP1193 {
  on(eventName: "accountsChanged", handler: (accounts: string[]) => void);
  on(eventName: "chainChanged", handler: (chainId: number) => void);
  on(eventName: "connect", handler: (info: { chainId: number }) => void);
  on(eventName: "disconnect", handler: (error: { code: number; message: string }) => void);
}

export class Ethereum {
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
          1: "https://cad923f2c4e44bcf94459765db426b88.eth.rpc.rivet.cloud", // mainnet
          4: "https://cad923f2c4e44bcf94459765db426b88.rinkeby.rpc.rivet.cloud/", // rinkeby
          100: "https://dai.poa.network",
        },
      },
    },
  };

  private static web3Modal: Web3Modal;
  /**
   * provided by Web3Modal
   */
  private static web3ModalProvider: ExternalProvider & IEIP1193;

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
  private static fireConnectHandler(info: { chainId: number }) {
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

  public static initialize(network = "https://cad923f2c4e44bcf94459765db426b88.eth.rpc.rivet.cloud" /*process.env.RIVET_ENDPOINT*/): void {
    this.readOnlyProvider = ethers.getDefaultProvider(network);
  }

  public static async connect(network = "mainnet"): Promise<void> {

    this.web3Modal = new Web3Modal({
      network, // optional
      // cacheProvider: true, // optional
      providerOptions: this.providerOptions, // required
    });

    this.web3ModalProvider = await this.web3Modal.connect();
    if (this.web3ModalProvider) {
      this.walletProvider = new ethers.providers.Web3Provider(this.web3ModalProvider);
      const chainId = (this.walletProvider.provider as any)?.chainId ?? "unknown";
      console.info(`web3Modal.connect: ${chainId}`);
      this.fireConnectHandler({ chainId });

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
  public static onConnect(handler: (info: { chainId: number; }) => void): void {
    this.onConnectHandlers.add(handler);
  }
  public static onDisconnect(handler: (error: { code: number; message: string; }) => void): void {
    this.onDisconnectHandlers.add(handler);
  }
}
