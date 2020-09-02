import React from 'react';
// import { withRouter } from 'react-router-dom';
import './LandingPage.scss';

const LandingPage = (): React.ReactElement => {

  const menu = React.createRef<HTMLDivElement>();

  const showMenu = (which: string, show: boolean) => {
    if (show) {
      menu.current.classList.add(`show${which}`);
    } else {
      menu.current.classList.remove(`show${which}`);
    }
  };

  const goto = (where: string) => {
    window.open(where, '_blank', 'noopener noreferrer');
  };

  return (
    <div className="landingPageWrapper">
      <div className="introduction">
        <div className="leftColumn">
          <div className="header">
            <img className="logo" src="PrimeDAOLogo.svg"/>
          </div>
          <div className="body">
            <div className="title">Introducing PrimeDAO:</div>
            <div className="subtitle">An Adoption Engine for Open Finance</div>
            <div className="body">A new system of open finance based on programmable money is being realized on Ethereum. PrimeDAO is here to catalyze and coordinate an open-source ecosystem of partners, builders, and users that simplifies, secures, and makes decentralized finance accessible (DeFi) for the masses.</div>
          </div>
          <div className="footer">
            <div className="moreIcon"></div>
          </div>
        </div>
        <div className="rightColumn" ref={menu}>
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
              <div><div className="name">Litepaper</div><div className="triangle"></div></div>
            </div>
          </div>
          <div
            onMouseEnter={() => showMenu('Connect', true)}
            onMouseLeave={() => showMenu('Connect', false)}
          >
            <div className="connectMenu">
              <div onClick={() => goto('https://discord.gg/b8VjMfC')}><div className="name">Discord</div><div className="triangle"></div></div>
              <div onClick={() => goto('https://twitter.com/PrimeDAO')}><div className="name">Twitter</div><div className="triangle"></div></div>
              <div onClick={() => goto('https://github.com/PrimeDAO-Foundation')}><div className="name">Github</div><div className="triangle"></div></div>
              <div onClick={() => goto('https://twitter.com/PrimeDAO')}><div className="name">Contact</div><div className="triangle"></div></div>
            </div>
          </div>
        </div>
      </div>
      <div className="aboutUs">
        <div className="title">
          <div className="triangle"></div>
          <div className="name">About Us</div>
          <div className="subtitle">Catalyzing DeFi Mass Adoption</div>
        </div>
        <div className="subsections">
          <div className="section">
            <div className="icon"><img src="PD_LP_ICON_01_02.jpg"/></div>
            <div className="title">The Decentralized Prime Brokerage</div>
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
            <div className="body">To preserve the DeFi commons’ fundamental ethos of permissionless access, it cannot be governed by a centralized entity. PrimeDAO aims to be a sustainable engine of value creation that earns and allocates resources towards a wide contributor ecosystem for promoting, simulating, building, auditing and maintaining the mechanisms and products of the DeFi ecosystem, cultivating projects that promote safety, reliability, liquidity, and above all, open access.</div>
          </div>
        </div>
      </div>
      <div className="ecosystem">
        <div className="title">
          <div className="triangle"></div>
          <div className="name">Prime Ecosystem</div>
          <div className="subtitle">PrimeDAO Visualized</div>
        </div>
        <div className="pic"><img src="CURVE_PD_DEFI_ECOSYSTEM_V02-1.jpg"/></div>
      </div>
      <div className="join">
        <div className="title">Stay Informed:</div>
        <div className="subtitle">In the next few months, the PrimeDAO ecosystem will launch. You will not receive spam and your email will never be shared.</div>
        <div className="button"><a href="https://primedao.substack.com/" target="_blank" rel="noopener noreferrer">Join</a></div>
      </div>
      <div className="footer">
        <img src="FOOTER_SOCIAL_DISCORD.svg"/>
      </div>
    </div>
  );
};

export default LandingPage;
