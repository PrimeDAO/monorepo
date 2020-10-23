import { autoinject, computedFrom } from "aurelia-framework";
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
  private primeToken: any;
  private usdcToken: any;
  private connected = false;
  private onOff=false;
  private liquidityBalance: BigNumber;

  constructor(
    private eventAggregator: EventAggregator,
    private contractsService: ContractsService,
    private ethereumService: EthereumService,
    private transactionsService: TransactionsService) {
  }

  protected async attached(): Promise<void> {

    this.eventAggregator.subscribe("Network.Changed.Account", async (account: Address) => {
      if (account) {
        try {
          this.crPool = await this.contractsService.getContractFor(ContractNames.ConfigurableRightsPool);
          this.bPool = await this.contractsService.getContractFor(ContractNames.BPOOL);
          // this.bPoolAddress = await crPool.bPool();
          this.weth = await this.contractsService.getContractFor(ContractNames.WETH);
          this.primeToken = await this.contractsService.getContractFor(ContractNames.PRIMETOKEN);
          this.usdcToken = await this.contractsService.getContractFor(ContractNames.USDC);
          this.liquidityBalance = (await this.bPool.getBalance(this.weth.address))
            .add(await this.bPool.getBalance(this.usdcToken));
          this.connected = true;
        } catch (ex) {
          this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
        }

      } else {
        this.connected = false;
      }
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
  }

  private maxWeth = false;
  private ethWethAmount: BigNumber | string = BigNumber.from(0);
  private wethEthAmount: BigNumber | string = BigNumber.from(0);

  private async setMaxWeth() {
    if (this.maxWeth) {
      this.wethEthAmount = await this.weth.balanceOf(this.ethereumService.defaultAccountAddress);
    } else {
      this.wethEthAmount = "0.0";
    }
  }

  private handleDeposit() {
    this.transactionsService.send(() => this.weth.deposit({ value: this.ethWethAmount }));
  }

  private async handleWithdraw() {
    this.transactionsService.send(() => this.weth.withdraw(this.wethEthAmount));
  }
}
