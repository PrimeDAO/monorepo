import { autoinject, singleton, computedFrom } from "aurelia-framework";
import { ContractNames } from "services/ContractsService";
import { ContractsService } from "services/ContractsService";
import "./dashboard.scss";
import { EventAggregator } from "aurelia-event-aggregator";
import { Address, EthereumService } from "services/EthereumService";
import { BigNumber } from "ethers";
import { EventConfigException } from "services/GeneralEvents";
import { AvatarService } from "services/AvatarService";
import { toBigNumberJs } from "services/BigNumberService";
import { LockService } from "services/LockService";
import { DisposableCollection } from "services/DisposableCollection";

@singleton(false)
@autoinject
export class Dashboard {
  initialized = false;
  connected = false;
  primeToken: any;
  lockingToken4Reputation: any;
  primeTokenAddress: Address;
  userPrimeBalance: BigNumber;
  tokensToLock: BigNumber;
  numDays: number;
  totalReputation: BigNumber;
  totalUserReputationEarned: BigNumber;
  percentUserReputationEarned: number;
  userHasRedeemed: boolean;
  lockingEndTime: Date;
  lockingStartTime: Date;
  lockingPeriodHasNotStarted: boolean;
  lockingPeriodIsEnded: boolean;
  msUntilCanLockCountdown: number;
  msRemainingInPeriodCountdown: number;
  subscriptions = new DisposableCollection();
  userHasLocked: boolean;

  @computedFrom("lockingPeriodHasNotStarted", "lockingPeriodIsEnded")
  get inLockingPeriod(): boolean {
    return !this.lockingPeriodHasNotStarted && !this.lockingPeriodIsEnded;
  }

  constructor(
    private eventAggregator: EventAggregator,
    private contractsService: ContractsService,
    private avatarService: AvatarService,
    private ethereumService: EthereumService,
    private lockService: LockService) {
  }

  async attached(): Promise<void> {

    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Account", async () => {
      await this.loadContracts();
      this.getUserBalances();
    }));

    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Disconnect", async () => {
      // TODO: undefine the bound variables
      this.initialized = false;
    }));

    await this.loadContracts();
    await this.initialize();
    this.subscriptions.push(this.eventAggregator.subscribe("secondPassed", async (blockDate: Date) => {
      this.refreshCounters(blockDate);
    }));
    return this.getUserBalances(true);
  }

  detached(): void {
    this.subscriptions.dispose();
  }

  /**
   * have to call this with and without an account
   */
  async loadContracts(): Promise<void> {
    this.primeToken = await this.contractsService.getContractFor(ContractNames.PRIMETOKEN);
    this.lockingToken4Reputation = await this.contractsService.getContractFor(ContractNames.LockingToken4Reputation);
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      try {
      // timeout to allow styles to load on startup to modalscreen sizes correctly
        setTimeout(() => this.eventAggregator.publish("dashboard.loading", true), 100);
        this.primeTokenAddress = this.contractsService.getContractAddress(ContractNames.PRIMETOKEN);
        this.totalReputation = await this.avatarService.reputation.totalSupply();
        this.lockingEndTime = await this.lockService.getLockingEndTime();
        this.lockingStartTime = await this.lockService.getLockingStartTime();

      } catch (ex) {
        this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
      }
      finally {
        this.eventAggregator.publish("dashboard.loading", false);
        this.initialized = true;
      }
    }
  }

  async getUserBalances(initializing = false): Promise<void> {

    if (this.initialized && this.ethereumService.defaultAccountAddress) {
      try {
        if (!initializing) {
        // timeout to allow styles to load on startup to modalscreen sizes correctly
          setTimeout(() => this.eventAggregator.publish("dashboard.loading", true), 100);
        }
        this.userPrimeBalance = await this.primeToken.balanceOf(this.ethereumService.defaultAccountAddress);
        const userRedeemedAmount = await this.lockService.getRedeemedAmount(this.ethereumService.defaultAccountAddress);
        this.userHasLocked = await this.lockService.userHasLocked(this.ethereumService.defaultAccountAddress);
        this.totalUserReputationEarned = await this.lockService.getUserEarnedReputation(this.ethereumService.defaultAccountAddress, userRedeemedAmount);
        const totalReputationAvailable = await this.lockService.getReputationReward();
        this.percentUserReputationEarned = toBigNumberJs(this.totalUserReputationEarned)
          .div(toBigNumberJs(totalReputationAvailable).plus(toBigNumberJs(this.totalReputation)))
          .times(100)
          .toNumber();

        this.connected= true;
      } catch (ex) {
        this.connected = false;
        this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
      }
      finally {
        if (!initializing) {
          this.eventAggregator.publish("dashboard.loading", false);
        }
      }
    } else {
      this.userHasLocked = false;
      this.totalUserReputationEarned =
      this.percentUserReputationEarned =
      this.userPrimeBalance = undefined;
      this.connected = false;
    }
  }

  ensureConnected(): boolean {
    return this.ethereumService.ensureConnected();
  }


  refreshCounters(blockDate: Date): void {
    this.getLockingPeriodIsEnded(blockDate);
    this.getLockingPeriodHasNotStarted(blockDate);
    this.getMsUntilCanLockCountdown(blockDate);
    this.getMsRemainingInPeriodCountdown(blockDate);
  }

  getLockingPeriodHasNotStarted(blockDate: Date): boolean {
    return this.lockingPeriodHasNotStarted = (blockDate < this.lockingStartTime);
  }

  getLockingPeriodIsEnded(blockDate: Date): boolean {
    return this.lockingPeriodIsEnded = (blockDate > this.lockingEndTime);
  }

  getMsUntilCanLockCountdown(_blockDate: Date): number {
    return this.msUntilCanLockCountdown = Math.max(this.lockingStartTime.getTime() - Date.now(), 0);
  }

  getMsRemainingInPeriodCountdown(_blockDate: Date): number {
    return this.msRemainingInPeriodCountdown = Math.max(this.lockingEndTime.getTime() - Date.now(), 0);
  }
}
