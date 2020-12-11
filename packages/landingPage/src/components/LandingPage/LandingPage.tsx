import React, { RefObject } from 'react';
import './LandingPage.scss';

const goto = (where: string) => {
  window.open(where, '_blank', 'noopener noreferrer');
};

const MainMenu = (props: { container: RefObject<HTMLDivElement> }): React.ReactElement => {

  const { container } = props;

  const showMenu = (which: string, show: boolean) => {
    if (show) {
      container.current.classList.add(`show${which}`);
    } else {
      container.current.classList.remove(`show${which}`);
    }
  };

  return (
    <>
      <div className="primeToken">
        <div className="name"
          onMouseEnter={() => showMenu('PrimeToken', true)}
          onMouseLeave={() => showMenu('PrimeToken', false)}
        >Products<div className="menuDivider"></div></div>
      </div>

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

      <div className="primeTokenMenu"
        onMouseEnter={() => showMenu('PrimeToken', true)}
        onMouseLeave={() => showMenu('PrimeToken', false)}
      >
        <div onClick={() => goto('https://primepool.eth.link/')}><div className="name">Pool Manager</div><div className="triangle"></div></div>
        <div onClick={() => goto(' http://router.primedao.io/')}><div className="name">Prime Swap</div><div className="triangle"></div></div>
      </div>

      <div className="learnMenu"
        onMouseEnter={() => showMenu('Learn', true)}
        onMouseLeave={() => showMenu('Learn', false)}
      >
        <div onClick={() => goto('https://docs.primedao.io/primedao/tokenomics')}><div className="name">Tokenomics</div><div className="triangle"></div></div>
        <div onClick={() => goto('https://medium.com/primedao')}><div className="name">Blog</div><div className="triangle"></div></div>
        <div onClick={() => goto('https://docs.primedao.io/')}><div className="name">Documentation</div><div className="triangle"></div></div>
        <div onClick={() => { document.getElementById('wall').scrollIntoView(); }}><div className="name">Members</div><div className="triangle"></div></div>
        <div onClick={() => goto('https://docs.primedao.io/primedao/faqs')}><div className="name">FAQ</div><div className="triangle"></div></div>
      </div>
      <div className="connectMenu"
        onMouseEnter={() => showMenu('Connect', true)}
        onMouseLeave={() => showMenu('Connect', false)}
      >
        <div onClick={() => goto('https://discord.gg/x8v59pG')}><div className="name">Discord</div><div className="triangle"></div></div>
        <div onClick={() => goto(' https://twitter.com/PrimeDAO_?s=09')}><div className="name">Twitter</div><div className="triangle"></div></div>
        <div onClick={() => goto('https://github.com/PrimeDAO')}><div className="name">Github</div><div className="triangle"></div></div>
        <div onClick={() => goto('https://daotalk.org/c/daos/primedao/38')}><div className="name">Forum</div><div className="triangle"></div></div>
        <div onClick={() => goto('https://t.me/primedao')}><div className="name">Telegram</div><div className="triangle"></div></div>
        <div onClick={() => goto('https://primedao.substack.com/')}><div className="name">Newsletter</div><div className="triangle"></div></div>
        <div onClick={() => { window.open('mailto:hello@primedao.io', '#', 'noopener noreferrer'); }}><div className="name">Contact</div><div className="triangle"></div></div>
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

      <div className="item" onClick={() => goto('http://router.primedao.io/')}><div className="name">Prime Swap</div><div className="triangle"></div></div>
      <div className="item" onClick={() => goto('https://docs.primedao.io/')}><div className="name">Documentation</div><div className="triangle"></div></div>
      <div className="item" onClick={() => goto('https://discord.gg/x8v59pG')}><div className="name">Discord</div><div className="triangle"></div></div>
      <div className="item" onClick={() => goto('https://twitter.com/PrimeDAO_?s=09')}><div className="name">Twitter</div><div className="triangle"></div></div>
      <div className="item" onClick={() => goto('https://t.me/primedao')}><div className="name">Telegram</div><div className="triangle"></div></div>
      <div className="item" onClick={() => { window.open('mailto:hello@primedao.io', '#', 'noopener noreferrer'); }}><div className="name">Contact</div><div className="triangle"></div></div>
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
              <div className="body">A new system of open finance based on programmable money is being realized on Ethereum. PrimeDAO is here to catalyze and coordinate an open-source ecosystem of partners, builders, and users that simplifies, secures, and makes decentralized finance (<a href="https://defipulse.com/blog/what-is-defi/" target="_blank" rel="noopener noreferrer">DeFi</a>) accessible for the masses.</div>
            </div>
            <div className="buttons">
              <a className="button tokenoffering" href="http://router.primedao.io" target="_blank" rel="noopener noreferrer">Get PRIME Now!</a>
              <a className="button litepaper" href="https://docs.primedao.io/" target="_blank" rel="noopener noreferrer">Documentation</a>
            </div>
            <div className="footer">
              <div className="moreIcon"></div>
            </div>
          </div>
          <div className="rightColumn" ref={rightMenu}>
            <MainMenu container={rightMenu} />
          </div>
        </div>
      </div>

      <div className="aboutUs">
        <div className="title">
          <div className="triangle"><img /></div>
          <div className="name">About Us</div>
          <div className="subtitle">Catalyzing DeFi Mass Adoption</div>
        </div>
        <div className="subsections">
          <div className="section">
            <div className="icon"><img src="PD_LP_ICON_01_02.jpg" /></div>
            <div className="title">Decentralized Prime Brokerage</div>
            <div className="body">PrimeDAO will deliver open finance support structures that a centralized prime broker would otherwise provide, such as efficient order matching, guaranteed settlement, liquidity for spot trades, lending, derivatives, and leverage. We are making decentralized finance more approachable by democratizing access to legacy financial tools and simplifying how people interact with the future of finance.</div>
          </div>
          <div className="section">
            <div className="icon"><img src="PD_LP_ICON_02_02.jpg" /></div>
            <div className="title">Smart Aggregation</div>
            <div className="body">On-chain liquidity aggregation is critical infrastructure for DeFi. By pooling liquidity sources, decentralized exchange aggregators reduce slippage and make large orders and liquidations easy to execute.</div>
          </div>
          <div className="section">
            <div className="icon"><img src="PD_LP_ICON_03_02.jpg" /></div>
            <div className="title">DeFi Ecosystem Coordinator</div>
            <div className="body">To preserve the DeFi commons’ fundamental ethos of permissionless access, it cannot be governed by a centralized entity. PrimeDAO will sustainably earn and allocate resources towards a wide contributor ecosystem for promoting, simulating, building, auditing, and maintaining the mechanisms and products of the DeFi ecosystem.</div>
          </div>
        </div>
      </div>

      <div className="products">
        <div className="firstRow">
          <div className="title">
            <div className="triangle"><img /></div>
            <div className="name">Products</div>
            <div className="subtitle">A Safe Haven for Open Finance</div>
          </div>
        </div>
        <div className="secondRow">
          <div className="leftColumn">
            <div className="productName">Prime Router: Peer to Peer Exchange Reimagined</div>
            <div className="body">PrimeDAO’s premiere launch product is a smart router that aggregates liquidity from multiple decentralized exchanges and lending pools. Soon after launch, the router will be integrated into the DAO, whose members will govern its settings, such as its whitelisted sources of liquidity.</div>
            <a className="moreInfoButton" href="http://router.primedao.io/" target="_blank" rel="noopener noreferrer">Swap Tokens</a>
          </div>
          <div className="rightColumn">
            <img src="CURVE_PD_LP_PRIMER-ROUTER-GRAPHIC_V01-2_web.jpg" />
          </div>
        </div>
      </div>

      <div className="liquiditypool">
        <div className="leftColumn">
          <img src="CURVE_PD_LP_LIQ-POOL-MANAGER_V01-2_web.jpg" />
        </div>
        <div className="rightColumn">
          <div className="productName">Liquidity Pool Manager</div>
          <div className="body">PrimeDAO will govern a liquidity pool (LP) on Balancer Protocol. LP’s are a type of automated market with a basket of tokens that have different weights. PrimeDAO will be able to choose which tokens and weights to include in its LP, and will experiment with co-farming, where liquidity providers receive PRIME token rewards and DAO voting rights in exchange for depositing liquidity to the pool.</div>
          <a className="moreInfoButton" href="https://primepool.eth.link/" target="_blank" rel="noopener noreferrer">Farm Prime!</a>
        </div>
      </div>

      <div className="safety">
        <div className="leftColumn">
          <div className="productName">DeFi&apos;s Safety Interface</div>
          <div className="body">In order to achieve its mission of safety and reliability, PrimeDAO will own and manage a decentralized, self-governing interface that provides scoring and analysis of the security of DeFi ecosystem protocols, products, and primitives.</div>
          {/* <a className="appComingButton" target="_blank" rel="noopener noreferrer">App Coming Soon</a> */}
        </div>
        <div className="rightColumn">
          <img src="CURVE_PD_LP_DEFI-SAFETY-INTERFACE_V01-2_web.jpg" />
        </div>
      </div>

      <div className="ecosystem">
        <div className="firstRow">
          <div className="title">
            <div className="triangle"><img /></div>
            <div className="name">Prime Ecosystem</div>
            <div className="subtitle">A Call For Collaboration</div>
          </div>
        </div>
        <div className="secondRow">
          <div className="leftColumn">
            <div className="body">
              <p>PrimeDAO is a coordination engine for systemic DeFi advancement. While its launch iteration revolves around its first product—the liquidity aggregator—the product horizon is near-endless for its formative collective.</p>
              <p>To this end, PrimeDAO welcomes DeFi enthusiasts, builder squads, media partners, and DAOs who want to collaborate to move open finance forward in a safe and inclusive fashion.</p>
            </div>
            <a className="joinButton" href="https://docs.primedao.io/primedao/call-for-contributors" target="_blank" rel="noopener noreferrer">Join the Ecosystem</a>
          </div>
          <div className="rightColumn">
            <div className="pic">
              <picture>
                <source media="(max-width:1160px)" srcSet="CURVE_PD_DEFI_ECOSYSTEM_V02-1-mobile.jpg" />
                <img src="CURVE_PD_DEFI_ECOSYSTEM_V02-1.jpg" />
              </picture>
            </div>
          </div>
        </div>
      </div>


      <div id="wall" className="wall">
        <img src="CURVE_PD_LOGO-WALL_V01-4.jpg"></img>
      </div>

      <div className="primeDev">
        <div className="logo"><img src="pd_foundation_logo_web_01.jpg"></img></div>
        <div className="body">The <span className="primefoundation">Prime Development Foundation</span>, based in Curaçao, provides PrimeDAO with a legal anchor into the traditional legal world. The Foundation is mandated to support the initiation and development of the network, but does not own PrimeDAO or any of its products.</div>
        <a className="button" href="mailto:hello@primedao.io" target="#" rel="noopener noreferrer">Contact the Foundation</a>
      </div>

      <div className="join">
        <div className="title">Stay Informed:</div>
        <div className="subtitle">In the next few months, the PrimeDAO ecosystem will launch. You will not receive spam and your email will never be shared.</div>
        <div><a className="button" href="https://primedao.substack.com/" target="_blank" rel="noopener noreferrer">Sign Up</a></div>
      </div>

      <div className="moreInfo">
        <div className="title">PrimeDAO</div>
        <div className="logo">
          <img src="PrimeDAOLogo-grey.svg" />
        </div>
        <div className="links">
          <a href="mailto:hello@primedao.io" target="#" rel="noopener noreferrer">Contact Us</a>&nbsp;|&nbsp;
          <a href="https://docs.primedao.io/primedao/faqs" target="_blank" rel="noopener noreferrer">FAQ</a>
        </div>
        <div className="subtitle">&copy; 2020 Prime Development Foundation</div>
        <div className="share">
          <a className="discord" href="https://discord.gg/x8v59pG" target="_blank" rel="noopener noreferrer"></a>
          <a className="twitter" href=" https://twitter.com/PrimeDAO_?s=09" target="_blank" rel="noopener noreferrer"></a>
          <a className="medium" href="https://medium.com/primedao" target="_blank" rel="noopener noreferrer"></a>
          <a className="forum" href="https://daotalk.org/c/daos/primedao/38" target="_blank" rel="noopener noreferrer"></a>
          <a className="telegram" href="https://t.me/primedao" target="_blank" rel="noopener noreferrer"></a>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
