import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, computedFrom } from "aurelia-framework";
import { BigNumber } from "ethers";
import { Address } from "services/EthereumService";
import "./staking.scss";

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

  @computedFrom("model.poolTokenAllowances")
  private get bPrimeAllowance(): BigNumber {
    return this.model.poolTokenAllowances.get(this.model.bPrimeTokenAddress);
  }

  @computedFrom("bPrimeAmount", "model.userBPrimeBalance")
  private get bPrimeAmountValid(): boolean {
    return !this.bPrimeAmount || (this.bPrimeAmount.lte(this.model.userBPrimeBalance) && !this.bPrimeAmount.isZero());
  }

  @computedFrom("bPrimeAmount", "bPrimeAllowance")
  private get bPrimeHasSufficientAllowance(): boolean {
    return !this.bPrimeAmount || this.bPrimeAllowance.gte(this.bPrimeAmount);
  }

  private assetsAreLocked(issueMessage = true): boolean {
    let message: string;
    if (!this.bPrimeHasSufficientAllowance) {
      message = "You need to unlock BPRIME for transfer";
    }

    if (message) {
      if (issueMessage) {
        this.eventAggregator.publish("handleValidationError", message);
      }
      return false;
    }

    return true;
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

  private unlock() {
    this.model.stakingSetTokenAllowance(this.bPrimeAmount.sub(this.bPrimeAllowance));
  }

  private handleSubmit(): void {
    if (this.valid() && this.assetsAreLocked()) {
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
  bPrimeTokenAddress: Address;
  poolTokenAllowances: Map<Address, BigNumber>;
  stakingSetTokenAllowance(amount: BigNumber): void;
  stakingStake(amount: BigNumber): Promise<void>;
}
