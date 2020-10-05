import { CssAnimator } from "aurelia-animator-css";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, containerless } from "aurelia-framework";
import { EventConfig, EventConfigException, EventMessageType } from "../../../services/GeneralEvents";
import { from, Subject } from "rxjs";
import { concatMap } from "rxjs/operators";
import { AureliaHelperService } from "services/AureliaHelperService";
import { DisposableCollection } from "services/DisposableCollection";
import "./banner.scss";

@containerless
@autoinject
export class Banner {

  private resolveToClose: () => void;
  private okButton: HTMLElement;
  private showing = false;
  private banner: HTMLElement;
  private elMessage: HTMLElement;
  private subscriptions: DisposableCollection = new DisposableCollection();
  private queue: Subject<IBannerConfig>;
  // private etherScanTooltipConfig = {
  //   placement: "bottom",
  //   title: "Click to go to etherscan.io transaction information page",
  //   toggle: "tooltip",
  //   trigger: "hover",
  // };

  constructor(
    eventAggregator: EventAggregator,
    private animator: CssAnimator,
    private aureliaHelperService: AureliaHelperService,
  ) {
    this.subscriptions.push(eventAggregator
      .subscribe("handleException", (config: EventConfigException | any) => this.handleException(config)));
    this.subscriptions.push(eventAggregator
      .subscribe("handleFailure", (config: EventConfig | string) => this.handleFailure(config)));

    this.queue = new Subject<IBannerConfig>();
    /**
     * messages added to the queue will show up here, generating a new queue
     * of observables whose values don't resolve until they are observed
     */
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    this.queue.pipe(concatMap((config: IBannerConfig) => {
      return from(new Promise(function (resolve: () => void) {
        // with timeout, give a cleaner buffer in between consecutive snacks
        setTimeout(async () => {
          that.resolveToClose = resolve;
          // fire up this banner
          that.elMessage.innerHTML = config.message;
          switch (config.type) {
            case EventMessageType.Info:
              that.banner.classList.add("info");
              that.banner.classList.remove("failure");
              break;
            default:
              that.banner.classList.add("failure");
              that.banner.classList.remove("info");
              break;
          }
          that.aureliaHelperService.enhanceElement(that.elMessage, that, true);
          that.showing = true;
          that.animator.enter(that.banner);
        }, 200);
      }));
    }))
      // this will initiate the execution of the promises
      // each promise is executed after the previous one has resolved
      .subscribe();
  }

  public attached(): void {
    // attach-focus doesn't work
    this.okButton.focus();
  }

  public dispose(): void {
    this.subscriptions.dispose();
  }

  private async close(): Promise<void> {
    await this.animator.leave(this.banner);
    this.showing = false;
    this.resolveToClose();
  }

  private handleException(config: EventConfigException | any): void {

    if ((config as any).originatingUiElement) {
      return;
    }

    if (!(config instanceof EventConfigException)) {
      // then config is the exception itself
      const ex = config as any;
      config = { message: `${ex.message ? ex.message : ex}` } as any;
    }

    this.queueEventConfig({ message: config.message, type: EventMessageType.Exception });
  }

  private handleFailure(config: EventConfig | string): void {

    if ((config as any).originatingUiElement) {
      return;
    }

    const bannerConfig = {
      message: (typeof config === "string")
        ? config as string : config.message,
      type: EventMessageType.Failure,
    };

    this.queueEventConfig(bannerConfig);
  }

  private queueEventConfig(config: IBannerConfig): void {
    this.queue.next(config);
  }
}

interface IBannerConfig {
  type: EventMessageType;
  message: string;
}
