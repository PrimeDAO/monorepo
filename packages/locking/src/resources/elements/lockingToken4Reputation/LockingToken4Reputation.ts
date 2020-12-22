import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, computedFrom, customElement, bindable } from "aurelia-framework";
import {
  EventConfigException,
  EventConfigFailure,
} from "services/GeneralEvents";
import { ILockingOptions, IReleaseOptions, LockService } from "services/LockService";
import { IErc20Token, TokenService } from "services/TokenService";
import { Address, EthereumService } from "services/EthereumService";
import { ContractNames, ContractsService } from "services/ContractsService";
import { DisposableCollection } from "services/DisposableCollection";
import { ITokenSpecificationX } from "resources/value-converters/sortTokens";
import "./LockingToken4Reputation.scss";
import { ILocksTableInfo } from "resources/elements/locksForReputation/locksForReputation";
import { BigNumber } from "ethers";

@customElement("lockingform")
@autoinject
export class LockingToken4Reputation {

  lockableTokens: Array<ITokenSpecificationX> = [];
  tokenIsLiquid = false;
  allowance = undefined;
  refreshing = false;
  subscriptions = new DisposableCollection();
  sending = false;
  tokenAddress: Address;
  token: IErc20Token;
  @bindable userPrimeBalance: BigNumber;
  @bindable lockingEndTime: Date;
  @bindable lockingStartTime: Date;
  @bindable lockingPeriodHasNotStarted: boolean;
  @bindable lockingPeriodIsEnded: boolean;
  @bindable msUntilCanLockCountdown: number;
  @bindable msRemainingInPeriodCountdown: number;
  @bindable inLockingPeriod: boolean;

  lockModel: ILockingOptions = {
    tokenAddress: undefined,
    amount: undefined,
    period: undefined,
  };

  locking: boolean;
  releasing: boolean;
  approving: boolean;

  @computedFrom("allowance")
  get noAllowance(): boolean {
    return !!this.allowance?.eq("0");
  }

  @computedFrom("allowance", "lockModel.amount")
  get sufficientAllowance(): boolean {
    return !!(this.allowance?.gt("0") && this.allowance?.gte(this.lockModel.amount || 0));
  }

  @computedFrom("allowance", "lockModel.amount")
  get hasPartialAllowance(): boolean {
    return !!(this.allowance?.gt("0") && !!this.lockModel.amount?.gt(0) && this.allowance?.lt(this.lockModel.amount));
  }

  @computedFrom("ethereumService.defaultAccountAddress")
  get connected(): boolean {
    return !!this.ethereumService.defaultAccountAddress;
  }

  constructor(
    private eventAggregator: EventAggregator,
    private tokenService: TokenService,
    private contractsService: ContractsService,
    private ethereumService: EthereumService,
    private lockService: LockService,
  ) {
    this.lockModel.tokenAddress = this.tokenAddress = this.contractsService.getContractAddress(ContractNames.PRIMETOKEN);

    this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed", (_account: Address) => {
      this.token = this.tokenService.getTokenContract(this.tokenAddress);
    }));

  }

  async attached(): Promise<void> {
    this.refreshing = true;
    this.token = this.tokenService.getTokenContract(this.tokenAddress);
    this.tokenIsLiquid = await this.getTokenIsLiquid(this.tokenAddress);
    await this.accountChanged();
    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Account", async (_account: Address) => {
      this.accountChanged();
    }));
    this.refreshing = false;
  }

  detached(): void {
    this.subscriptions.dispose();
  }

  async accountChanged(): Promise<void> {
    this.allowance = undefined;
    if (this.ethereumService.defaultAccountAddress) {
      await this.getTokenAllowance();
    }
  }

  async getLockBlocker(): Promise<boolean> {

    //   const maxLockingPeriodDays = this.appConfig.get('maxLockingPeriodDays');
    //   // convert days to seconds
    //   if (this.lockModel.period > (maxLockingPeriodDays * 86400)) {
    //     reason = `Locking period cannot be more than ${maxLockingPeriodDays} days`;
    //   }
    // }
    const reason = await this.lockService.getLockBlocker(this.lockModel);

    if (reason) {
      this.eventAggregator.publish("handleFailure", new EventConfigFailure(`Can't lock: ${reason}`));
      return true;
    }

    return false;
  }

  async getReleaseBlocker(options: IReleaseOptions): Promise<boolean> {
    const reason = await this.lockService.getReleaseBlocker(options);

    if (reason) {
      this.eventAggregator.publish("handleFailure", new EventConfigFailure(`Can't release: ${reason}`));
      return true;
    }

    return false;
  }

  async lock(): Promise<boolean> {

    if (this.locking || this.releasing) {
      return false;
    }

    if (!this.lockModel.amount || this.lockModel.amount.eq(0) || !this.lockModel.period) {
      this.eventAggregator.publish("handleValidationError", new EventConfigFailure("Please enter an amount of tokens and number of days"));
      return false;
    }

    if (!this.ethereumService.ensureConnected()) {
      return false;
    }

    const success = false;
    /**
     * just to be sure we're up-to-date
     */
    await this.getTokenAllowance();
    if (this.sufficientAllowance) {

      try {
        this.locking = true;

        if (!(await this.getLockBlocker())) {

          this.sending = true;

          await this.lockService.lock(this.lockModel);

          this.sending = false;

          this.eventAggregator.publish("Lock.Submitted");
        }
      } catch (ex) {
        this.eventAggregator.publish("handleException",
          new EventConfigException("The token lock was not recorded", ex));
      } finally {
        await this.getTokenAllowance();
        this.locking = false;
        this.sending = false;
      }
    }
    return success;
  }

  async release(config: { lock: ILocksTableInfo, releaseButton: Element }): Promise<boolean> {
    const lockInfo = config.lock;

    if (this.locking || this.releasing) {
      return false;
    }

    if (!this.ethereumService.ensureConnected()) {
      return false;
    }

    let success = false;

    try {

      this.releasing = lockInfo.sending = true;

      if (!(await this.getReleaseBlocker(lockInfo))) {
        await this.lockService.release(lockInfo);

        this.eventAggregator.publish("Lock.Released");

        success = true;
      }

    } catch (ex) {
      this.eventAggregator.publish("handleException",
        new EventConfigException("The lock was not released", ex));
    } finally {
      this.releasing = lockInfo.sending = false;
    }
    return success;
  }

  async approve(): Promise<boolean> {

    if (!this.ethereumService.ensureConnected()) {
      return false;
    }

    if (this.sufficientAllowance) {
      /**
       * this shouldn't happen
       */
      this.eventAggregator.publish("handleFailure",
        new EventConfigFailure("The token already has sufficient allowance"));
      return false;
    }

    try {

      this.approving = true;

      const totalSupply = await this.token.totalSupply();

      this.sending = true;

      await this.token.approve(
        this.lockService.lock4RepContractAddress,
        totalSupply,
      );

      return true;

    } catch (ex) {
      this.eventAggregator.publish("handleException",
        new EventConfigException("The token approval was not accepted", ex));
    } finally {
      await this.getTokenAllowance();
      this.approving = false;
      this.sending = false;
    }
    return false;
  }

  async getTokenAllowance(): Promise<void> {
    this.allowance = await this.lockService.getTokenAllowance(this.token);
  }

  async getTokenIsLiquid(token: Address): Promise<boolean> {
    return this.lockService.getTokenIsLiquid(token);
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }

  handleGetMaxPrime(): void {
    this.lockModel.amount = this.userPrimeBalance;
  }

  async handleGetMaxLockingPeriod(): Promise<void> {
    this.lockModel.period = await this.lockService.getMaxLockingDuration();
  }
}
