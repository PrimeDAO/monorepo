import { autoinject } from "aurelia-framework";
import { BigNumber } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
/**
 * Convert between Wei (as BigNumber) in viewmodel to eth (as string) in view.
 * Note that even if the viewmodel supplies a number, modified values are saved back
 * to the viewmodel as BigNumber.
 */
@autoinject
export class EthweiValueConverter {

  /**
   * ETH string to Wei BigNumber <==  NOTE you always end up with BigNumber in your model
   *
   * When the string cannot be converted to a number, this will return the original string.
   * This helps the user see the original mistake.  Validation will need to make sure that the
   * incorrect value is not persisted.
   * @param ethValue
   */
  public fromView(ethValue: string): BigNumber {
    if ((ethValue === undefined) || (ethValue === null)) {
      return null;
    }

    return parseEther(ethValue);
  }

  /**
   *  Wei BigNumber|string to ETH string
   * @param weiValue
   */
  public toView(weiValue: BigNumber|string): string {
    try {
      if ((weiValue === undefined) || (weiValue === null)) {
        return "";
      }

      return formatEther(weiValue);
    } catch (ex) {
      return weiValue.toString();
    }
  }
}
