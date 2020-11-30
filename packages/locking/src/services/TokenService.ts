import { autoinject } from "aurelia-framework";
import { BigNumber, Contract, ethers } from "ethers";
// import { formatEther } from "ethers/lib/utils";
import { ContractNames, ContractsService } from "services/ContractsService";
import { Address, EthereumService } from "services/EthereumService";

export interface IErc20Token {
  totalSupply(): Promise<BigNumber>;
  balanceOf(account: Address): Promise<BigNumber>;
  transfer(recipient: Address, amount: BigNumber): Promise<boolean>
  allowance(owner: Address, spender: Address): Promise<BigNumber>
  approve(spender: Address, amount: BigNumber): Promise<boolean>
  transferFrom(sender: Address, recipient: Address, amount: BigNumber): Promise<boolean>
}

@autoinject
export class TokenService {

  private erc20Abi: any;

  constructor(
    private ethereumService: EthereumService,
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
    return new ethers.Contract(
      tokenAddress,
      this.erc20Abi,
      this.ethereumService.readOnlyProvider) as unknown as Contract & IErc20Token;
  }
}
