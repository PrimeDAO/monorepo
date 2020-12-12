import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, bindable, bindingMode } from "aurelia-framework";
import { DateService } from "services/DateService";
import { EthereumService } from "services/EthereumService";
import { ILockInfo, ILockInfoX, LockService } from "services/LockService";

@autoinject
export class LocksForReputation {

  @bindable({ defaultBindingMode: bindingMode.toView })
  public locks: Array<ILockInfo> = [];

  @bindable({ defaultBindingMode: bindingMode.oneTime })
  public release: (config: { lock: ILockInfo, releaseButton: Element }) => Promise<boolean>;

  @bindable({ defaultBindingMode: bindingMode.oneTime })
  public refresh: () => Promise<void>;

  private _locks: Array<ILockInfo>;
  private anyCanRelease: boolean;
  private loading = true;

  constructor(
    private ethereumService: EthereumService,
    private lockService: LockService,
    private eventAggregator: EventAggregator,
    private dateService: DateService,
  ) {
  }

  public attached(): void {
    this.locksChanged(this.locks);
  }

  private async locksChanged(newLocks: Array<ILockInfo>) {
    if (!this.refresh) {
      // then we haven't been attached yet, so wait
      return;
    }

    this.loading = true;
    const tmpLocks = newLocks as Array<ILockInfoInternal>;

    for (const lock of tmpLocks) {
      lock.canRelease = await this.canRelease(lock);
      lock.releasableToday = this.releasableToday(lock.releaseTime);
    }
    this.anyCanRelease = tmpLocks.filter((l: ILockInfoInternal) => l.canRelease).length > 0;
    this._locks = tmpLocks;
    this.loading = false;
  }

  private async _release(lock: ILockInfoInternal, event: Event): Promise<void> {

    /* eslint-disable require-atomic-updates */
    if (!lock.canRelease || lock.releasing) { return; }

    lock.releasing = true;

    try {

      const releaseButton = (event.target as Element).nextElementSibling;

      const success = await this.release({ lock, releaseButton });
      if (success) {
        lock.canRelease = false; // await this.canRelease(lock);
        lock.amount = (await this.lockService.getLockInfo(lock.lockerAddress, lock.lockId)).amount;
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

  private releaseDate(lock: ILockInfoInternal): string {

    // tslint:disable-next-line: max-line-length
    return `${this.dateService.toString(lock.releaseTime, lock.releasableToday ? "table-time" : "table-date")}${lock.releasableToday ? " today" : ""}`;
  }

  private releaseTitle(lock: ILockInfoInternal): string {
    return `${this.dateService.toString(lock.releaseTime, "table-datetime")}`;
  }

  private async _refresh(): Promise<void> {
    this.loading = true;
    try {
      await this.refresh();
      this.eventAggregator.publish("showMessage", "Locks have been refreshed");
    } finally {
      this.loading = false;
    }
  }
}

export interface ILocksTableInfo extends ILockInfoX {
  units: string;
  sending: boolean;
}

interface ILockInfoInternal extends ILocksTableInfo {
  canRelease: boolean;
  releasing: boolean;
  releasableToday: boolean;
}
