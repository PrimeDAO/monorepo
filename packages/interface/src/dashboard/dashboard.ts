import { autoinject } from "aurelia-framework";
import { ContractNames } from "services/ContractsService";
import { ContractsService } from "services/ContractsService";
import "./dashboard.scss";
import { EventAggregator } from "aurelia-event-aggregator";
import TransactionsService from "services/TransactionsService";
import { Address, EthereumService } from "services/EthereumService";
import { BigNumber } from "ethers";
import { EventConfigException } from "services/GeneralEvents";
import { DialogService } from "services/DialogService";
import { Liquidity } from "resources/dialogs/liquidity/liquidity";
import { PriceService } from "services/PriceService";

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

@autoinject
export class Dashboard {
  private weth: any;
  private crPool: any;
  private bPool: any;
  private stakingRewards: any;
  private primeToken: any;
  // private usdcToken: any;
  private connected = false;
  private onOff=false;
  private liquidityBalance: BigNumber;
  private swapfee: string;
  private poolshare: BigNumber;
  private currentAPY: BigNumber;
  private primeFarmed: BigNumber;

  constructor(
    private eventAggregator: EventAggregator,
    private contractsService: ContractsService,
    private ethereumService: EthereumService,
    private transactionsService: TransactionsService,
    private dialogService: DialogService,
    private priceService: PriceService) {
  }

  protected async attached(): Promise<void> {

    this.eventAggregator.subscribe("Network.Changed.Account", async (account: Address) => {
      await this.initialize(account);
      this.connected = !!account;
    });

    this.eventAggregator.subscribe("transaction.sent", async () => {
      this.onOff = true;
    });

    this.eventAggregator.subscribe("transaction.confirmed", async () => {
      this.onOff = false;
    });

    this.eventAggregator.subscribe("transaction.failed", async () => {
      this.onOff = false;
    });

    return this.initialize();
  }

  private maxWeth = false;
  private ethWethAmount: BigNumber | string;
  private wethEthAmount: BigNumber | string;
  private defaultWethEthAmount: BigNumber | string;
  private priceWeth: BigNumber;
  private pricePrimeToken: BigNumber;

  private async initialize(account?: Address) {
    try {
      this.crPool = await this.contractsService.getContractFor(ContractNames.ConfigurableRightsPool);
      this.bPool = await this.contractsService.getContractFor(ContractNames.BPOOL);
      this.stakingRewards = await this.contractsService.getContractFor(ContractNames.STAKINGREWARDS);
      // this.bPoolAddress = await crPool.bPool();
      this.weth = await this.contractsService.getContractFor(ContractNames.WETH);
      this.primeToken = await this.contractsService.getContractFor(ContractNames.PRIMETOKEN);

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

      this.swapfee = await this.bPool.getSwapFee();

      await this.getStakingAmounts();

      await this.getDefaultWethEthAmount();

      if (account) {

        this.poolshare = (await this.crPool.balanceOf(this.ethereumService.defaultAccountAddress))
          .div(await this.crPool.totalSupply());

        this.connected = true;
      // TODO: fully revert the connection
      }
    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
    }
  }

  private async getDefaultWethEthAmount(): Promise<void> {
    // TODO: get this amount when the user clicks the button?
    this.defaultWethEthAmount = this.connected ? (await this.weth.balanceOf(this.ethereumService.defaultAccountAddress)) : undefined;
  }

  private async getStakingAmounts() {
    this.currentAPY = await this.stakingRewards.rewardPerTokenStored();
    // TODO: check for presence of account, the case when the user disconnects/unlocks while connected
    this.primeFarmed = this.connected ?
      (await this.stakingRewards.earned(this.ethereumService.defaultAccountAddress)) : undefined;
  }

  /**
   * TODO: call getDefaultWethEthAmount and getStakingAmounts after tx has been mined
   */
  private async handleDeposit() {
    await this.transactionsService.send(() => this.weth.deposit({ value: this.ethWethAmount }));
    this.getDefaultWethEthAmount();
  }

  private async handleWithdraw() {
    await this.transactionsService.send(() => this.weth.withdraw(this.wethEthAmount));
    this.getDefaultWethEthAmount();
  }

  private stakeAmount: BigNumber | string;

  private async handleStakeBPrime() {
    await this.transactionsService.send(() => this.stakingRewards.stake(this.stakeAmount));
    this.getStakingAmounts();
  }

  private async handleHarvestYield() {
    await this.transactionsService.send(() => this.stakingRewards.getReward());
    this.getStakingAmounts();
  }

  private async handleHarvestWithdraw() {
    await this.transactionsService.send(() => this.stakingRewards.exit());
    this.getStakingAmounts();
  }

  private handleAddLiquidity() {
    return this.dialogService.open(Liquidity, { }, { keyboard: true });
    // DialogOpenPromise<DialogCancellableOpenResult>
  }
}
