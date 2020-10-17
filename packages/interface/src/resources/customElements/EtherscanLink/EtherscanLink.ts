import { autoinject, bindable, bindingMode, customElement } from "aurelia-framework";
import { EthereumService, Networks } from "../../../services/EthereumService";
import "./EtherscanLink.scss";

@autoinject
@customElement("etherscanlink")
export class EtherscanLink {

  @bindable({ defaultBindingMode: bindingMode.oneTime }) public address: string;

  @bindable({ defaultBindingMode: bindingMode.oneTime }) public text?: string;

  @bindable({ defaultBindingMode: bindingMode.oneTime }) public type: string;

  /**
   * set add classes on the text
   */
  @bindable({ defaultBindingMode: bindingMode.oneTime }) public css: string;

  /**
   * bootstrap config for a tooltip
   */
  // @bindable({ defaultBindingMode: bindingMode.oneTime }) public tooltip?: any;

  private clipbutton: HTMLElement;

  private networkExplorerUri: string;

  private copyMessage: string;

  private internal = false;

  private coldElement: HTMLElement;
  private hotElement: HTMLElement;

  public attached(): void {
    let targetedNetwork = EthereumService.targetedNetwork as string;
    if (targetedNetwork === Networks.Mainnet) {
      targetedNetwork = "";
    } else {
      targetedNetwork = targetedNetwork + ".";
    }
    const isGanache = targetedNetwork === "Ganache.";
    if (this.type === "tx") {
      this.copyMessage = "Hash has been copied to the clipboard";
    } else {
      this.copyMessage = "Address has been copied to the clipboard";
    }

    if (isGanache) {
      if (this.type === "tx") {
        this.internal = true;
        this.networkExplorerUri = `/#/txInfo/${this.address}`;
      }
    } else {
      // go with etherscan
      this.networkExplorerUri =
        `http://${targetedNetwork}etherscan.io/${this.type === "tx" ? "tx" : "address"}/${this.address}`;
    }

    /** timeout so setting of this.networkExplorerUri takes effect in DOM */
    // setTimeout(() => {
    //   if (this.tooltip) {
    //     ($(this.hotElement) as any).tooltip(this.tooltip);
    //     ($(this.coldElement) as any).tooltip(this.tooltip);
    //   }
    // }, 0);
  }
}
