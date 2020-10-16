import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, containerless, customElement } from "aurelia-framework";
import { DisposableCollection } from "services/DisposableCollection";
import { formatEther } from "ethers/lib/utils";
import { EthereumService } from "services/EthereumService";

@autoinject
@containerless
@customElement("ethbalance")
export class EthBalance {
  // @bindable({ defaultBindingMode: bindingMode.toView }) public placement = "top";

  private balance: string = null;
  private filter: any;
  private subscriptions = new DisposableCollection();
  private checking = false;
  private account: string;

  constructor(
    private eventAggregator: EventAggregator,
    private ethereumService: EthereumService) {
  }

  public attached(): void {
    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Account",
      (account: string) => {
        this.account = account;
        this.getBalance();
      }));
    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Id",
      () => { this.initialize(); }));
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.stop();
    this.account = await this.ethereumService.defaultAccountAddress;
    /**
     * this is supposed to fire whenever a new block is created
     */
    this.filter = EthereumService.readOnlyProvider.on("block", () => {
      this.getBalance();
    });
    this.getBalance();
  }

  private stop(): void {
    if (this.filter) {
      this.filter.stopWatching();
      this.filter = null;
    }
  }

  private detached(): void {
    if (this.subscriptions) {
      this.subscriptions.dispose();
    }

    this.stop();
  }

  private async getBalance() {
    if (!this.checking) {
      try {
        this.checking = true;
        if (this.account) {
          const provider = EthereumService.readOnlyProvider;
          this.balance = formatEther(await provider.getBalance(this.account));
        } else {
          this.balance = null;
        }
        // tslint:disable-next-line:no-empty
        // eslint-disable-next-line no-empty
      } catch (ex) {
      } finally {
        this.checking = false;
      }
    }
  }
}
