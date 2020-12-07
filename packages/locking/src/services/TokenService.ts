import { autoinject } from "aurelia-framework";
import { BigNumber, Contract, ethers } from "ethers";
// import { formatEther } from "ethers/lib/utils";
import { ContractNames, ContractsService } from "services/ContractsService";
import { Address, EthereumService } from "services/EthereumService";
import TransactionsService, { TransactionReceipt } from "services/TransactionsService";

export interface IErc20Token {
  totalSupply(): Promise<BigNumber>;
  balanceOf(account: Address): Promise<BigNumber>;
  allowance(owner: Address, spender: Address): Promise<BigNumber>
  transfer(recipient: Address, amount: BigNumber): Promise<TransactionReceipt>
  approve(spender: Address, amount: BigNumber): Promise<TransactionReceipt>
  transferFrom(sender: Address, recipient: Address, amount: BigNumber): Promise<TransactionReceipt>
}

export interface IApprovalEvent {
  /**
   * The account from which the tokens originated.
   * indexed
   */
  owner: Address;
  /**
   * The account that was approved-to and initiated the transfer on behalf of owner.
   * indexed
   */
  spender: Address;
  /**
   * When the event is emitted by `approve`, then this is the amount that was requested
   * for approval from spender by owner by the specific function call.
   * When the event is emitted by `increaseApproval` or `decreaseApproval`, then
   * this is the current net amount approved to transfer from spender by owner.
   */
  value: BigNumber;
}

export interface ITransferEvent {
  /**
   * `msg.sender` for `transfer`, `from` for `transferFrom`
   * indexed
   */
  from: Address;
  /**
   * the recipient of the tokens
   * indexed
   */
  to: Address;
  value: BigNumber;
}

@autoinject
export class TokenService {

  private erc20Abi: any;

  constructor(
    private ethereumService: EthereumService,
    private transactionService: TransactionsService,
    contractsService: ContractsService) {

    this.erc20Abi = contractsService.getContractAbi(ContractNames.IERC20);

  }

  // private async _getBalance(
  //   token: IErc20Token,
  //   accountAddress: Address,
  //   inEth = false): Promise<BigNumber> {

  //   let amount = await token.balanceOf(accountAddress);
  //   if (inEth) {
  //     amount = BigNumber.from(formatEther(amount));
  //   }
  //   return amount;
  // }

  // public async getUserBalance(
  //   tokenName: ContractNames,
  //   inEth = false): Promise<BigNumber> {

  //   const userAddress = this.ethereumService.defaultAccountAddress;

  //   return this.getTokenBalance(tokenName, userAddress, inEth);
  // }

  // public async getTokenBalance(
  //   tokenName: ContractNames,
  //   accountAddress: Address,
  //   inEth = false): Promise<BigNumber> {

  //   const token = await this.getTokenContract(tokenName);

  //   if (!token) {
  //     return null;
  //   }

  //   return this._getBalance(token, accountAddress, inEth);
  // }

  public getTokenContract(tokenAddress: Address): Contract & IErc20Token {

    const contract = new ethers.Contract(
      tokenAddress,
      this.erc20Abi,
      this.ethereumService.readOnlyProvider) as unknown as Contract;

    return Object.assign(contract, {
      transfer: (recipient: Address, amount: BigNumber) => this.transactionService.send(() => contract.transfer(recipient, amount)),
      approve: (spender: Address, amount: BigNumber) => this.transactionService.send(() => contract.approve(spender, amount)),
      transferFrom: (sender: Address, recipient: Address, amount: BigNumber) => this.transactionService.send(() => contract.transferFrom(sender, recipient, amount)),
    }) as Contract & IErc20Token;
  }
}
