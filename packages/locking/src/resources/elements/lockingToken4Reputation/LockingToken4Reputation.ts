import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, computedFrom, customElement } from "aurelia-framework";
import {
  EventConfigException,
  EventConfigFailure,
} from "services/GeneralEvents";
import { ILockingOptions, IReleaseOptions, LockService } from "services/LockService";
import { IErc20Token, TokenService } from "services/TokenService";
import { Address, EthereumService } from "services/EthereumService";
import { ContractNames, ContractsService } from "services/ContractsService";
import { BigNumber } from "ethers";
import { DisposableCollection } from "services/DisposableCollection";
import { ILocksTableInfo } from "resources/elements/locksForReputation/locksForReputation";
import { ITokenSpecificationX } from "resources/value-converters/sortTokens";
import "./LockingToken4Reputation.scss";

@customElement("lockingform")
@autoinject
export class LockingToken4Reputation {

  private lockableTokens: Array<ITokenSpecificationX> = [];
  private tokenIsLiquid = false;
  // private dashboard: HTMLElement;
  private allowance = BigNumber.from(0);
  private _approving = false;
  private lockingStartTime: Date;
  private lockingEndTime: Date;
  private lockingPeriodHasNotStarted: boolean;
  private lockingPeriodIsEnded: boolean;
  private msUntilCanLockCountdown: number;
  private msRemainingInPeriodCountdown: number;
  private refreshing = false;
  private loaded = false;
  private subscriptions = new DisposableCollection();
  private locks: Array<ILocksTableInfo>;
  private _locking = false;
  private _releasing = false;
  private sending = false;
  private tokenAddress: Address;
  private token: IErc20Token;

  private lockModel: ILockingOptions = {
    tokenAddress: undefined,
    amount: undefined,
    period: undefined,
  };

  @computedFrom("_locking")
  protected get locking(): boolean {
    return this._locking;
  }

  protected set locking(val: boolean) {
    this._locking = val;
    setTimeout(() => this.eventAggregator.publish("locking.busy", val), 0);
  }

  @computedFrom("_releasing")
  protected get releasing(): boolean {
    return this._releasing;
  }

  protected set releasing(val: boolean) {
    this._releasing = val;
    setTimeout(() => this.eventAggregator.publish("releasing.busy", val), 0);
  }

  @computedFrom("_approving")
  private get approving(): boolean {
    return this._approving;
  }

  private set approving(val: boolean) {
    this._approving = val;
    setTimeout(() => this.eventAggregator.publish("approving.busy", val), 0);
  }

  @computedFrom("allowance")
  private get noAllowance(): boolean {
    return this.allowance.eq("0");
  }

  @computedFrom("allowance", "lockModel.amount")
  private get sufficientAllowance(): boolean {
    return this.allowance.gt("0") && this.allowance.gte(this.lockModel.amount || 0);
  }

  @computedFrom("allowance", "lockModel.amount")
  private get hasPartialAllowance(): boolean {
    return this.allowance.gt("0") && this.allowance.lt(this.lockModel.amount || 0);
  }

  private get inLockingPeriod(): boolean {
    return !this.lockingPeriodHasNotStarted && !this.lockingPeriodIsEnded;
  }

  constructor(
    private eventAggregator: EventAggregator,
    private tokenService: TokenService,
    private contractsService: ContractsService,
    private ethereumService: EthereumService,
    private lockService: LockService,
  ) {
    this.lockModel.tokenAddress = this.tokenAddress = this.contractsService.getContractAddress(ContractNames.PRIMETOKEN);
    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Account", (_account: Address) => {
      this.accountChanged();
    }));

    this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed", (_account: Address) => {
      this.token = this.tokenService.getTokenContract(this.tokenAddress);
    }));

    this.subscriptions.push(this.eventAggregator.subscribe("secondPassed", async (blockDate: Date) => {
      if (this.loaded) {
        this.refreshCounters(blockDate);
      }
    }));
  }

  @computedFrom("ethereumService.defaultAccountAddress")
  private get connected(): boolean {
    return !!this.ethereumService.defaultAccountAddress;
  }
  public async attached(): Promise<void> {

    this.loaded = false;
    this.token = this.tokenService.getTokenContract(this.tokenAddress);
    await this.refresh();
    this.loaded = true;
  }

  public detached(): void {
    this.subscriptions.dispose();
  }

  private async refresh() {
    this.refreshing = true;

    this.lockingStartTime = await this.lockService.getLockingStartTime();
    this.lockingEndTime = await this.lockService.getLockingEndTime();
    this.tokenIsLiquid = await this.getTokenIsLiquid(this.tokenAddress);
    this.refreshCounters(this.ethereumService.lastBlockDate);

    await this.accountChanged();
    this.refreshing = false;
  }

  private async accountChanged() {
    if (this.ethereumService.defaultAccountAddress) {
      await this.getTokenAllowance();
      return this.getLocks();
    } else {
      this.locks = undefined;
      this.allowance = BigNumber.from(0);
    }
  }

  private refreshCounters(blockDate: Date): void {
    this.getLockingPeriodIsEnded(blockDate);
    this.getLockingPeriodHasNotStarted(blockDate);
    this.getMsUntilCanLockCountdown(blockDate);
    this.getMsRemainingInPeriodCountdown(blockDate);
  }

  private async getLocks(): Promise<void> {

    const locks = await this.lockService.getUserLocks();

    /**
     * The symbol is for the LocksForReputation table
     */
    for (const lock of locks) {
      const lockInfoX = lock as ILocksTableInfo;
      lockInfoX.units = "PRIME"; // await this.getLockUnit(lock as LockInfo);
      lockInfoX.sending = false;
    }

    this.locks = locks as Array<ILocksTableInfo>;
  }

  private getLockingPeriodHasNotStarted(blockDate: Date): boolean {
    return this.lockingPeriodHasNotStarted = (blockDate < this.lockingStartTime);
  }

  private getLockingPeriodIsEnded(blockDate: Date): boolean {
    return this.lockingPeriodIsEnded = (blockDate > this.lockingEndTime);
  }

  private getMsUntilCanLockCountdown(_blockDate: Date): number {
    return this.msUntilCanLockCountdown = Math.max(this.lockingStartTime.getTime() - Date.now(), 0);
  }

  private getMsRemainingInPeriodCountdown(_blockDate: Date): number {
    return this.msRemainingInPeriodCountdown = Math.max(this.lockingEndTime.getTime() - Date.now(), 0);
  }

  private async getLockBlocker(): Promise<boolean> {

    //   const maxLockingPeriodDays = this.appConfig.get('maxLockingPeriodDays');
    //   // convert days to seconds
    //   if (this.lockModel.period > (maxLockingPeriodDays * 86400)) {
    //     reason = `Locking period cannot be more than ${maxLockingPeriodDays} days`;
    //   }
    // }
    const reason = await this.lockService.getLockBlocker(this.lockModel);

    if (reason) {
      this.eventAggregator.publish("handleFailure", new EventConfigFailure(`Can't lock: ${reason}`));
      // await BalloonService.show({
      //   content: `Can't lock: ${reason}`,
      //   eventMessageType: EventMessageType.Failure,
      //   originatingUiElement: this.lockButton,
      // });
      return true;
    }

    return false;
  }

  private async getReleaseBlocker(options: IReleaseOptions): Promise<boolean> {
    const reason = await this.lockService.getReleaseBlocker(options);

    if (reason) {
      this.eventAggregator.publish("handleFailure", new EventConfigFailure(`Can't release: ${reason}`));
      // await BalloonService.show({
      //   content: `Can't release: ${reason}`,
      //   eventMessageType: EventMessageType.Failure,
      //   originatingUiElement: this.releaseButton,
      // });
      return true;
    }

    return false;
  }

  private async lock(): Promise<boolean> {

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

          await this.getLocks();

          this.eventAggregator.publish("Lock.Submitted");

          // UtilsInternal.resetInputField(this.dashboard, "lockAmount", null);
          // UtilsInternal.resetInputField(this.dashboard, "lockingPeriod", null);
        }
      } catch (ex) {
        this.eventAggregator.publish("handleException",
          new EventConfigException("The token lock was not recorded", ex));
      // await BalloonService.show({
      //   content: "The token lock was not recorded",
      //   eventMessageType: EventMessageType.Exception,
      //   originatingUiElement: this.lockButton,
      // });
      } finally {
        await this.getTokenAllowance();
        this.locking = false;
        this.sending = false;
      }
    }
    return success;
  }

  private async release(config: { lock: ILocksTableInfo, releaseButton: Element }): Promise<boolean> {
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

        lockInfo.released = true;

        this.eventAggregator.publish("Lock.Released");

        success = true;
      }

    } catch (ex) {
      this.eventAggregator.publish("handleException",
        new EventConfigException("The lock was not released", ex));
      // await BalloonService.show({
      //   content: "The lock was not released",
      //   eventMessageType: EventMessageType.Exception,
      //   originatingUiElement: config.releaseButton,
      // });
    } finally {
      this.releasing = lockInfo.sending = false;
    }
    return success;
  }

  private async approve(): Promise<boolean> {

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
      // await BalloonService.show({
      //   content: "The token approval was not accepted",
      //   eventMessageType: EventMessageType.Exception,
      //   originatingUiElement: this.approveButton,
      // });
    } finally {
      await this.getTokenAllowance();
      this.approving = false;
      this.sending = false;
    }
    return false;
  }

  private async getTokenAllowance() {
    this.allowance = await this.lockService.getTokenAllowance(this.token);
  }

  private async getTokenIsLiquid(token: Address): Promise<boolean> {
    return this.lockService.getTokenIsLiquid(token);
  }

  // private async selectToken(tokenSpec: ITokenSpecification) {
  //   signalBindings("token.changed");
  // }

}
