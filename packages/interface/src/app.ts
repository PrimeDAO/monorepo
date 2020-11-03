import { autoinject } from "aurelia-framework";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";
import { Router, RouterConfiguration } from "aurelia-router";
import { PLATFORM } from "aurelia-pal";
import "./styles/styles.scss";
import "./app.scss";

@autoinject
export class App {
  constructor (private eventAggregator: EventAggregator) { }

  private router: Router;
  private onOff = false;

  private errorHandler = (ex: unknown): boolean => {
    this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an unexpected error occurred", ex));
    return false;
  }

  public attached(): void {
    window.addEventListener("error", this.errorHandler);

    this.eventAggregator.subscribe("transaction.sent", async () => {
      this.onOff = true;
    });

    this.eventAggregator.subscribe("transaction.confirmed", async () => {
      this.onOff = false;
    });

    this.eventAggregator.subscribe("transaction.failed", async () => {
      this.onOff = false;
    });

  }

  private configureRouter(config: RouterConfiguration, router: Router) {

    config.title = "interface.PrimeDAO.eth";
    config.options.pushState = true;
    config.options.root = "/";
    /**
     * first set the landing page.
     * it is possible to be connected but have the wrong chain.
     */
    config.map([
      {
        moduleId: PLATFORM.moduleName("./dashboard/dashboard"),
        name: "dashboard",
        nav: false,
        route: ["", "/"],
        title: "",
      }
      , {
        moduleId: PLATFORM.moduleName("./liquidity/liquidity"),
        name: "liquidity",
        nav: false,
        // 'address' will be present in the object passed to the 'activate' method of the viewmodel
        route: ["liquidity"],
        title: "Liquidity",
      },
    ]);

    config.fallbackRoute("");

    this.router = router;
  }
}
