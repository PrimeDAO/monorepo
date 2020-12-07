import { autoinject } from "aurelia-framework";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";
import { Router, RouterConfiguration } from "aurelia-router";
import { PLATFORM } from "aurelia-pal";
import "./styles/styles.scss";
import "./app.scss";
import { ConsoleLogService } from "services/ConsoleLogService";
import { Utils } from "services/utils";
import { BindingSignaler } from "aurelia-templating-resources";
import { EthereumService } from "services/EthereumService";
import tippy from "tippy.js";

@autoinject
export class App {
  constructor (
    private eventAggregator: EventAggregator,
    private consoleLogService: ConsoleLogService,
    private signaler: BindingSignaler,
    private ethereumService: EthereumService,
  ) { }

  private router: Router;
  private onOff = false;
  private modalMessage: string;
  private intervalId: any;

  private errorHandler = (ex: unknown): boolean => {
    this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an unexpected error occurred", ex));
    return false;
  }

  public attached(): void {

    // so all elements with data-tippy-content will automatically have a tooltip
    tippy("[data-tippy-content]");

    window.addEventListener("error", this.errorHandler);

    this.eventAggregator.subscribe("dashboard.loading", async (onOff: boolean) => {
      this.modalMessage = "Thank you for your patience while we initialize for a few moments...";
      this.onOff = onOff;
    });

    this.eventAggregator.subscribe("transaction.sent", async () => {
      this.modalMessage = "Awaiting confirmation...";
      this.onOff = true;
    });

    this.eventAggregator.subscribe("transaction.confirmed", async () => {
      this.onOff = false;
    });

    this.eventAggregator.subscribe("transaction.failed", async () => {
      this.onOff = false;
    });


    this.intervalId = setInterval(async () => {
      this.signaler.signal("secondPassed");
      const blockDate = this.ethereumService.lastBlockDate;
      this.eventAggregator.publish("secondPassed", blockDate);
    }, 1000);
  }

  private configureRouter(config: RouterConfiguration, router: Router) {

    config.title = "primelocking.eth";
    config.options.pushState = true;
    // const isIpfs = (window as any).IS_IPFS;
    // if (isIpfs) {
    //   this.consoleLogService.handleMessage(`Routing for IPFS: ${window.location.pathname}`);
    // }
    config.options.root = "/"; // window.location.pathname; // to account for IPFS
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
      },
    ]);

    config.fallbackRoute("");

    this.router = router;
  }

  goto(where: string): void {
    Utils.goto(where);
  }
}
