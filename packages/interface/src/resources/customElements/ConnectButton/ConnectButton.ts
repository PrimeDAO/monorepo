import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, containerless, customElement, computedFrom } from "aurelia-framework";
import { DisposableCollection } from "services/DisposableCollection";
import { Address, EthereumService, Networks } from "services/EthereumService";
import { TransactionReceipt } from "services/TransactionsService";
import "./ConnectButton.scss";

@containerless
@autoinject
@customElement("connectbutton")
export class ConnectButton {

  private subscriptions: DisposableCollection = new DisposableCollection();
  private accountAddress: Address = null;
  private busySendingTx = false;
  private txReceipt: TransactionReceipt;

  @computedFrom("accountAddress")
  private get accountAddressText(): string {
    if (this.accountAddress) {
      const len = this.accountAddress.length;
      return `${this.accountAddress.slice(0, 6)}...${this.accountAddress.slice(len - 5, len - 1)}`;
    } else {
      return "";
    }
  }

  constructor(
    private ethereumService: EthereumService,
    private eventAggregator: EventAggregator,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Account", async (account: Address) => {
      this.accountAddress = account;
    }));

    this.subscriptions.push(this.eventAggregator.subscribe("transaction.sent", async () => {
      this.busySendingTx = true;
    }));

    this.subscriptions.push(this.eventAggregator.subscribe("transaction.mined", async (receipt: TransactionReceipt) => {
      this.txReceipt = receipt;
      this.busySendingTx = true;
    }));

    this.subscriptions.push(this.eventAggregator.subscribe("transaction.confirmed", async () => {
      this.txReceipt = null;
      this.busySendingTx = false;
    }));

    this.subscriptions.push(this.eventAggregator.subscribe("transaction.failed", async () => {
      this.txReceipt = null;
      this.busySendingTx = false;
    }));

    this.accountAddress = this.ethereumService.defaultAccountAddress || null;
  }

  public dispose(): void {
    this.subscriptions.dispose();
  }

  private onConnect() {
    this.ethereumService.connect();
  }

  private gotoTx() {
    if (this.txReceipt) {
      let targetedNetwork = EthereumService.targetedNetwork as string;
      if (targetedNetwork === Networks.Mainnet) {
        targetedNetwork = "";
      } else {
        targetedNetwork = targetedNetwork + ".";
      }
      const where = `http://${targetedNetwork}etherscan.io/tx/${this.txReceipt.transactionHash}`;
      window.open(where, "_blank", "noopener noreferrer");
    }
  }
}
