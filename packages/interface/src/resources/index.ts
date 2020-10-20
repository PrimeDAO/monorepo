import { FrameworkConfiguration } from "aurelia-framework";
import { PLATFORM } from "aurelia-pal";

export function configure(config: FrameworkConfiguration): void {
  config.globalResources([
    PLATFORM.moduleName("./customElements/banner/banner"),
    PLATFORM.moduleName("./customElements/EtherscanLink/EtherscanLink"),
    PLATFORM.moduleName("./customElements/EthBalance/EthBalance"),
    PLATFORM.moduleName("./customElements/UsersAddress/UsersAddress"),
    PLATFORM.moduleName("./customElements/copyToClipboardButton/copyToClipboardButton"),
    PLATFORM.moduleName("./customElements/numericInput/numericInput"),
    PLATFORM.moduleName("./customElements/floatingPointNumber/floatingPointNumber"),
    PLATFORM.moduleName("./customElements/ConnectButton/ConnectButton"),
    PLATFORM.moduleName("./customElements/NetworkFeedback/NetworkFeedback"),
    PLATFORM.moduleName("./valueConverters/number"),
    PLATFORM.moduleName("./valueConverters/ethwei"),
    PLATFORM.moduleName("./valueConverters/date"),
    PLATFORM.moduleName("./valueConverters/timespan"),
    PLATFORM.moduleName("./valueConverters/boolean"),
    PLATFORM.moduleName("./valueConverters/secondsDays"),
    PLATFORM.moduleName("./valueConverters/smallHexString"),
    PLATFORM.moduleName("./dialogs/alert/alert"),
  ]);
}
