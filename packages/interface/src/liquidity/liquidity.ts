import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, customElement } from "aurelia-framework";
import { BigNumber } from "ethers";
// import { AureliaHelperService } from "services/AureliaHelperService";
import { Address } from "services/EthereumService";
import "./liquidity.scss";

@customElement("liquidity")
@autoinject
export class Liquidity {

  private model: ILiquidityModel;

  // private poolAddress: Address;
  // private swapFee: BigNumber;
  // private poolshare: BigNumber;

  constructor(
    // private aureliaHelperService: AureliaHelperService,
    private eventAggregator: EventAggregator) {}

  public activate(_model: unknown, routeConfig: { settings: { state: ILiquidityModel }}): void {
    this.model = routeConfig.settings.state;

    // /**
    //  * observe changes to passed-in model values
    //  */
    // this.aureliaHelperService.createPropertyWatch(model, "swapFee", (newValue: BigNumber) => {
    //   this.swapFee = newValue;
    // });

    // this.aureliaHelperService.createPropertyWatch(model, "poolshare", (newValue: BigNumber) => {
    //   this.poolshare = newValue;
    // });
  }

  public attached(): Promise<void> {

    this.eventAggregator.subscribe("Network.Changed.Account", async (account: Address) => {

      // if (!account) {
      //   this.router.navigateToRoute("dashboard");
      // }
      await this.initialize(account);
    });

    return this.initialize();
  }

  private async initialize(account?: Address) {
  }

  private handleSubmit(): void {
  }
}

interface ILiquidityModel {
  bPoolAddress: Address;
  connected: boolean;
  poolshare: BigNumber;
  remove: boolean; // if falsy then add
  swapfee: BigNumber;
}
