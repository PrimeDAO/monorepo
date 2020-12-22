import { autoinject } from "aurelia-framework";
import { ContractNames, ContractsService, IStandardEvent } from "services/ContractsService";
import { Address, EthereumService, Hash, Networks, NULL_HASH } from "services/EthereumService";
import { BigNumber } from "ethers";
import { EventAggregator } from "aurelia-event-aggregator";
import TransactionsService, { TransactionReceipt } from "services/TransactionsService";
import { IErc20Token } from "services/TokenService";
import { DateService, TimespanResolution } from "services/DateService";

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
  tokenAddress: Address;
  /**
   * in Wei
   */
  amount: BigNumber;
  /**
   * the number of seconds the amount should be locked
   */
  period: number;
  agreementHash?: Hash;
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
export interface IRedeemEvent {
  /**
   * indexed
   */
  _beneficiary: Address;
  /**
   * in Wei
   */
  _amount: BigNumber;
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

  public lock4RepContract: any;
  public lock4RepContractAddress: Address;
  private startingBlockNumber: number;

  private get userAddress(): Address {
    return this.ethereumService.defaultAccountAddress;
  }

  constructor(
    private contractsService: ContractsService,
    private eventAggregator: EventAggregator,
    private ethereumService: EthereumService,
    private transactionService: TransactionsService,
    private dateService: DateService,
  ) {

    this.startingBlockNumber = this.ethereumService.targetedNetwork === Networks.Kovan ? 22431693 : 11389827;

    this.eventAggregator.subscribe("Contracts.Changed", async (): Promise<void> => {
      this.initialize();
    });
  }

  public async initialize(): Promise<void> {
    this.lock4RepContract = await this.contractsService.getContractFor(ContractNames.LockingToken4Reputation);
    this.lock4RepContractAddress = this.contractsService.getContractAddress(ContractNames.LockingToken4Reputation);
  }

  /**
   * Returns promise of array of `IReleaseInfo` for every `Release` event.
   */
  public async getReleases(beneficiary: Address = null, lockingId: Hash = null): Promise<Array<IReleaseInfo>> {
    const filter = this.lock4RepContract.filters.Release(lockingId, beneficiary);
    const releases: Array<IStandardEvent> = await this.lock4RepContract.queryFilter(filter, this.startingBlockNumber);
    return releases.map((releaseEvent: IStandardEvent) => {
      const eventArgs: IReleaseEvent = releaseEvent.args;
      return {
        amount: eventArgs._amount,
        lockId: eventArgs._lockingId,
        lockerAddress: eventArgs._beneficiary,
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
    const lockEvents: Array<IStandardEvent> = await this.lock4RepContract.queryFilter(filter, this.startingBlockNumber);

    const lockInfos = new Array<ILockInfoX>();

    for (const lockEvent of lockEvents) {
      const eventArgs: ILockEvent = lockEvent.args;
      const lockInfo = (await this.getLockInfo(eventArgs._locker, eventArgs._lockingId)) as ILockInfoX;
      lockInfo.transactionHash = lockEvent.transactionHash;
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

  public async getUserLocks(lockerAddress: Address, withIsReleased = true): Promise<Array<ILockInfoX>> {

    const releases = withIsReleased ? (await this.getReleases(lockerAddress)) : [];

    const locks = new Map<string, ILockInfoX>();

    const filter = this.lock4RepContract.filters.Lock(lockerAddress);
    const lockEvents: Array<IStandardEvent> = await this.lock4RepContract.queryFilter(filter, this.startingBlockNumber);

    for (const event of lockEvents) {
      const eventArgs: ILockEvent = event.args;
      const amount = eventArgs._amount;
      const released = !!releases.filter((ri: IReleaseInfo) => ri.lockId === eventArgs._lockingId).length;

      if (!locks.get(eventArgs._lockingId)) {
        const lockInfo = await this.lock4RepContract.lockers(lockerAddress, eventArgs._lockingId);

        locks.set(eventArgs._lockingId, {
          amount,
          lockId: eventArgs._lockingId,
          lockerAddress: eventArgs._locker,
          releaseTime: new Date(lockInfo[1].toNumber() * 1000),
          released,
          transactionHash: eventArgs.transactionHash,
        });
      }
    }
    return Array.from(locks.values());
  }

  public async getUserUnReleasedLockCount(): Promise<number> {

    const filter = this.lock4RepContract.filters.Release(null, this.userAddress);
    const releases: Array<IStandardEvent> = await this.lock4RepContract.queryFilter(filter, this.startingBlockNumber);

    const locks = new Map<string, ILockInfoX>();
    let lockCount = 0;

    const locksFilter = this.lock4RepContract.filters.Lock(this.userAddress);
    const lockEvents: Array<IStandardEvent> = await this.lock4RepContract.queryFilter(locksFilter, this.startingBlockNumber);

    for (const event of lockEvents) {
      const eventArgs: ILockEvent = event.args;
      const released = !!releases.filter((ri: IStandardEvent) => ri.args.lockId === eventArgs._lockingId).length;

      if (!released && !locks.get(eventArgs._lockingId)) {
        ++lockCount;
      }
    }
    return lockCount;
  }

  public async getLockingEndTime(): Promise<Date> {
    const dt = await this.lock4RepContract.lockingEndTime();
    return new Date(dt.toNumber() * 1000);
  }

  public async getLockingStartTime(): Promise<Date> {
    const dt = await this.lock4RepContract.lockingStartTime();
    return new Date(dt.toNumber() * 1000);
  }

  private _maxLockingDuration: number;
  public async getMaxLockingDuration(): Promise<number> {
    // returns seconds
    return this._maxLockingDuration ??
      (this._maxLockingDuration = (await this.lock4RepContract.maxLockingPeriod()).toNumber());
  }

  public getAvatar(): Promise<Address> {
    return this.lock4RepContract.avatar();
  }

  public async getLockerScore(lockerAddress: Address): Promise<BigNumber> {
    if (!lockerAddress) {
      throw new Error("lockerAddress is not defined");
    }
    const lockerInfo = await this.getLockerInfo(lockerAddress);
    return lockerInfo ? lockerInfo.score : BigNumber.from(0);
  }

  public async userHasLocked(lockerAddress: Address): Promise<boolean> {
    if (!lockerAddress) {
      throw new Error("lockerAddress is not defined");
    }
    return (await this.getUserLocks(lockerAddress, false)).length > 0;
  }

  /**
   * Get a promise of the first date/time when anything can be redeemed
   */
  public async getRedeemEnableTime(): Promise<Date> {
    const seconds = await this.lock4RepContract.redeemEnableTime();
    return new Date(seconds.toNumber() * 1000);
  }

  public getTotalTokensLocked(): Promise<BigNumber> {
    return this.lock4RepContract.totalLocked();
  }
  public getTotalLockedLeft(): Promise<BigNumber> {
    return this.lock4RepContract.totalLockedLeft();
  }
  public getTotalScore(): Promise<BigNumber> {
    return this.lock4RepContract.totalScore();
  }
  /**
   * get total number of locks
   */
  public async getLockCount(): Promise<number> {
    return (await this.lock4RepContract.lockingsCounter()).toNumber();
  }

  /**
   * get the total reputation this contract will reward
   */
  public getReputationReward(): Promise<BigNumber> {
    return this.lock4RepContract.reputationReward();
  }
  /**
   * get the total reputation this contract has not yet rewarded
   */
  public getReputationRewardLeft(): Promise<BigNumber> {
    return this.lock4RepContract.reputationRewardLeft();
  }

  /**
   * Returns reason why can't lock, else null if can lock
   */
  public async getLockBlocker(options: ILockingOptions): Promise<string | null> {

    if (!this.ethereumService.defaultAccountAddress) {
      return "the current account address is not defined";
    }

    if (!Number.isInteger(options.period)) {
      return "The desired locking period is not expressed as a number of days";
    }

    let amount: BigNumber;

    try {
      amount = BigNumber.from(options.amount);
    } catch {
      return "amount does not represent a number";

    }

    if (amount.lte(0)) {
      return "amount to lock must be greater than zero";
    }

    if (!Number.isInteger(options.period)) {
      return "period does not represent a number";
    }

    if (options.period <= 0) {
      return "period must be greater than zero";
    }

    const now = this.ethereumService.lastBlockDate;

    const maxLockingPeriod = await this.getMaxLockingDuration();

    if (options.period > maxLockingPeriod) {
      return `the locking duration exceeds the maximum of ${this.dateService.ticksToTimeSpanString(maxLockingPeriod * 1000, TimespanResolution.seconds)}`;
    }

    const lockingStartTime = await this.getLockingStartTime();
    const lockingEndTime = await this.getLockingEndTime();

    if ((now < lockingStartTime) || (now > lockingEndTime)) {
      return "the locking period has not started or has expired";
    }

    return null;
  }

  public async lock(options: ILockingOptions): Promise<TransactionReceipt> {

    if (!options.amount) {
      throw new Error("amount is not defined");
    }

    if (!options.tokenAddress) {
      throw new Error("tokenAddress is not defined");
    }

    if (!options.tokenAddress) {
      throw new Error("tokenAddress is not defined");
    }

    return this.transactionService.send(() =>
      this.lock4RepContract.lock(options.amount, options.period, options.tokenAddress, options.agreementHash ?? NULL_HASH),
    );
  }

  /**
 * Returns error message else null if can release
 * @param lockerAddress
 * @param lockId
 */
  public async getReleaseBlocker(options: IReleaseOptions): Promise<string | null> {
    const lockInfo = await this.getLockInfo(options.lockerAddress, options.lockId);
    const now = this.ethereumService.lastBlockDate;
    const amount = BigNumber.from(lockInfo.amount);

    if (amount.lte(0)) {
      return "current locked amount must be greater than zero";
    }

    if (now <= lockInfo.releaseTime) {
      return "the lock period has not ended";
    }

    if (lockInfo.released) {
      return "lock is already released";
    }

    return null;
  }

  public async release(options: IReleaseOptions): Promise<TransactionReceipt> {

    if (!options.lockerAddress) {
      throw new Error("lockerAddress is not defined");
    }

    if (!options.lockId) {
      throw new Error("lockId is not defined");
    }

    return this.transactionService.send(() =>
      this.lock4RepContract.release(options.lockerAddress, options.lockId),
    );
  }

  /**
   * returns how many tokens the given token contract currently allows the lockingContract
   * to transfer on behalf of the current account.
   */
  public getTokenAllowance(token: IErc20Token): Promise<BigNumber> {
    return token.allowance(
      this.ethereumService.defaultAccountAddress,
      this.lock4RepContractAddress,
    );
  }

  public getPriceOracleAddress(): Promise<Address> {
    return this.lock4RepContract.priceOracleContract();
  }

  public async getTokenIsLiquid(token: Address): Promise<boolean> {
    return (await this.getTokenPriceFactor(token)) !== null;
  }

  public async getTokenPriceFactor(token: Address): Promise<BigNumber | null> {

    const oracleAddress = await this.getPriceOracleAddress();

    const oracle = this.contractsService.getContractAtAddress(ContractNames.PriceOracleInterface, oracleAddress);

    const price = (await oracle.getPrice(token)) as Array<BigNumber>;

    if (price && (price.length === 2) && price[0].gt(0) && price[1].gt(0)) {
      return price[0].div(price[1]);
    } else {
      return null;
    }
  }

  public async getUserEarnedReputation(lockerAddress: Address, redeemedAmount?: BigNumber): Promise<BigNumber> {

    let rep: BigNumber = BigNumber.from(0);

    if (!lockerAddress) {
      throw new Error("lockerAddress is not defined");
    }

    const hasAScore = (await this.getLockerScore(lockerAddress)).gt(0);
    if (hasAScore) {
      rep = redeemedAmount ?? await this.lock4RepContract.callStatic.redeem(lockerAddress);
    } else {
      /**
       * see if it is score of 0 by result of the reputation having already been redeemed
       */
      rep = await this.getRedeemedAmount(lockerAddress);
    }
    return rep;
  }

  public async getRedeemedAmount(lockerAddress: Address): Promise<BigNumber> {
    let rep: BigNumber = BigNumber.from(0);

    const filter = this.lock4RepContract.filters.Redeem(lockerAddress);
    const redeemEvents: Array<IStandardEvent> = await this.lock4RepContract.queryFilter(filter, this.startingBlockNumber);

    if (redeemEvents.length > 1) {
      throw new Error("unexpectedly received more than one Redeem event for the account");
    } else if (redeemEvents.length) {
      const eventArgs: IRedeemEvent = redeemEvents[0].args;
      rep = eventArgs._amount;
    }
    return rep;
  }
}
