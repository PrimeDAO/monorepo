import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, containerless, customElement, bindable, bindingMode } from "aurelia-framework";
import { DisposableCollection } from "services/DisposableCollection";
import { Address, EthereumService } from "services/EthereumService";
import { BigNumber } from "ethers";
import { Contract, ethers } from "ethers";
import { ContractNames, ContractsService } from "services/ContractsService";

@autoinject
@containerless
@customElement("tokenbalance")
export class TokenBalance {
  @bindable({ defaultBindingMode: bindingMode.toView }) public tokenAddress: Address;
  @bindable({ defaultBindingMode: bindingMode.toView }) public placement = "top";

  private balance: BigNumber = null;
  private subscriptions = new DisposableCollection();
  private checking = false;
  private account: string;
  private contract: Contract;
  erc20Abi: any;

  constructor(
    private eventAggregator: EventAggregator,
    private ethereumService: EthereumService,
    private contractsService: ContractsService) {
  }

  public attached(): void {
    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Account",
      (account: string) => {
        this.account = account;
        this.getBalance();
      }));
    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Id",
      () => { this.initialize(); }));
    this.subscriptions.push(this.eventAggregator.subscribe("Network.NewBlock",
      () => this.getBalance()));
    this.erc20Abi = this.contractsService.getContractAbi(ContractNames.IERC20);
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.account = this.ethereumService.defaultAccountAddress;

    this.contract = new ethers.Contract(
      this.tokenAddress,
      this.erc20Abi,
      this.ethereumService.readOnlyProvider);
    this.getBalance();
  }

  private detached(): void {
    if (this.subscriptions) {
      this.subscriptions.dispose();
    }
  }

  private async getBalance() {
    if (!this.checking) {
      try {
        this.checking = true;
        if (this.account) {
          this.balance = await this.contract.balanceOf(this.account);
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
