import { autoinject } from "aurelia-framework";
import { BigNumber } from "ethers";
import { formatEther } from "ethers/lib/utils";
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

  constructor(
    private ethereumService: EthereumService,
    private contractsService: ContractsService) {}


  private async getErc20TokenBalance(
    token: IErc20Token,
    accountAddress: Address,
    inEth = false): Promise<BigNumber> {

    let amount = await token.balanceOf(accountAddress);
    if (inEth) {
      amount = BigNumber.from(formatEther(amount));
    }
    return amount;
  }

  public async getUserTokenBalance(
    tokenName: ContractNames,
    inEth = false): Promise<BigNumber> {

    const userAddress = this.ethereumService.defaultAccountAddress;

    return this.getTokenBalance(tokenName, userAddress, inEth);
  }

  public async getTokenBalance(
    tokenName: ContractNames,
    accountAddress: Address,
    inEth = false): Promise<BigNumber> {

    const token = await this.getErc20Token(tokenName);

    if (!token) {
      return null;
    }

    return this.getErc20TokenBalance(token, accountAddress, inEth);
  }

  public async getTokenAllowance(
    tokenName: ContractNames,
    accountAddress: Address,
    spender: Address,
    inEth = false): Promise<BigNumber> {

    const token = await this.getErc20Token(tokenName);

    if (!token) {
      return null;
    }

    let amount = await token.allowance(accountAddress, spender);
    if (inEth) {
      amount = BigNumber.from(formatEther(amount));
    }
    return amount;
  }

  private getErc20Token(tokenName: ContractNames): Promise<IErc20Token> {
    return this.contractsService.getContractFor(tokenName);
  }
}
