import { TransactionResponse } from "@ethersproject/providers/lib";

export default class TransactionsService {

  public static async send(methodCall: () => Promise<TransactionResponse>): Promise<TransactionResponse> {
    const response = methodCall();
    return response;
  }
}

export { TransactionResponse } from "@ethersproject/providers/lib";
export { TransactionReceipt } from "@ethersproject/providers/lib";
