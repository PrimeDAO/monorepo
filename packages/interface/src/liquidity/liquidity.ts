import { autoinject, customElement } from "aurelia-framework";
import "./liquidity.scss";

@customElement("liquidity")
@autoinject
export class Liquidity {

  private model: ILiquidityModel;
  private okButton: HTMLElement;

  public activate(model: ILiquidityModel): void {
    this.model = model;
  }

  // public attached(): void {
  //   // attach-focus doesn't work
  //   this.okButton.focus();
  // }

  private handleSubmit(): void {
    // this.controller.ok();
  }
}

interface ILiquidityModel {
  remove: boolean; // if falsy then add
}
