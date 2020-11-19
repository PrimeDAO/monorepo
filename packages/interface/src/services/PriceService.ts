import { autoinject } from "aurelia-framework";
import axios from "axios";
import { EventConfigFailure } from "services/GeneralEvents";
import { ConsoleLogService } from "services/ConsoleLogService";

export interface ITokenPrices {
  // key is "weth" or "primedao"
  [key: string]: number;
}

@autoinject
export class PriceService {

  constructor(
    private consoleLogService: ConsoleLogService,
  ) {
  }

  public getTokenPrices(): Promise<ITokenPrices> {
    const uri = "https://api.coingecko.com/api/v3/simple/price?ids=primedao%2Cweth&vs_currencies=USD%2CUSD";
    return axios.get(uri)
      .then((response) => {
        const keys = Object.keys(response.data);
        const keyCount = keys.length;
        const result: ITokenPrices = {};
        for (let i = 0; i < keyCount; ++i) {
          const tokenId = keys[i];
          result[tokenId] = response.data[tokenId].usd;
        }
        return result;
      })
      .catch((error) => {
        this.consoleLogService.handleFailure(
          new EventConfigFailure(`PriceService: Error fetching token price ${error?.message}`));
        // throw new Error(`${error.response?.data?.error.message ?? "Error fetching token price"}`);
        // TODO:  restore the exception?
        return {};
      });
  }
}
