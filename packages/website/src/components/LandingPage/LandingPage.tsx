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
              <div><div className="name"><a href="https://medium.com/primedao" target="_blank" rel="noopener noreferrer">Blog</a></div><div className="triangle"></div></div>
              <div><div className="name"><a href="" target="_blank" rel="noopener noreferrer">Litepaper</a></div><div className="triangle"></div></div>
            </div>
          </div>
          <div
            onMouseEnter={() => showMenu('Connect', true)}
            onMouseLeave={() => showMenu('Connect', false)}
          >
            <div className="connectMenu">
              <div><div className="name"><a href="https://discord.gg/b8VjMfC" target="_blank" rel="noopener noreferrer">Discord</a></div><div className="triangle"></div></div>
              <div><div className="name"><a href="https://twitter.com/PrimeDAO" target="_blank" rel="noopener noreferrer">Twitter</a></div><div className="triangle"></div></div>
              <div><div className="name"><a href="" target="_blank" rel="noopener noreferrer">Github</a></div><div className="triangle"></div></div>
              <div><div className="name"><a href="https://primedao.substack.com" target="_blank" rel="noopener noreferrer">Contact</a></div><div className="triangle"></div></div>
            </div>
          </div>
        </div>
      </div>
      <div className="aboutUs">
        <div className="title">About Us</div>
        <div className="subtitle">Catalyzing DeFi Mass Adoption</div>
        <div className="subsections">
          <div className="classname">
            <div className="icon"></div>
            <div className="title">The Decentralized Prime Brokerage</div>
            <div className="body">The PrimeDAO’s focus will be to deliver open finance support structures that a centralized prime broker would otherwise provide, such as efficient order matching, guaranteed settlement, liquidity for spot trades, lending, derivatives, leverage, and so on. Everybody should have easy access to prime brokerage tools and services that lets them lend and make markets. PrimeDAO will leverage transparent, decentralized governance to catalyze and democratize a new wave of DeFi adopters.</div>
          </div>
        </div>
      </div>
      <div className="footer">
        <img src="FOOTER_SOCIAL_DISCORD.svg"/>
      </div>
    </div>
  );
};

export default LandingPage;
