import { autoinject } from "aurelia-framework";
import { IContract } from "services/ContractsService";
import { ContractsService } from "services/ContractsService";
import "./dashboard.scss";
import { EventAggregator } from "aurelia-event-aggregator";
import TransactionsService from "services/TransactionsService";
import { parseEther } from "ethers/lib/utils";
import { Address } from "services/EthereumService";

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
  private connected = false;

  constructor(
    private eventAggregator: EventAggregator,
    private contractsService: ContractsService,
    private transactionsService: TransactionsService) {
  }

  protected async attached(): Promise<void> {

    this.eventAggregator.subscribe("Network.Changed.Account", async (account: Address) => {
      if (account) {
        // const crPool = await this.contractsService.getContractFor(IContract.ConfigurableRightsPool);
        // this.bPoolAddress = await crPool.bPool();
        this.weth = await this.contractsService.getContractFor(IContract.WETH);
        this.connected = true;
      } else {
        this.connected = false;
      }
    });
  }

  private handleDeposit() {
    this.transactionsService.send(() =>
      this.weth.deposit({ value: parseEther(".05") }),
      //   const receipt = await response.wait(1);
    );
  }

  private handleWithdraw() {
    this.transactionsService.send(() =>
      this.weth.withdraw(parseEther(".05")),
    );
    //   if (receipt.status) {
    //     const receipt2 = await response2.wait(1);
    //     if (receipt2.status) {
    //       this.withdrawTransactionHash = receipt2.transactionHash;
    //     }
    //   }
  }
}
