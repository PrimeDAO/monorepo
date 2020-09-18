import * as React from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import './App.scss';
import LandingPage from './components/LandingPage/LandingPage';

const App = (): React.ReactElement => {
  return (
    <div className="app-shell">
      <HashRouter>
        <Switch>
          <Route exact path="/">
            <div className="landing-body-container">
              <LandingPage />
            </div>
          </Route>
        </Switch>
      </HashRouter>
    </div>
  );
};

export default App;
