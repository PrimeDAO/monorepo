import React, { RefObject } from 'react';
import './LandingPage.scss';

const goto = (where: string) => {
  window.open(where, '_blank', 'noopener noreferrer');
};

const MainMenu = (props: {container: RefObject<HTMLDivElement>}): React.ReactElement => {

  const {container} = props;

  const showMenu = (which: string, show: boolean) => {
    if (show) {
      container.current.classList.add(`show${which}`);
    } else {
      container.current.classList.remove(`show${which}`);
    }
  };

  return (
    <>
      <div className="learn">
        <div className="name"
          onMouseEnter={() => showMenu('Learn', true)}
          onMouseLeave={() => showMenu('Learn', false)}
        >Learn<div className="menuDivider"></div></div>

      </div>
      <div className="connect">
        <div className="name"
          onMouseEnter={() => showMenu('Connect', true)}
          onMouseLeave={() => showMenu('Connect', false)}
        >Connect<div className="menuDivider"></div></div>
      </div>
      <div
        onMouseEnter={() => showMenu('Learn', true)}
        onMouseLeave={() => showMenu('Learn', false)}
      >
        <div className="learnMenu">
          <div onClick={() => goto('https://medium.com/primedao')}><div className="name">Blog</div><div className="triangle"></div></div>
          <div onClick={() => goto('https://ipfs.io/ipfs/QmPCtPR4gthh4HunCRANhXnsA5j2VDzG1j13GKqoCX9uhR')}><div className="name">Litepaper</div><div className="triangle"></div></div>
        </div>
      </div>
      <div
        onMouseEnter={() => showMenu('Connect', true)}
        onMouseLeave={() => showMenu('Connect', false)}
      >
        <div className="connectMenu">
          <div onClick={() => goto('https://discord.gg/x8v59pG')}><div className="name">Discord</div><div className="triangle"></div></div>
          <div onClick={() => goto(' https://twitter.com/PrimeDAO_?s=09')}><div className="name">Twitter</div><div className="triangle"></div></div>
          <div onClick={() => goto('https://github.com/PrimeDAO')}><div className="name">Github</div><div className="triangle"></div></div>
          <div onClick={() => goto('mailto:hello@primedao.io')}><div className="name">Contact</div><div className="triangle"></div></div>
        </div>
      </div>
    </>
  );
};

const showMobileMenu = (container: RefObject<HTMLDivElement>, show: boolean) => {
  if (show) {
    container.current.classList.add('showMobileMenu');
  } else {
    container.current.classList.remove('showMobileMenu');
  }
};

const MobileMenu = (props: { container: RefObject<HTMLDivElement> }): React.ReactElement => {
  return (
    <div className="mobileMenu">
      <div className="header">
        <div className="logo"><img src="PrimeDAOLogo.svg" /></div>
        <div className="mobilemenuButton"><img onClick={() => showMobileMenu(props.container, false)} src="hamburger_menu.svg" /></div>
      </div>

      <div className="item" onClick={() => goto('https://medium.com/primedao')}><div className="name">Blog</div><div className="triangle"></div></div>
      <div className="item" onClick={() => goto('https://ipfs.io/ipfs/QmPCtPR4gthh4HunCRANhXnsA5j2VDzG1j13GKqoCX9uhR')}><div className="name">Litepaper</div><div className="triangle"></div></div>
      <div className="item" onClick={() => goto('https://discord.gg/x8v59pG')}><div className="name">Discord</div><div className="triangle"></div></div>
      <div className="item" onClick={() => goto(' https://twitter.com/PrimeDAO_?s=09')}><div className="name">Twitter</div><div className="triangle"></div></div>
      <div className="item" onClick={() => goto('https://github.com/PrimeDAO')}><div className="name">Github</div><div className="triangle"></div></div>
      <div className="item" onClick={() => goto('mailto:hello@primedao.io')}><div className="name">Contact</div><div className="triangle"></div></div>
    </div>
  );
};

const LandingPage = (): React.ReactElement => {

  const rightMenu = React.createRef<HTMLDivElement>();
  const centerMenu = React.createRef<HTMLDivElement>();
  const wrapper = React.createRef<HTMLDivElement>();

  return (
    <div className="landingPageWrapper" ref={wrapper}>
      <MobileMenu container={wrapper}></MobileMenu>
      <div className="introduction">
        <div className="container">
          <div className="leftColumn">
            <div className="header">
              <div className="logo"><img src="PrimeDAOLogo.svg" /></div>
              <div className="centerMenu" ref={centerMenu}>
                <MainMenu container={rightMenu} />
              </div>
              <div className="mobilemenuButton"><img onClick={() => showMobileMenu(wrapper, true)} src="hamburger_menu.svg" /></div>
            </div>
            <div className="body">
              <div className="title">Introducing PrimeDAO:</div>
              <div className="subtitle">An Adoption Engine for Open Finance</div>
              <div className="body">A new system of open finance based on programmable money is being realized on Ethereum. PrimeDAO is here to catalyze and coordinate an open-source ecosystem of partners, builders, and users that simplifies, secures, and makes decentralized finance (DeFi) accessible for the masses.</div>
            </div>
            <div className="footer">
              <div className="moreIcon"></div>
            </div>
          </div>
          <div className="rightColumn" ref={rightMenu}>
            <MainMenu container ={rightMenu}/>
          </div>
        </div>
      </div>
      <div className="aboutUs">
        <div className="title">
          <div className="triangle"><img/></div>
          <div className="name">About Us</div>
          <div className="subtitle">Catalyzing DeFi Mass Adoption</div>
        </div>
        <div className="subsections">
          <div className="section">
            <div className="icon"><img src="PD_LP_ICON_01_02.jpg"/></div>
            <div className="title">Decentralized Prime Brokerage</div>
            <div className="body">The PrimeDAO’s focus will be to deliver open finance support structures that a centralized prime broker would otherwise provide, such as efficient order matching, guaranteed settlement, liquidity for spot trades, lending, derivatives, leverage, and so on. Everybody should have easy access to prime brokerage tools and services that lets them lend and make markets. PrimeDAO will leverage transparent, decentralized governance to catalyze and democratize a new wave of DeFi adopters.</div>
          </div>
          <div className="section">
            <div className="icon"><img src="PD_LP_ICON_02_02.jpg" /></div>
            <div className="title">Smart Aggregation</div>
            <div className="body">On-chain liquidity aggregation is critical infrastructure for DeFi. By pooling liquidity sources, decentralized exchange aggregators reduce slippage and make large orders and liquidations easy to execute. PrimeDAO’s launch product — already fully developed — is an open-source smart router that aggregates liquidity from multiple DEXes and lending pools. Soon after launch, the smart router will be fully integrated with the DAO, whose members will govern its revenues and parameters.</div>
          </div>
          <div className="section">
            <div className="icon"><img src="PD_LP_ICON_03_02.jpg" /></div>
            <div className="title">DeFi Ecosystem Coordinator</div>
            <div className="body">DeFi must be governed decentrally if it is to preserve the commons’ fundamental ethos of permissionless access. PrimeDAO aims to be a sustainable engine of value creation that earns and allocates resources towards a wide contributor ecosystem for promoting, simulating, building, auditing and maintaining the mechanisms and products of the DeFi ecosystem, cultivating projects that promote safety, reliability, liquidity, and above all, open access.</div>
          </div>
        </div>
      </div>
      <div className="ecosystem">
        <div className="title">
          <div className="triangle"><img /></div>
          <div className="name">Prime Ecosystem</div>
          <div className="subtitle">PrimeDAO Visualized</div>
        </div>
        <div className="pic">
          <picture>
            <source media="(max-width:1160px)" srcSet="CURVE_PD_DEFI_ECOSYSTEM_V02-1-mobile.jpg" />
            <img src="CURVE_PD_DEFI_ECOSYSTEM_V02-1.jpg" />
          </picture>
        </div>
      </div>
      <div className="join">
        <div className="title">Stay Informed:</div>
        <div className="subtitle">In the next few months, the PrimeDAO ecosystem will launch. You will not receive spam and your email will never be shared.</div>
        <div className="button"><a href="https://primedao.substack.com/" target="_blank" rel="noopener noreferrer">Join</a></div>
      </div>
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
};

export default LandingPage;
