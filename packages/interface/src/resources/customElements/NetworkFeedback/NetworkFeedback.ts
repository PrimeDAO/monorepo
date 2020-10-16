import { autoinject, containerless, customElement } from "aurelia-framework";
import { EthereumService } from "services/EthereumService";

@autoinject
@containerless
@customElement("networkfeedback")

export class NetworkFeedback {

  private network: string;

  constructor() {
    this.network = EthereumService.targetedNetwork;
  }

}
