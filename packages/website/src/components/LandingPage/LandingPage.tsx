import React from 'react';
// import { withRouter } from 'react-router-dom';
import './LandingPage.scss';

const LandingPage = (): React.ReactElement => {

  return (
    <div className="landingPageWrapper">
      <div className="introduction">
        <div className="container">
          <div className="header">
            <img className="logo" src="/src/assets/images/PrimeDAOLogo.svg"/>
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
    </div>
  );
};

export default LandingPage;
