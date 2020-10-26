import { DialogController } from "aurelia-dialog";
import { autoinject } from "aurelia-framework";
import "./liquidity.scss";

@autoinject
export class Liquidity {

  private model: ILiquidityModel;
  private okButton: HTMLElement;

  constructor(private controller: DialogController) { }

  public activate(model: ILiquidityModel): void {
    this.model = model;
  }

  // public attached(): void {
  //   // attach-focus doesn't work
  //   this.okButton.focus();
  // }

  private handleSubmit(): void {
    this.controller.ok();
  }
}

interface ILiquidityModel {
  remove: boolean; // if falsy then add
}
