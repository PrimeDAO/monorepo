import "./modalscreen.scss";
import { bindable, bindingMode, containerless, customElement } from "aurelia-framework";

/**
 * wrap this element around some content and set `onOff` to true when you want to disable and dim the contained content.
 */
@containerless
@customElement("modalscreen")
export class ModalScreen {

  @bindable({ defaultBindingMode: bindingMode.toView }) public onOff: boolean;
  @bindable({ defaultBindingMode: bindingMode.toView }) public message: string;

  private container: HTMLElement;
  private mask: HTMLElement;

  constructor() {
    window.onresize = () => this.onResize();
  }

  private onOffChanged(newValue, oldValue) {
    if (newValue && !oldValue) {
      this.showHide(true);
    } else if (!newValue && oldValue) {
      this.showHide(false);
    }
  }

  private onResize() {
    if (this.container) {
      this.mask.style.height = `${this.container.scrollHeight}px`;
      this.mask.style.top = `${this.container.offsetTop}px`;
    }
  }

  private showHide(onOff) {
    if (this.mask) {
      if (onOff) {
        this.onResize();
        this.mask.style.display = "flex";
      } else {
        this.mask.style.display = "none";
      }
    }
  }
  public attached(): void {
    this.showHide(this.onOff);
  }
}
