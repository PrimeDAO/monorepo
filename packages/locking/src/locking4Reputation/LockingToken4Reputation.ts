import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, computedFrom } from "aurelia-framework";
import {
  EventConfigException,
  EventConfigFailure,
  EventConfigTransaction,
  EventMessageType,
} from "services/GeneralEvents";
import { ILockerInfo, ILockingOptions, ITokenSpecification, LockService } from "services/LockService";
import { IErc20Token, TokenService } from "services/TokenService";
import { Address, EthereumService } from "services/EthereumService";
import { ContractNames, ContractsService } from "services/ContractsService";
import { BigNumber } from "ethers";
import { DisposableCollection } from "services/DisposableCollection";
// import {
//   Address,
//   Erc20Factory,
//   Erc20Wrapper,
//   LockInfo,
//   LockingToken4ReputationWrapper,
//   TokenLockingOptions,
// } from '../services/ArcService';

@autoinject
export class LockingToken4Reputation {

  private lockableTokens: Array<ITokenSpecificationX> = [];
  private tokenIsLiquid = false;
  private dashboard: HTMLElement;
  private allowance = BigNumber.from(0);
  private _approving = false;
  private token: IErc20Token;
  private lockingStartTime: Date;
  private lockingEndTime: Date;
  private lockingPeriodHasNotStarted: boolean;
  private lockingPeriodIsEnded: boolean;
  private msUntilCanLockCountdown: number;
  private msRemainingInPeriodCountdown: number;
  private refreshing = false;
  private loaded = false;
  private lockerInfo: ILockerInfo;
  private subscriptions = new DisposableCollection();
  private locks: Array<ILocksTableInfo>;
  private _locking = false;
  private _releasing = false;
  private sending = false;
  private tokenAddress: Address;

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

  private get approveButton(): HTMLElement {
    return this.myView.find("#approveButton")[0];
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
  }

  public async attached(): Promise<void> {

    this.loaded = false;

    try {

      this.tokenAddress = this.contractsService.getContractAddress(ContractNames.PRIMETOKEN);

      await this.refresh();

      this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Account", (_account: Address) => {
        this.accountChanged();
      }));

      this.subscriptions.push(this.eventAggregator.subscribe("secondPassed", async (blockDate: Date) => {
        this.refreshCounters(blockDate);
      }));
    } finally {
      this.loaded = true;
    }
  }

  public detached(): void {
    this.subscriptions.dispose();
  }

  private async refresh() {
    this.refreshing = true;
    this.token = this.tokenService.getTokenContract(this.contractsService.getContractAddress(ContractNames.PRIMETOKEN));

    this.lockingStartTime = await this.lockService.getLockingStartTime();
    this.lockingEndTime = await this.lockService.getLockingEndTime();

    await this.accountChanged();
    await this.refreshCounters(this.ethereumService.lastBlockDate);
    this.tokenIsLiquid = await this.getTokenIsLiquid(this.tokenAddress);

    /**
     * This will cause all of the TokenBalance elements to be created, attached and for them to set
     * their balances.
     */
    await this.getTokenAllowance();
    this.refreshing = false;
  }

  private accountChanged() {
    /**
     * note: Token will update itself with the new account balance
     */
    return this.getLocks();
  }

  private refreshCounters(blockDate: Date): void {
    this.getLockingPeriodIsEnded(blockDate);
    this.getLockingPeriodHasNotStarted(blockDate);
    this.getMsUntilCanLockCountdown(blockDate);
    this.getMsRemainingInPeriodCountdown(blockDate);
  }

  private async getLockBlocker(reason?: string): Promise<boolean> {

    //   const maxLockingPeriodDays = this.appConfig.get('maxLockingPeriodDays');
    //   // convert days to seconds
    //   if (this.lockModel.period > (maxLockingPeriodDays * 86400)) {
    //     reason = `Locking period cannot be more than ${maxLockingPeriodDays} days`;
    //   }
    // }
    reason = await this.lockService.getLockBlocker(this.lockModel);

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

  private async release(config: { lock: ILocksTableInfo, releaseButton: JQuery<EventTarget> }): Promise<boolean> {
    const lockInfo = config.lock;

    if (this.locking || this.releasing) {
      return false;
    }

    let success = false;

    try {

      this.releasing = lockInfo.sending = true;

      const result = await (this.lockService as any).release(lockInfo) as ArcTransactionResult;

      lockInfo.sending = false;

      await result.watchForTxMined();

      // this.eventAggregator.publish("handleTransaction",
      //   new EventConfigTransaction("The lock has been released", result.tx));

      // lockInfo.released = true;

      this.eventAggregator.publish("Lock.Released");

      success = true;

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

  private async lock(): Promise<boolean> {

    if (this.locking || this.releasing) {
      return false;
    }

    let success = false;
    /**
     * just to be sure we're up-to-date
     */
    await this.getTokenAllowance();
    if (this.sufficientAllowance) {

      try {
        this.locking = true;

        if (!(await this.getLockBlocker())) {

          this.sending = true;

          /*const result = */ await this.lockService.lock(this.lockModel);

          this.sending = false;

          // await this.getLocks();

          // this.eventAggregator.publish("handleTransaction", new EventConfigTransaction(
          //   "The lock has been recorded", result.tx));

          this.eventAggregator.publish("Lock.Submitted");

          success = true;
          UtilsInternal.resetInputField(this.dashboard, "lockAmount", null);
          UtilsInternal.resetInputField(this.dashboard, "lockingPeriod", null);
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

  private async approve(): Promise<boolean> {

    if (this.sufficientAllowance) {
      /**
       * this shouldn't happen
       */
      this.eventAggregator.publish("handleFailure",
        new EventConfigFailure("The token already has sufficient allowance"));
      return false;
    }

    this.lockModel.tokenAddress = this.tokenAddress;

    try {

      this.approving = true;

      const token = this.tokenService.getTokenContract(this.tokenAddress);

      const totalSupply = await token.totalSupply();

      this.sending = true;

      const result = await token.approve(
        this.contractsService.getContractAddress(ContractNames.PRIMETOKEN),
        totalSupply,
      );

      this.eventAggregator.publish("handleTransaction", new EventConfigTransaction(
        "The token approval has been recorded", result));

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

export interface ITokenSpecificationX extends ITokenSpecification {
  balance?: BigNumber;
}
