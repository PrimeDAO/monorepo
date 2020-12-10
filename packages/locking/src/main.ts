import { Aurelia } from "aurelia-framework";
import * as environment from "../config/environment.json";
import { PLATFORM } from "aurelia-pal";
import { EthereumService, Networks } from "services/EthereumService";
import { EventConfigException } from "services/GeneralEvents";
import { ConsoleLogService } from "services/ConsoleLogService";
import { ContractsService } from "services/ContractsService";
import { EventAggregator } from "aurelia-event-aggregator";
import { LockService } from "services/LockService";
import { AvatarService } from "services/AvatarService";

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

  aurelia.start().then(async () => {
    aurelia.container.get(ConsoleLogService);
    try {
      const ethereumService = aurelia.container.get(EthereumService);
      ethereumService.initialize(process.env.NODE_ENV === "development" ? Networks.Kovan : Networks.Mainnet);

      aurelia.container.get(ContractsService);

      const lockService = aurelia.container.get(LockService);
      await lockService.initialize();

      const avatarService = aurelia.container.get(AvatarService);
      await avatarService.initialize();

    } catch (ex) {
      const eventAggregator = aurelia.container.get(EventAggregator);
      eventAggregator.publish("handleException", new EventConfigException("Sorry, couldn't connect to ethereum", ex));
      alert(`Sorry, couldn't connect to ethereum: ${ex.message}`);
    }
    aurelia.setRoot(PLATFORM.moduleName("app"));
  });
}
