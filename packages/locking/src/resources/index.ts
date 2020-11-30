import { FrameworkConfiguration } from "aurelia-framework";
import { PLATFORM } from "aurelia-pal";

export function configure(config: FrameworkConfiguration): void {
  config.globalResources([
    PLATFORM.moduleName("./elements/banner/banner"),
    PLATFORM.moduleName("./elements/EtherscanLink/EtherscanLink"),
    PLATFORM.moduleName("./elements/EthBalance/EthBalance"),
    PLATFORM.moduleName("./elements/TokenBalance/TokenBalance"),
    PLATFORM.moduleName("./elements/UsersAddress/UsersAddress"),
    PLATFORM.moduleName("./elements/copyToClipboardButton/copyToClipboardButton"),
    PLATFORM.moduleName("./elements/numericInput/numericInput"),
    PLATFORM.moduleName("./elements/formattedNumber/formattedNumber"),
    PLATFORM.moduleName("./elements/ConnectButton/ConnectButton"),
    PLATFORM.moduleName("./elements/NetworkFeedback/NetworkFeedback"),
    PLATFORM.moduleName("./elements/modalscreen/modalscreen"),
    PLATFORM.moduleName("./value-converters/number"),
    PLATFORM.moduleName("./value-converters/ethwei"),
    PLATFORM.moduleName("./value-converters/date"),
    PLATFORM.moduleName("./value-converters/timespan"),
    PLATFORM.moduleName("./value-converters/boolean"),
    PLATFORM.moduleName("./value-converters/secondsDays"),
    PLATFORM.moduleName("./value-converters/smallHexString"),
    // PLATFORM.moduleName("./dialogs/alert/alert"),
    // PLATFORM.moduleName("./bindingBehaviors/asyncBinding"),
  ]);
}
