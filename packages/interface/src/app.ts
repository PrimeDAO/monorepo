import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";
import "./styles/styles.scss";
export class App {
  constructor (private eventAggregator: EventAggregator) { }

  private errorHandler = (ex: unknown): boolean => {
    this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an unexpected error occurred", ex));
    return false;
  }

  public attached(): void {
    window.addEventListener("error", this.errorHandler);
  }
}
