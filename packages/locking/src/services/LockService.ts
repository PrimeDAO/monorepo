import { autoinject } from "aurelia-framework";
import { ContractNames, ContractsService } from "services/ContractsService";
import { Address, EthereumService, Hash, Networks } from "services/EthereumService";
import { BigNumber } from "ethers";
import { EventAggregator } from "aurelia-event-aggregator";

export interface ILockInfo {
  lockerAddress: Address;
  /**
   * in Wei
   */
  amount: BigNumber;
  lockId: Hash;
  released: boolean;
  releaseTime: Date;
}

export interface IReleaseInfo {
  lockerAddress: Address;
  /**
   * in Wei
   */
  amount: BigNumber;
  lockId: Hash;
}

export interface ILockerInfo {
  lockerAddress: Address;
  score: BigNumber;
}

export interface IRedeemOptions {
  lockerAddress: Address;
  /**
   * block in which contract was created, to optimize search for Redeem events, if needed
   */
  contractBirthBlock?: number;
}

export interface IGetUserEarnedOptions {
  lockerAddress: Address;
  /**
   * block in which contract was created, to optimize search for Redeem events, if needed
   */
  contractBirthBlock?: number;
}

export interface IReleaseOptions {
  lockerAddress: Address;
  lockId: Hash;
}

export interface ILockingOptions {
  /**
   * in Wei
   */
  amount: BigNumber | string;
  /**
   * the number of seconds the amount should be locked
   */
  period: number;
  lockerAddress: Address;
  legalContractHash: Hash;
}

export interface ITokenSpecification {
  symbol: string;
  address: Address;
}

export interface ILockInfoX extends ILockInfo {
  transactionHash: Hash;
}

export interface ILockEvent {
  /**
   * indexed
   */
  _locker: Address;
  /**
   * indexed
   */
  _lockingId: Hash;
  /**
   * in Wei
   */
  _amount: BigNumber;
  _period: BigNumber;
  /**
   * extra
   */
  transactionHash: Hash;
}

/**
 * defined in ordinal sequence
 */
export interface ILockTokenEvent {
  /**
   * indexed
   */
  _lockingId: Hash;
  /**
   * indexed
   */
  _token: Address;
  /**
   * number/denominator is the price of the token at the time the token is locked
   */
  _numerator: BigNumber;
  /**
   * number/denominator is the price of the token at the time the token is locked
   */
  _denominator: BigNumber;
}

/**
 * defined in ordinal sequence
 */
export interface IReleaseEvent {
  /**
   * indexed
   */
  _lockingId: Hash;
  /**
   * indexed
   */
  _beneficiary: Address;
  /**
   * in Wei
   */
  _amount: BigNumber;
}

@autoinject
export class LockService {

  // private static lockableTokens: Map<Address, ITokenSpecification> = new Map<Address, ITokenSpecification>();

  private lock4RepContract: any;
  private userAddress: Address;
  private startingBlockNumber: number;

  constructor(
    private contractsService: ContractsService,
    private eventAggregator: EventAggregator,
    private ethereumService: EthereumService,
  ) {

    this.startingBlockNumber = this.ethereumService.targetedNetwork === Networks.Kovan ? 22431693 : 11389827;

    this.eventAggregator.subscribe("Contracts.Changed", async (): Promise<void> => {
      this.lock4RepContract = await this.contractsService.getContractFor(ContractNames.LockingToken4Reputation);
    });

    this.eventAggregator.subscribe("Network.Changed.Account", (account: Address): void => {
      this.userAddress = account;
    });

  }

  /**
   * Returns promise of array of `IReleaseInfo` for every `Release` event.
   */
  public async getReleases(beneficiary: Address = null, lockingId: Hash = null): Promise<Array<IReleaseInfo>> {
    const filter = this.lock4RepContract.filters.Release(lockingId, beneficiary);
    const releases = await this.lock4RepContract.queryFilter(filter, this.startingBlockNumber);
    return releases.map((release: IReleaseEvent) => {
      return {
        amount: release._amount,
        lockId: release._lockingId,
        lockerAddress: release._beneficiary,
      };
    });
  }

  /**
     * Returns the amount originally locked (which one can't obtain other than via
     * Release events once the lock is released).  Returns 0 if not released or event otherwise
     * not found.
     * @param lockerAddress
     * @param lockId
     */
  public async getReleasedAmount(lockerAddress: Address, lockId: Hash): Promise<BigNumber> {

    let amount = BigNumber.from(0);
    const releases = await this.getReleases(lockerAddress, lockId);

    if (releases.length) {
      amount = releases[0].amount;
    }
    return amount;
  }

  /**
     * Returns promise of information about a locked amount for the given locker and lockerId.
     * @param lockerAddress
     * @param lockId
     */
  public async getLockInfo(lockerAddress: Address, lockId: Hash): Promise<ILockInfo> {
    const lockInfo = await this.lock4RepContract.lockers(lockerAddress, lockId);
    let amount = lockInfo[0];
    let released = false;

    if (amount.eq(0)) {
      amount = await this.getReleasedAmount(lockerAddress, lockId);
      released = amount.gt(0); // should always be true!
    }

    return {
      amount,
      lockId,
      lockerAddress,
      releaseTime: new Date(lockInfo[1].toNumber() * 1000),
      released,
    };
  }

  /**
     * Returns returns `LockInfo` for each base contract `Lock` event.
     * Note this includes released locks.
     */
  public async getLocks(lockerAddress: Address = null, lockingId: Hash = null): Promise<Array<ILockInfoX>> {
    const filter = this.lock4RepContract.filters.Lock(lockerAddress, lockingId);
    const locks = await this.lock4RepContract.queryFilter(filter, this.startingBlockNumber);

    const lockInfos = new Array<ILockInfoX>();

    for (const lock of locks) {
      const lockInfo = (await this.getLockInfo(lock._locker, lock._lockingId)) as ILockInfoX;
      lockInfo.transactionHash = lock.transactionHash;
      lockInfos.push(lockInfo);
    }

    return lockInfos;
  }

  /**
    * Returns promise of information about the given locker, including the locker's score.
    * Score determines the proportion of total reputation that can be redeemed by the locker.
    *
    * @param lockerAddress
    */
  public async getLockerInfo(lockerAddress: Address): Promise<ILockerInfo> {
    const score = await this.lock4RepContract.scores(lockerAddress);
    return {
      lockerAddress,
      score,
    };
  }

  /**
   * Returns `LockerInfo` for each account that has created a lock.
   * It is fired for an account whenever a `Lock`, `Redeem` or `Release` event is emitted.
   */
  public async getLockers(lockerAddress: Address = null, lockingId: Hash = null): Promise<Array<ILockerInfo>> {

    const lockInfos = await this.getLocks(lockerAddress, lockingId);
    const foundAddresses = new Set<Address>();

    const lockers = new Array<ILockerInfo>();

    for (const lockInfo of lockInfos) {
      if (!foundAddresses.has(lockInfo.lockerAddress)) {
        foundAddresses.add(lockInfo.lockerAddress);
        const lockerInfo = await this.getLockerInfo(lockInfo.lockerAddress);
        lockers.push(lockerInfo);
      }
    }
    return lockers;
  }

  public async getUserLocks(): Promise<Array<ILockInfoX>> {

    const releases = await this.getReleases(this.userAddress);

    const locks = new Map<string, ILockInfoX>();

    const filter = this.lock4RepContract.filters.Lock(this.userAddress);
    const locksEvents: Array<ILockEvent> = await this.lock4RepContract.queryFilter(filter, this.startingBlockNumber);

    for (const event of locksEvents) {
      const amount = event._amount;
      const released = !!releases.filter((ri: IReleaseInfo) => ri.lockId === event._lockingId).length;

      if (!locks.get(event._lockingId)) {
        const lockInfo = await this.lock4RepContract.lockers(this.userAddress, event._lockingId);

        locks.set(event._lockingId, {
          amount,
          lockId: event._lockingId,
          lockerAddress: event._locker,
          releaseTime: new Date(lockInfo[1].toNumber() * 1000),
          released,
          transactionHash: event.transactionHash,
        });
      }
    }
    return Array.from(locks.values());
  }

  public async getUserUnReleasedLockCount(): Promise<number> {

    const filter = this.lock4RepContract.filters.Release(null, this.userAddress);
    const releases = await this.lock4RepContract.queryFilter(filter, this.startingBlockNumber);

    const locks = new Map<string, ILockInfoX>();
    let lockCount = 0;

    const locksFilter = this.lock4RepContract.filters.Lock(this.userAddress);
    const locksEvents: Array<ILockEvent> = await this.lock4RepContract.queryFilter(locksFilter, this.startingBlockNumber);

    for (const event of locksEvents) {
      const released = !!releases.filter((ri: IReleaseInfo) => ri.lockId === event._lockingId).length;

      if (!released && !locks.get(event._lockingId)) {
        ++lockCount;
      }
    }
    return lockCount;
  }
}
