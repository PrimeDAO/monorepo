import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, bindable, containerless } from "aurelia-framework";

@containerless
@autoinject
export class CopyToClipboardButton {

  /** supply either element or textToCopy */
  @bindable
  public element: HTMLElement;

  /** supply either element or textToCopy */
  @bindable
  public textToCopy: string;

  @bindable
  public message = "Copied to the clipboard";

  private button: HTMLElement;

  constructor(
    private eventAggregator: EventAggregator,
  ) { }

  public attached(): void {
    // ($(this.button) as any).tooltip(
    //   {
    //     placement: "right",
    //     title: "Copy to clipboard",
    //     toggle: "tooltip",
    //     trigger: "hover",
    //   },
    // )
    // .css("z-index", "100000")

  }

  private listener(e) { e.clipboardData.setData("text/plain", this.textToCopy); e.preventDefault(); }

  private copy(e: Event): void {
    if (this.element) {
      this.textToCopy = this.element.textContent;
    }

    const handler = this.listener.bind(this);

    document.addEventListener("copy", handler);
    document.execCommand("copy");
    document.removeEventListener("copy", handler);

    this.eventAggregator.publish("showMessage", this.message);

    e.stopPropagation();
  }
}
