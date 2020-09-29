import * as React from "react";
import { HashRouter, Route, Switch } from "react-router-dom";
import { ContractsService } from "services/contractsService";
import EthereumService from "services/ethereumService";
import "./App.scss";
import LandingPage from "./components/LandingPage/LandingPage";
require("dotenv").config();

const App = (): React.ReactElement => {
  EthereumService.initialize(process.env.NODE_ENV === "development" ? "rinkeby" : "mainnet");
  ContractsService.initialize();

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
