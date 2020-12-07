import { autoinject } from "aurelia-framework";
import { ContractNames, ContractsService } from "services/ContractsService";
import { Address, EthereumService, Hash, Networks } from "services/EthereumService";
import { BigNumber } from "ethers";
import { EventAggregator } from "aurelia-event-aggregator";
import TransactionsService, { TransactionReceipt } from "services/TransactionsService";
import { IErc20Token } from "services/TokenService";

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
  amount: BigNumber | string;
  /**
   * the number of seconds the amount should be locked
   */
  period: number;
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
    private transactionService: TransactionsService,
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

  public async getLockingEndTime(): Promise<Date> {
    const dt = await this.lock4RepContract.lockingEndTime();
    return new Date(dt.toNumber() * 1000);
  }

  public async getLockingStartTime(): Promise<Date> {
    const dt = await this.lock4RepContract.lockingStartTime();
    return new Date(dt.toNumber() * 1000);
  }

  public async getMaxLockingPeriod(): Promise<number> {
    // returns seconds
    return (await this.lock4RepContract.maxLockingPeriod()).toNumber();
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

  public async lockerHasLocked(lockerAddress: Address): Promise<boolean> {
    if (!lockerAddress) {
      throw new Error("lockerAddress is not defined");
    }
    return (await this.getLockerScore(lockerAddress)).gt(0);
  }

  /**
   * Get a promise of the first date/time when anything can be redeemed
   */
  public async getRedeemEnableTime(): Promise<Date> {
    const seconds = await this.lock4RepContract.redeemEnableTime();
    return new Date(seconds.toNumber() * 1000);
  }

  public getTotalLocked(): Promise<BigNumber> {
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

    const maxLockingPeriod = await this.getMaxLockingPeriod();

    if (options.period > maxLockingPeriod) {
      return "the locking period exceeds the maximum locking period";
    }

    const lockingStartTime = await this.getLockingStartTime();
    const lockingEndTime = await this.getLockingEndTime();

    if ((now < lockingStartTime) || (now > lockingEndTime)) {
      return "the locking period has not started or has expired";
    }

    return null;
  }

  public async lock(options: ILockingOptions): Promise<TransactionReceipt> {

    const msg = await this.getLockBlocker(options);
    if (msg) {
      throw new Error(msg);
    }

    return this.transactionService.send(() =>
      this.lock4RepContract.lock(options.amount, options.period, options.tokenAddress, null),
    );
  }

  /**
   * returns how many tokens the given token contract currently allows the lockingContract
   * to transfer on behalf of the current account.
   */
  public getTokenAllowance(token: IErc20Token): Promise<BigNumber> {
    return token.allowance(
      this.ethereumService.defaultAccountAddress,
      ContractNames.LockingToken4Reputation,
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
}
