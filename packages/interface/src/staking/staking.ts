import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, customElement, singleton } from "aurelia-framework";
import { BigNumber } from "ethers";
// import { AureliaHelperService } from "services/AureliaHelperService";
import { Address } from "services/EthereumService";
import "./staking.scss";

@singleton(false)
@customElement("liquidity")
@autoinject
export class Staking {

  private model: IStakingModel;
  private bPrimeAmount: Address;
  private defaultBPrimeAmount: BigNumber;

  constructor(
    private eventAggregator: EventAggregator) {}

  public activate(_model: unknown, routeConfig: { settings: { state: IStakingModel }}): void {
    this.model = routeConfig.settings.state;
  }

  private handleSubmit(): void {
    // if (this.model.remove) {

    // } else {

    // }
  }

  private handleGetMaxBPrime() {
    this.defaultBPrimeAmount = this.model.userBPrimeBalance;
  }
}

interface IStakingModel {
  connected: boolean;
  harvest: boolean; // if falsy then stake
  userBPrimeBalance: BigNumber
}
