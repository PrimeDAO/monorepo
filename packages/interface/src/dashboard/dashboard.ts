import { autoinject } from "aurelia-framework";
import { ContractNames } from "services/ContractsService";
import { ContractsService } from "services/ContractsService";
import "./dashboard.scss";
import { EventAggregator } from "aurelia-event-aggregator";
import TransactionsService from "services/TransactionsService";
import { Address, EthereumService } from "services/EthereumService";
import { BigNumber } from "ethers";
import { EventConfigException } from "services/GeneralEvents";

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
  private volume: BigNumber;
  private swapfee: string;
  private poolshare: BigNumber;
  private currentAPY: BigNumber;
  private primeFarmed: BigNumber;

  constructor(
    private eventAggregator: EventAggregator,
    private contractsService: ContractsService,
    private ethereumService: EthereumService,
    private transactionsService: TransactionsService) {
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

    this.initialize();
  }

  private maxWeth = false;
  private ethWethAmount: BigNumber | string;
  private wethEthAmount: BigNumber | string;
  private defaultWethEthAmount: BigNumber | string;

  private async initialize(account?: Address) {
    try {
      this.crPool = await this.contractsService.getContractFor(ContractNames.ConfigurableRightsPool);
      this.bPool = await this.contractsService.getContractFor(ContractNames.BPOOL);
      this.stakingRewards = await this.contractsService.getContractFor(ContractNames.STAKINGREWARDS);
      // this.bPoolAddress = await crPool.bPool();
      this.weth = await this.contractsService.getContractFor(ContractNames.WETH);
      this.primeToken = await this.contractsService.getContractFor(ContractNames.PRIMETOKEN);

      this.liquidityBalance = (await this.bPool.getBalance(this.contractsService.getContractAddress(ContractNames.WETH)))
        .add(await this.bPool.getBalance(this.contractsService.getContractAddress(ContractNames.PRIMETOKEN)));

      // this.volume = (await this.bPool.getBalance(this.contractsService.getContractAddress(ContractNames.WETH)))
      //   .add(await this.bPool.getBalance(this.primeToken));

      this.swapfee = await this.bPool.getSwapFee();

      if (account) {

        this.poolshare = (await this.crPool.balanceOf(this.ethereumService.defaultAccountAddress))
          .div(await this.crPool.totalSupply());

        await this.getStakingAmounts();

        await this.getDefaultWethEthAmount();

        this.connected = true;
      // TODO: fully revert the connection
      }
    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
    }
  }

  private async getDefaultWethEthAmount(): Promise<void> {
    this.defaultWethEthAmount = await this.weth.balanceOf(this.ethereumService.defaultAccountAddress);
  }

  private async getStakingAmounts() {
    this.currentAPY = await this.stakingRewards.rewardPerTokenStored();
    this.primeFarmed = await this.stakingRewards.earned(this.ethereumService.defaultAccountAddress);
  }

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
}
