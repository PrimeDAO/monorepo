import { TransactionResponse, TransactionReceipt } from "@ethersproject/providers/lib";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";

@autoinject
export default class TransactionsService {

  private static blocksToConfirm = 3;

  constructor(
    private eventAggregator: EventAggregator,
  ) { }

  public async send(methodCall: () => Promise<TransactionResponse>): Promise<TransactionReceipt> {
    let receipt: TransactionReceipt;
    try {
      this.eventAggregator.publish("transaction.sending");
      const response = await methodCall();
      this.eventAggregator.publish("transaction.sent", response);
      receipt = await response.wait(1);
      this.eventAggregator.publish("transaction.mined", { message: "Transaction was mined", receipt });
      receipt = await response.wait(TransactionsService.blocksToConfirm);
      this.eventAggregator.publish("transaction.confirmed", { message: "Transaction was confirmed", receipt });
      return receipt;
    } catch (ex) {
      this.eventAggregator.publish("transaction.failed", ex);
      return null;
    }
  }
}

export { TransactionResponse } from "@ethersproject/providers/lib";
export { TransactionReceipt } from "@ethersproject/providers/lib";
