import { BigNumber } from "ethers";
import { ITokenSpecification } from "services/LockService";
import { SortService } from "services/SortService";

export interface ITokenSpecificationX extends ITokenSpecification {
  balance?: BigNumber;
}

export class SortTokensValueConverter {
  public signals = ["token.changed"];
  public toView(tokens: Array<ITokenSpecificationX>): Array<ITokenSpecificationX> {
    return [
      ...tokens
        .filter((tokenInfo: ITokenSpecificationX) => {
          return tokenInfo.balance && !tokenInfo.balance.eq(0);
        })
        .sort((a: ITokenSpecificationX, b: ITokenSpecificationX) => {
          return SortService.evaluateString(a.symbol, b.symbol);
        }),
      ...tokens.filter((tokenInfo: ITokenSpecificationX) => {
        return !tokenInfo.balance || tokenInfo.balance.eq(0);
      })
        .sort((a: ITokenSpecificationX, b: ITokenSpecificationX) => {
          return SortService.evaluateString(a.symbol, b.symbol);
        }),
    ];
  }
}
