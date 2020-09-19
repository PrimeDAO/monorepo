/* eslint-disable no-console */
import { ethers } from "ethers";
import { BaseProvider } from "@ethersproject/providers";

export class Ethereum {
  public static readOnlyProvider: BaseProvider;

  public static initialize(network = "mainnet"): void {
    this.readOnlyProvider = ethers.getDefaultProvider(network);
    // this.readOnlyProvider = new providers.JsonRpcProvider(process.env.RIVET_ENDPOINT);
  }
}
