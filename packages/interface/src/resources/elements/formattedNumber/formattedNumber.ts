import {
  autoinject,
  bindable,
  bindingMode,
  computedFrom,
} from "aurelia-framework";
import { NumberService } from "services/numberService";
import tippy from "tippy.js";

@autoinject
export class FormattedNumber {

  /**
   * how many significant digits we want to display
   */
  @bindable({ defaultBindingMode: bindingMode.toView }) public format?: string;
  @bindable({ defaultBindingMode: bindingMode.toView }) public value: number | string;
  @bindable({ defaultBindingMode: bindingMode.toView }) public placement = "top";
  @bindable({ defaultBindingMode: bindingMode.toView }) public defaultText = "--";

  private text: string;
  private textElement: HTMLElement;
  private _value: number | string;

  constructor(private numberService: NumberService) {
  }

  public valueChanged(): void {
    if ((this.value === undefined) || (this.value === null)) {
      this.text = this.defaultText;
      return;
    }

    this._value = this.value;

    let text = null;

    if (this._value) {
      text = this.numberService.toString(Number(this._value), this.format);
    }

    this.text = text ?? this.defaultText;

    this.setTooltip();
  }

  public attached(): void {
    this.setTooltip();
  }

  // public detached(): void {
  //   tippy(this.textElement, "dispose");
  // }

  @computedFrom("_value")
  private get tooltip():string {
    return this._value?.toString(10);
  }

  private setTooltip() {
    if (this.textElement && this.value) {
      // tippy(this.textElement, "dispose");
      const instance = tippy(this.textElement, {
        appendTo: () => document.body, // because is "interactive" and otherwise messes with the layout on hover
        zIndex: 10001,
      });
      instance.setContent(this.value.toString());
    }
  }
}
