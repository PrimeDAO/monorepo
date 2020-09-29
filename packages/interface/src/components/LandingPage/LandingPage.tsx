import { BigNumber } from "ethers";
import React, { RefObject } from "react";
import EthereumService from "services/ethereumService";
import "./LandingPage.scss";

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
  balance: BigNumber;
  blockNumber: number;
}

class LandingPage extends React.Component<unknown, IState> {

  constructor(props: unknown) {
    super(props);
    this.state = {
      balance: null,
      blockNumber: 0,
    };
  }
  async componentDidMount(): Promise<void> {
    const provider = EthereumService.readOnlyProvider;
    EthereumService.onConnect((info) => { alert(`Connected to: ${info.chainName}`); });
    this.setState( {
      balance: await provider.getBalance("0xc564cfaea4d720dc58fa4b4dc934a32d76664404"),
      blockNumber: await provider.getBlockNumber(),
    });
  }

  private onConnect() {
    EthereumService.connect();
  }

  render(): React.ReactElement {

    const wrapper = React.createRef<HTMLDivElement>();
    if (this.state.balance) {
      console.log(`Balance: ${this.state.balance.toString()}`);
      console.log(`BlockNumber: ${this.state.blockNumber}`);
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
