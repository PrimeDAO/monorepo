import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, containerless, customElement, computedFrom } from "aurelia-framework";
import { DisposableCollection } from "services/DisposableCollection";
import { Address, EthereumService } from "services/EthereumService";
import "./ConnectButton.scss";

@containerless
@autoinject
@customElement("connectbutton")
export class ConnectButton {

  private subscriptions: DisposableCollection = new DisposableCollection();
  private accountAddress: Address;

  @computedFrom("accountAddress")
  private get accountAddressText(): string {
    const len = this.accountAddress.length;
    return `${this.accountAddress.slice(0, 6)}...${this.accountAddress.slice(len - 5, len - 1)}`;
  }

  constructor(
    private ethereumService: EthereumService,
    private eventAggregator: EventAggregator,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Account", async (account: Address) => {
      this.accountAddress = account;
    }));

    this.accountAddress = this.ethereumService.defaultAccountAddress;
  }

  public dispose(): void {
    this.subscriptions.dispose();
  }

  private onConnect() {
    this.ethereumService.connect();
  }
}
