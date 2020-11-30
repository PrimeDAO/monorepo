import { Container } from "aurelia-dependency-injection";
import { autoinject, BindingEngine, TemplatingEngine } from "aurelia-framework";
import { IDisposable } from "services/IDisposable";

@autoinject
export class AureliaHelperService {

  constructor(
    public container: Container,
    private templatingEngine: TemplatingEngine,
    private bindingEngine: BindingEngine,
  ) {

  }

  /**
 * Make property bindable
 * @param object
 * @param propertyName
 */
  // public makePropertyObservable(object: unknown, propertyName: string): void {
  //   this.bindingEngine.propertyObserver(object, propertyName);
  // }

  /**
   * Create an observable property and subscribe to changes
   * @param object
   * @param propertyName
   * @param func
   */
  public createPropertyWatch(
    object: unknown,
    propertyName: string,
    func: (newValue: any, oldValue: any) => void): IDisposable {
    return this.bindingEngine.propertyObserver(object, propertyName)
      .subscribe((newValue, oldValue) => {
        func(newValue, oldValue);
      });
  }

  /**
   * bind the html element located by the path given by elementSelector.
   * @param elementSelector
   * @param bindingContext -- The viewmodel against which the binding should run
   */
  public enhance(elementSelector: string, bindingContext: unknown): void {
    const el = document.querySelector(elementSelector);
    this.enhanceElement(el, bindingContext);

  }

  public enhanceElement(el: Element, bindingContext: unknown, reEnhance = false): void {
    if (el) {
      if (reEnhance) {
        el.classList.remove("au-target");
      }
      this.templatingEngine.enhance({ element: el, bindingContext });
    }
  }
}
