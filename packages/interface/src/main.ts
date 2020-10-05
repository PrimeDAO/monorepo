import {Aurelia} from "aurelia-framework";
import * as environment from "../config/environment.json";
import {PLATFORM} from "aurelia-pal";
import { EthereumService, Networks } from "services/EthereumService";

export function configure(aurelia: Aurelia): void {
  aurelia.use
    .standardConfiguration()
    .feature(PLATFORM.moduleName("resources/index"))
    .globalResources([
      PLATFORM.moduleName("dashboard/dashboard"),
    ]);

  aurelia.use.developmentLogging(environment.debug ? "debug" : "warn");

  if (environment.testing) {
    aurelia.use.plugin(PLATFORM.moduleName("aurelia-testing"));
  }

  aurelia.start().then(() =>
  {
    EthereumService.initialize(process.env.NODE_ENV === "development" ? Networks.Rinkeby : Networks.Mainnet);
    aurelia.setRoot(PLATFORM.moduleName("app"));
  });
}
