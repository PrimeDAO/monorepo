import { autoinject, singleton } from "aurelia-framework";
import { ContractNames } from "services/ContractsService";
import { ContractsService } from "services/ContractsService";
import "./dashboard.scss";
import { EventAggregator } from "aurelia-event-aggregator";
import TransactionsService from "services/TransactionsService";
import { Address, EthereumService } from "services/EthereumService";
import { BigNumber } from "ethers";
import { EventConfigException, EventConfigFailure } from "services/GeneralEvents";
import { PriceService } from "services/PriceService";
import { Router } from "aurelia-router";

// const goto = (where: string) => {
//   window.open(where, "_blank", "noopener noreferrer");
// };

// const showMobileMenu = (container: RefObject<HTMLDivElement>, show: boolean) => {
//   if (show) {
//     container.current.classList.add("showMobileMenu");
//   } else {
//     container.current.classList.remove("showMobileMenu");
//   }
// };

// const MobileMenu = (props: { container: RefObject<HTMLDivElement> }): React.ReactElement => {
//   return (
//     <div className="mobileMenu">
//       <div className="header">
//         <div className="logo"><img src="PrimeDAOLogo.svg" /></div>
//         <div className="mobilemenuButton"><img onClick={() => showMobileMenu(props.container, false)} src="hamburger_menu.svg" /></div>
//       </div>

//       <div className="item" onClick={() => goto("https://medium.com/primedao")}><div className="name">Blog</div><div className="triangle"></div></div>
//       <div className="item" onClick={() => goto("https://ipfs.io/ipfs/QmPCtPR4gthh4HunCRANhXnsA5j2VDzG1j13GKqoCX9uhR")}><div className="name">Litepaper</div><div className="triangle"></div></div>
//       <div className="item" onClick={() => goto("https://discord.gg/x8v59pG")}><div className="name">Discord</div><div className="triangle"></div></div>
//       <div className="item" onClick={() => goto(" https://twitter.com/PrimeDAO_?s=09")}><div className="name">Twitter</div><div className="triangle"></div></div>
//       <div className="item" onClick={() => goto("https://github.com/PrimeDAO")}><div className="name">Github</div><div className="triangle"></div></div>
//       <div className="item" onClick={() => goto("mailto:hello@primedao.io")}><div className="name">Contact</div><div className="triangle"></div></div>
//     </div>
//   );
// };

@singleton(false)
@autoinject
export class Dashboard {
  private weth: any;
  private crPool: any;
  private bPool: any;
  private stakingRewards: any;
  private primeToken: any;
  // private usdcToken: any;
  private connected = false;
  private liquidityBalance: BigNumber;
  private swapfee: BigNumber;
  private poolshare: BigNumber;
  private currentAPY: BigNumber;
  private primeFarmed: BigNumber;
  private userPrimeBalance: BigNumber;
  private userWethBalance: BigNumber;
  private userEthBalance: BigNumber;
  private userBPrimeBalance: BigNumber;
  private bPrimeStaked: BigNumber;
  private defaultWethEthAmount: BigNumber;
  private poolTokenWeights: Map<string, number>;

  constructor(
    private eventAggregator: EventAggregator,
    private contractsService: ContractsService,
    private ethereumService: EthereumService,
    private transactionsService: TransactionsService,
    private priceService: PriceService,
    private router: Router) {
  }

  protected async attached(): Promise<void> {

    this.eventAggregator.subscribe("Network.Changed.Account", async (account: Address) => {
      this.initialize(account);
    });
    return this.initialize();
  }

  private ethWethAmount: BigNumber;
  private wethEthAmount: BigNumber;
  private priceWeth: BigNumber;
  private pricePrimeToken: BigNumber;

  private async initialize(account?: Address) {
    try {
      this.crPool = await this.contractsService.getContractFor(ContractNames.ConfigurableRightsPool);
      this.bPool = await this.contractsService.getContractFor(ContractNames.BPOOL);
      this.stakingRewards = await this.contractsService.getContractFor(ContractNames.STAKINGREWARDS);
      this.weth = await this.contractsService.getContractFor(ContractNames.WETH);
      this.primeToken = await this.contractsService.getContractFor(ContractNames.PRIMETOKEN);
      this.swapfee = await this.bPool.getSwapFee();
      const weights = new Map();
      weights.set("PRIME",
        await this.bPool.getNormalizedWeight(this.contractsService.getContractAddress(ContractNames.PRIMETOKEN)));
      weights.set("WETH",
        await this.bPool.getNormalizedWeight(this.contractsService.getContractAddress(ContractNames.WETH)));

      this.poolTokenWeights = weights;

      this.getStakingAmounts();
      this.getLiquidityAmounts();
      this.getUserBalances();

      // TODO: fully revert the connection when no account
      this.connected = !!account;
    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
      // TODO: fully revert the connection when no account
      this.connected = false;
    }
  }

  private async getUserBalances(): Promise<void> {
    if (this.ethereumService.defaultAccountAddress) {
      const provider = this.ethereumService.readOnlyProvider;
      this.userEthBalance = await provider.getBalance(this.ethereumService.defaultAccountAddress);
      this.userWethBalance = await this.weth.balanceOf(this.ethereumService.defaultAccountAddress);

    } else {
      this.userEthBalance =
      this.userWethBalance = undefined;
    }
  }

  private async getStakingAmounts() {

    this.currentAPY = await this.stakingRewards.rewardPerTokenStored();

    if (this.ethereumService.defaultAccountAddress) {
      this.primeFarmed = await this.stakingRewards.earned(this.ethereumService.defaultAccountAddress);
      this.userBPrimeBalance = await this.crPool.balanceOf(this.ethereumService.defaultAccountAddress);
      /**
     * this is BPRIME
     */
      this.poolshare = (await this.crPool.balanceOf(this.ethereumService.defaultAccountAddress))
        .div(await this.crPool.totalSupply());

      this.bPrimeStaked = await this.stakingRewards.balanceOf(this.ethereumService.defaultAccountAddress);
    } else {
      this.bPrimeStaked =
      this.userBPrimeBalance =
      this.poolshare =
      this.primeFarmed = undefined;
    }
  }

  private async getLiquidityAmounts() {
    if (this.ethereumService.defaultAccountAddress) {
      this.userPrimeBalance = await this.primeToken.balanceOf(this.ethereumService.defaultAccountAddress);
    } else {
      this.userPrimeBalance = undefined;
    }
    try {
      this.priceWeth = BigNumber.from(await this.priceService.getTokenPrice(this.contractsService.getContractAddress(ContractNames.WETH), true));
      this.pricePrimeToken = BigNumber.from(await this.priceService.getTokenPrice(this.contractsService.getContractAddress(ContractNames.PRIMETOKEN)));

      const priceWethLiquidity = (await this.bPool.getBalance(this.contractsService.getContractAddress(ContractNames.WETH)))
        .mul(this.priceWeth);

      const pricePrimeTokenLiquidity = (await this.bPool.getBalance(this.contractsService.getContractAddress(ContractNames.PRIMETOKEN)))
        .mul(this.pricePrimeToken);

      this.liquidityBalance = priceWethLiquidity.add(pricePrimeTokenLiquidity);
    } catch (ex) {
      this.eventAggregator.publish("handleException",
        new EventConfigException("Unable to fetch a token price", ex));
      this.liquidityBalance = undefined;
    }
  }

  private ensureConnected(): boolean {
    if (!this.connected) {
      // TODO: make this await until we're either connected or not?
      this.ethereumService.connect();
      return false;
    }
    else {
      return true;
    }
  }

  private async handleDeposit() {
    if (this.ensureConnected()) {
      if (this.ethWethAmount.gt(this.userEthBalance)) {
        this.eventAggregator.publish("handleValidationError", new EventConfigFailure("You don't have enough ETH to wrap the amount you requested"));
      } else {
        await this.transactionsService.send(() => this.weth.deposit({ value: this.ethWethAmount }));
        // TODO:  should happen after mining
        this.getUserBalances();
      }
    }
  }

  private async handleWithdraw() {
    if (this.ensureConnected()) {
      if (this.wethEthAmount.gt(this.userWethBalance)) {
        this.eventAggregator.publish("handleValidationError", new EventConfigFailure("You don't have enough WETH to unwrap the amount you requested"));
      } else {
        await this.transactionsService.send(() => this.weth.withdraw(this.wethEthAmount));
        // TODO:  should happen after mining
        this.getUserBalances();
      }
    }
  }

  private stakeAmount: BigNumber;

  private async handleHarvestWithdraw() {
    if (this.ensureConnected()) {
      await this.transactionsService.send(() => this.stakingRewards.exit());
      // TODO:  should happen after mining
      this.getStakingAmounts();
    }
  }

  private gotoLiquidity(remove = false) {
    Object.assign(this,
      {
        remove,
        bPoolAddress: this.contractsService.getContractAddress(ContractNames.BPOOL),
      });

    const theRoute = this.router.routes.find(x => x.name === "liquidity");
    theRoute.settings.state = this;
    this.router.navigateToRoute("liquidity");
  }

  private gotoStaking(harvest = false) {
    Object.assign(this,
      {
        harvest,
      });

    const theRoute = this.router.routes.find(x => x.name === "staking");
    theRoute.settings.state = this;
    this.router.navigateToRoute("staking");
  }


  // private async addLiquidity(poolAmountOut, maxAmountsIn): Promise<void> {
  //   if (this.ensureConnected()) {
  //     await this.transactionsService.send(() => this.crPool.joinPool(uint poolAmountOut, uint[] calldata maxAmountsIn));
  //     // TODO:  should happen after mining
  //      this.getLiquidity();
  //   }
  // }

  // private async removeLiquidity(): Promise<void> {
  //   if (this.ensureConnected()) {
  //     await this.transactionsService.send(() => this.crPool.exitPool(uint poolAmountIn, uint[] calldata minAmountsOut));
  //      // TODO:  should happen after mining
  //      this.getLiquidity();
  //   }
  // }

  private async stakingStake(amount: BigNumber): Promise<void> {
    if (this.ensureConnected()) {
      if (amount.gt(this.userBPrimeBalance)) {
        this.eventAggregator.publish("handleValidationError", new EventConfigFailure("You don't have enough BPRIME to stake the amount you requested"));
      } else {
        await this.transactionsService.send(() => this.stakingRewards.stake(amount));
        // TODO:  should happen after mining
        this.getStakingAmounts();
      }
    }
  }

  private async stakingHarvest(): Promise<void> {
    if (this.ensureConnected()) {
      await this.transactionsService.send(() => this.stakingRewards.getReward());
      // TODO:  should happen after mining
      this.getStakingAmounts();
    }
  }


  private async stakingExit(): Promise<void> {
    if (this.ensureConnected()) {
      if (this.bPrimeStaked.isZero()) {
        this.eventAggregator.publish("handleValidationError", new EventConfigFailure("You have not staked any BPRIME, so there is nothing to exit"));
      } else {
        await this.transactionsService.send(() => this.stakingRewards.exit());
      }
    }
  }

  private handleGetMax() {
    this.defaultWethEthAmount = this.userWethBalance;
  }
}
