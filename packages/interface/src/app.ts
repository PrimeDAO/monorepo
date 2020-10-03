import ContractsService from "services/ContractsService";
import EthereumService from "services/EthereumService";

export class App {
  public activate(): void {
    EthereumService.initialize(process.env.NODE_ENV === "development" ? "rinkeby" : "mainnet");
    ContractsService.initialize();
  }
}
