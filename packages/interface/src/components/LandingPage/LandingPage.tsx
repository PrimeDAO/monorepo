import { BigNumber } from "ethers";
import React, { RefObject } from "react";
import { IContract } from "services/contractsService";
import EthereumService from "services/ethereumService";
import { ContractsService } from "services/contractsService";
import "./LandingPage.scss";
import { formatEther, parseEther } from "ethers/lib/utils";
import TransactionsService, { TransactionReceipt, TransactionResponse } from "services/transactionsService";

const goto = (where: string) => {
  window.open(where, "_blank", "noopener noreferrer");
};

const showMobileMenu = (container: RefObject<HTMLDivElement>, show: boolean) => {
  if (show) {
    container.current.classList.add("showMobileMenu");
  } else {
    container.current.classList.remove("showMobileMenu");
  }
};

const MobileMenu = (props: { container: RefObject<HTMLDivElement> }): React.ReactElement => {
  return (
    <div className="mobileMenu">
      <div className="header">
        <div className="logo"><img src="PrimeDAOLogo.svg" /></div>
        <div className="mobilemenuButton"><img onClick={() => showMobileMenu(props.container, false)} src="hamburger_menu.svg" /></div>
      </div>

      <div className="item" onClick={() => goto("https://medium.com/primedao")}><div className="name">Blog</div><div className="triangle"></div></div>
      <div className="item" onClick={() => goto("https://ipfs.io/ipfs/QmPCtPR4gthh4HunCRANhXnsA5j2VDzG1j13GKqoCX9uhR")}><div className="name">Litepaper</div><div className="triangle"></div></div>
      <div className="item" onClick={() => goto("https://discord.gg/x8v59pG")}><div className="name">Discord</div><div className="triangle"></div></div>
      <div className="item" onClick={() => goto(" https://twitter.com/PrimeDAO_?s=09")}><div className="name">Twitter</div><div className="triangle"></div></div>
      <div className="item" onClick={() => goto("https://github.com/PrimeDAO")}><div className="name">Github</div><div className="triangle"></div></div>
      <div className="item" onClick={() => goto("mailto:hello@primedao.io")}><div className="name">Contact</div><div className="triangle"></div></div>
    </div>
  );
};

interface IState {
  balance: string;
  blockNumber: number;
  bPoolAddress: string;
  withdrawGasUsed: BigNumber,
}

class LandingPage extends React.Component<unknown, IState> {

  constructor(props: unknown) {
    super(props);
    this.state = {
      balance: null,
      blockNumber: 0,
      bPoolAddress: "",
      withdrawGasUsed: null,
    };
  }
  async componentDidMount(): Promise<void> {
    const provider = EthereumService.readOnlyProvider;
    EthereumService.onConnect(async (_info) => {
      // alert(`Connected to: ${info.chainName}`);
      const crPool = ContractsService.getContractFor(IContract.ConfigurableRightsPool);
      const bPoolAddress = await crPool.bPool();
      this.setState({
        bPoolAddress,
      });

      // const weth = ContractsService.getContractFor(IContract.WETH);
      // const response = await TransactionsService.send(() =>
      //   weth.deposit(parseEther(".05"))
      // );
      // const receipt = await response.wait(6);
      // if (receipt.status) {
      //   const response2 = await TransactionsService.send(() =>
      //     weth.withdraw(parseEther(".05"))
      //   );
      //   const receipt2 = await response2.wait(6);
      //   if (receipt2.status) {
      //     this.setState({
      //       withdrawGasUsed: receipt2.gasUsed,
      //     });
      //   }
      // }
    });
    EthereumService.onAccountsChanged(async (account) => {
      this.setState({
        balance: formatEther(await provider.getBalance(account)),
      });
    });
    this.setState( {
      blockNumber: await provider.getBlockNumber(),
    });
  }

  private onConnect() {
    EthereumService.connect();
  }

  render(): React.ReactElement {

    const wrapper = React.createRef<HTMLDivElement>();
    if (this.state.balance) {
      console.info(`Balance: ${this.state.balance}`);
      console.info(`BlockNumber: ${this.state.blockNumber}`);
      console.info(`bPoolAddress: ${this.state.bPoolAddress}`);
      console.info(`withdrawGasUsed: ${this.state.withdrawGasUsed?.toString()}`);
    }

    return (
      <div className="landingPageWrapper" ref={wrapper}>

        <button onClick={this.onConnect}>Connect</button>
        <MobileMenu container={wrapper}></MobileMenu>

        <div className="moreInfo">
          <div className="header">
            <div className="title">PrimeDAO</div>
            <div className="subtitle">&copy; 2020 Prime Development Foundation</div>
          </div>
          <div className="logo">
            <img src="PrimeDAOLogo-grey.svg" />
          </div>
          <div className="share">
            <a className="discord" href="https://discord.gg/x8v59pG" target="_blank" rel="noopener noreferrer"></a>
            <a className="twitter" href=" https://twitter.com/PrimeDAO_?s=09" target="_blank" rel="noopener noreferrer"></a>
            <a className="medium" href="https://medium.com/primedao" target="_blank" rel="noopener noreferrer"></a>
          </div>
        </div>
      </div>
    );
  }
}

export default LandingPage;
