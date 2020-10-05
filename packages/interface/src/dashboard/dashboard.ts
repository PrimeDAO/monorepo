import { autoinject } from "aurelia-framework";
import { IContract } from "services/ContractsService";
import {EthereumService} from "services/EthereumService";
import {ContractsService} from "services/ContractsService";
import "./dashboard.scss";
import { parseEther } from "ethers/lib/utils";
import TransactionsService from "services/TransactionsService";
import { EventAggregator } from "aurelia-event-aggregator";

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

  private balance: string = null;
  private blockNumber = 0;
  private bPoolAddress = "";
  private withdrawTransactionHash: string = null;

  constructor(
    private eventAggregator: EventAggregator,
    private ethereumService: EthereumService,
    private contractsService: ContractsService) {
  }

  protected async attached(): Promise<void> {

    this.eventAggregator.subscribe("Network.Changed.Connected", async () => {
      const crPool = await this.contractsService.getContractFor(IContract.ConfigurableRightsPool);
      this.bPoolAddress = await crPool.bPool();

      const weth = await this.contractsService.getContractFor(IContract.WETH);
      const response = await TransactionsService.send(() =>
        weth.deposit({ value: parseEther(".05") }),
      );
      const receipt = await response.wait(1);
      if (receipt.status) {
        const response2 = await TransactionsService.send(() =>
          weth.withdraw(parseEther(".05")),
        );
        const receipt2 = await response2.wait(1);
        if (receipt2.status) {
          this.withdrawTransactionHash = receipt2.transactionHash;
        }
      }
    });
  }

  private onConnect() {
    this.ethereumService.connect();
  }
}
