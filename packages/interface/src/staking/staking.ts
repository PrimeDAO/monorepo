import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, customElement, singleton } from "aurelia-framework";
import { BigNumber } from "ethers";
import { EventConfigFailure } from "services/GeneralEvents";
import "./staking.scss";

@singleton(false)
@customElement("liquidity")
@autoinject
export class Staking {

  private model: IStakingModel;
  private bPrimeAmount: BigNumber;
  private defaultBPrimeAmount: BigNumber;

  constructor(
    private eventAggregator: EventAggregator) {}

  public activate(_model: unknown, routeConfig: { settings: { state: IStakingModel }}): void {
    this.model = routeConfig.settings.state;
  }

  private handleSubmit(): void {
    this.model.stakingStake(this.bPrimeAmount);
  }

  private handleGetMaxBPrime() {
    this.defaultBPrimeAmount = this.model.userBPrimeBalance;
  }
}

interface IStakingModel {
  connected: boolean;
  userBPrimeBalance: BigNumber
  stakingStake(amount: BigNumber): Promise<void>;
}
