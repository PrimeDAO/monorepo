import { bootstrap } from "aurelia-bootstrapper";
import { StageComponent } from "aurelia-testing";
import { PLATFORM } from "aurelia-pal";

describe("Stage App Component", () => {
  let component;

  beforeEach(() => {
    component = StageComponent
      .withResources(PLATFORM.moduleName("app"))
      .inView("<app></app>");
  });

  afterEach(() => component.dispose());

  it("should showdashboard", done => {
    component.create(bootstrap).then(async () => {
      // const view = component.element;
      const dashboardElement = document.querySelector("dashboard");
      expect(dashboardElement).toBeDefined();
      // expect(view.textContent.trim()).toBe("primepool.eth!");
      done();
    }).catch(e => {
      fail(e);
      done();
    });
  });
});
