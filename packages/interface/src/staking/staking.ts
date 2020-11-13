import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, customElement } from "aurelia-framework";
import { BigNumber } from "ethers";
import "./staking.scss";

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

  private valid(issueMessage = true): boolean {
    let message: string;

    if (this.bPrimeAmount.gt(this.model.userBPrimeBalance)) {
      message = "You don't have enough BPRIME to stake the amount you requested";
    }
    if (message) {
      if (issueMessage) {
        this.eventAggregator.publish("handleValidationError", message);
      }
      return false;
    }

    return true;
  }

  private handleSubmit(): void {
    if (this.valid()) {
      this.model.stakingStake(this.bPrimeAmount);
    }
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
