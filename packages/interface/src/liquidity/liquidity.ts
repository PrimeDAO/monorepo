import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, customElement, singleton } from "aurelia-framework";
import { BigNumber } from "ethers";
// import { AureliaHelperService } from "services/AureliaHelperService";
import { Address } from "services/EthereumService";
import "./liquidity.scss";

@singleton(false)
@customElement("liquidity")
@autoinject
export class Liquidity {

  private model: ILiquidityModel;
  private primeAmount: Address;
  private wethAmount: Address;
  private defaultPrimeAmount: BigNumber;
  private defaultWethAmount: BigNumber;

  constructor(
    private eventAggregator: EventAggregator) {}

  public activate(_model: unknown, routeConfig: { settings: { state: ILiquidityModel }}): void {
    this.model = routeConfig.settings.state;
  }

  private handleSubmit(): void {
    // if (this.model.remove) {

    // } else {

    // }
  }

  private handleGetMaxWeth() {
    this.defaultWethAmount = this.model.userWethBalance;
  }

  private handleGetMaxPrime() {
    this.defaultPrimeAmount = this.model.userPrimeBalance;
  }
}

interface ILiquidityModel {
  bPoolAddress: Address;
  connected: boolean;
  poolshare: BigNumber;
  remove: boolean; // if falsy then add
  swapfee: BigNumber;
  userBPrimeBalance: BigNumber;
  userPrimeBalance: BigNumber;
  userWethBalance: BigNumber;
}
