import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, bindable, bindingMode, computedFrom } from "aurelia-framework";
import { DateService } from "services/DateService";
import { DisposableCollection } from "services/DisposableCollection";
import { Address, EthereumService } from "services/EthereumService";
import { ILockInfo, ILockInfoX, LockService } from "services/LockService";
import "./locksForReputation.scss";
import tippy from "tippy.js";

@autoinject
export class LocksForReputation {

  public locks: Array<ILockInfo> = [];

  @bindable({ defaultBindingMode: bindingMode.oneTime })
  public release: (config: { lock: ILockInfo, releaseButton: Element }) => Promise<boolean>;

  private loading = true;
  private subscriptions = new DisposableCollection();

  @computedFrom("ethereumService.defaultAccountAddress")
  private get connected(): boolean {
    return !!this.ethereumService.defaultAccountAddress;
  }

  constructor(
    private ethereumService: EthereumService,
    private lockService: LockService,
    private eventAggregator: EventAggregator,
    private dateService: DateService,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Account", async (_account: Address) => {
      this.accountChanged();
    }));

    this.subscriptions.push(this.eventAggregator.subscribe("Lock.Submitted", async (_account: Address) => {
      this.getLocks();
    }));

    this.subscriptions.push(this.eventAggregator.subscribe("Network.NewBlock", async () => {
      for (const lock of this.locks) {
        const lockInfo = lock as ILocksTableInfo;

        if (!lockInfo.released &&
          !lockInfo.canRelease &&
          (this.ethereumService.lastBlockDate > lockInfo.releaseTime)) {
          lockInfo.canRelease = await this.canRelease(lock);
        }
      }
    }));
  }

  private accountChanged(): Promise<void> {
    if (this.ethereumService.defaultAccountAddress) {
      return this.getLocks();
    } else {
      this.locks = undefined;
    }
  }

  public attached(): Promise<void> {
    return this.accountChanged();
  }

  public detached(): void {
    this.subscriptions.dispose();
  }

  private async _release(lock: ILocksTableInfo, event: Event): Promise<void> {

    /* eslint-disable require-atomic-updates */
    if (!lock.canRelease || lock.releasing) { return; }

    lock.releasing = true;

    try {

      const releaseButton = (event.target as Element).nextElementSibling;

      const success = await this.release({ lock, releaseButton });
      if (success) {
        const newLockInfo = (await this.lockService.getLockInfo(lock.lockerAddress, lock.lockId));
        lock.amount = newLockInfo.amount;
        lock.released = newLockInfo.released;
        lock.canRelease = !lock.released;
      }
    } finally {
      lock.releasing = false;
    }
  /* eslint-enable require-atomic-updates */
  }

  private async canRelease(lock: ILockInfo): Promise<boolean> {
    if (lock.lockerAddress.toLowerCase() !== this.ethereumService.defaultAccountAddress.toLowerCase()) {
      return false;
    } else {
      const errMsg = await this.lockService.getReleaseBlocker(lock);
      return !errMsg;
    }
  }

  /**
   * Returns whether the given lock release date/time occurs today.
   * "Today" is defined in terms of the calendar day, local time.
   * @param releaseTime
   */
  private releasableToday(releaseTime: Date): boolean {
    const now = new Date();
    return (releaseTime.getDate() === now.getDate()) &&
      (releaseTime.getMonth() === now.getMonth()) &&
      (releaseTime.getFullYear() === now.getFullYear());
  }

  private releaseDate(lock: ILocksTableInfo): string {

    // tslint:disable-next-line: max-line-length
    return `${this.dateService.toString(lock.releaseTime, lock.releasableToday ? "table-time" : "table-date")}${lock.releasableToday ? " today" : ""}`;
  }

  private releaseTitle(lock: ILocksTableInfo): string {
    return `${this.dateService.toString(lock.releaseTime, "table-datetime")}`;
  }

  private async _refresh(): Promise<void> {
    this.loading = true;
    try {
      await this.getLocks(false);
      // this.eventAggregator.publish("showMessage", "Locks have been refreshed");
    } finally {
      this.loading = false;
    }
  }

  private async getLocks(endOfLoading = true): Promise<void> {

    this.loading = true;

    const locks = await this.lockService.getUserLocks(this.ethereumService.defaultAccountAddress);
    /**
     * The symbol is for the LocksForReputation table
     */
    for (const lock of locks) {
      const lockInfoX = lock as ILocksTableInfo;
      lockInfoX.sending = false;
      lockInfoX.canRelease = await this.canRelease(lock);
      lockInfoX.releasableToday = this.releasableToday(lock.releaseTime);
    }
    // this.anyCanRelease = locks.filter((l: ILocksTableInfo) => l.canRelease).length > 0;

    this.locks = locks as Array<ILocksTableInfo>;

    this.loading = !endOfLoading;
    setTimeout(() => tippy("[data-tippy-content]"), 0);
  }
}

export interface ILocksTableInfo extends ILockInfoX {
  sending: boolean;
  canRelease: boolean;
  releasing: boolean;
  releasableToday: boolean;
}
