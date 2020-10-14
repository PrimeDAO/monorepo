import { Aurelia } from "aurelia-framework";
import * as environment from "../config/environment.json";
import { PLATFORM } from "aurelia-pal";
import { EthereumService, Networks } from "services/EthereumService";
import { EventConfigException } from "services/GeneralEvents";
import { ConsoleLogService } from "services/ConsoleLogService";

export function configure(aurelia: Aurelia): void {
  aurelia.use
    .standardConfiguration()
    .feature(PLATFORM.moduleName("resources/index"))
    .plugin(PLATFORM.moduleName("aurelia-animator-css"))
    .plugin(PLATFORM.moduleName("aurelia-dialog"), (configuration) => {
      // custom configuration
      configuration.settings.keyboard = false;
    })
    .globalResources([
      PLATFORM.moduleName("dashboard/dashboard"),
    ]);

  aurelia.use.developmentLogging(environment.debug ? "debug" : "info");

  if (environment.testing) {
    aurelia.use.plugin(PLATFORM.moduleName("aurelia-testing"));
  }

  aurelia.start().then(() => {
    aurelia.container.get(ConsoleLogService);
    try {
      EthereumService.initialize(process.env.NODE_ENV === "development" ? Networks.Rinkeby : Networks.Mainnet);
    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException("Sorry, couldn't connect to ethereum", ex));
    }
    aurelia.setRoot(PLATFORM.moduleName("app"));
  });
}
