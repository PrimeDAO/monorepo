import { autoinject } from "aurelia-framework";
import { Address, EthereumService, Networks } from "services/EthereumService";
import axios from "axios";
import { EventConfigFailure } from "services/GeneralEvents";
import { ConsoleLogService } from "services/ConsoleLogService";
import { ContractNames, ContractsService } from "services/ContractsService";

@autoinject
export class PriceService {
  private baseUrl: string;

  constructor(
    private consoleLogService: ConsoleLogService,
    private contractService: ContractsService,
  ) {
    this.baseUrl = `https://${(EthereumService.targetedNetwork !== Networks.Mainnet) ?
      `${EthereumService.targetedNetwork}-` : ""}api.ethplorer.io/`;
  }

  public getTokenPrice(address: Address, peggedToEth = false): Promise<string> {
    return axios.get(`${this.baseUrl}getTokenInfo/${address}?apiKey=${process.env.ETHPLORER_ID}`)
      .then(
        (response) => {
          return response.data.price ? response.data.price.rate :
            (peggedToEth ? this.getEthPrice(address) : "0");
        },
      )
      .catch((error) => {
        this.consoleLogService.handleFailure(
          new EventConfigFailure(`PriceService: ${error.response?.data?.error.message ?? "Error fetching token price"}: ${address}`));
        // throw new Error(`${error.response?.data?.error.message ?? "Error fetching token price"}`);
        return "0";
      });
  }

  public getAddressInfo(address: Address): Promise<any> {
    return axios.get(`${this.baseUrl}getAddressInfo/${address}?apiKey=${process.env.ETHPLORER_ID}&token`)
      .then(
        (response) => {
          return response.data;
        },
      )
      .catch((error) => {
        this.consoleLogService.handleFailure(
          new EventConfigFailure(`PriceService: ${error.response?.data?.error.message ?? "Error fetching token information"}: ${address}`));
        throw new Error(`${error.response?.data?.error.message ?? "Error fetching token information"}`);
      });
  }

  public async getEthPrice(address?: Address): Promise<string> {
    /**
     * heuristic is to pass the DAO's address. but there is an ETH price associated with any
     * contract, and maybe is a good way to get the value of WETH by passing its address.
     * Pass no address to use the PrimeDAO's address.
     */
    if (!address) {
      address = this.contractService.getContractAddress(ContractNames.PrimeDAO);
    }
    const tokenInfo = await this.getAddressInfo(address);
    return tokenInfo.ETH.price ? tokenInfo.ETH.price.rate : "0";
  }
}
