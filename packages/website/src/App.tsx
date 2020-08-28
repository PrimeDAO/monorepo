import * as React from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import './App.css';
import LandingPage from './components/LandingPage/LandingPage';
import LandingPageFooter from './components/LandingPage/Footer';
import LandingPageHeader from './components/LandingPage/Header';

import FAQPage from 'components/FAQPage';
import BrandAssetsPage from 'components/BrandAssetsPage';
import CodebasePage from 'components/CodebasePage';

const App = (): React.ReactElement => {
  return (
    <HashRouter>
      <Switch>
        <Route exact path="/">
          <div className="landing-body-container">
            <div className="app-shell">
              <LandingPageHeader />
              <LandingPage />
              <LandingPageFooter />
            </div>
          </div>
        </Route>

        <Route exact path="/faq">
          <div className="landing-body-container">
            <div className="app-shell">
              <LandingPageHeader />
              <FAQPage />
              <LandingPageFooter />
            </div>
          </div>
        </Route>

        <Route exact path="/brand-assets">
          <div className="landing-body-container">
            <div className="app-shell">
              <LandingPageHeader />
              <BrandAssetsPage />
              <LandingPageFooter />
            </div>
          </div>
        </Route>

        <Route exact path="/codebase">
          <div className="landing-body-container">
            <div className="app-shell">
              <LandingPageHeader />
              <CodebasePage />
              <LandingPageFooter />
            </div>
          </div>
        </Route>
      </Switch>
    </HashRouter>
  );
};

export default App;
