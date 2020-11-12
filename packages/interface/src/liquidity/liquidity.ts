import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, customElement, computedFrom } from "aurelia-framework";
import { BigNumber } from "ethers";
import { toBigNumberJs } from "services/BalancerPoolLiquidity/helpers/bignumber";
import { calcPoolOutGivenSingleIn, calcSingleOutGivenPoolIn } from "services/BalancerPoolLiquidity/helpers/math";
import { bnum, calcPoolTokensByRatio } from "services/BalancerPoolLiquidity/helpers/utils";
import { Address } from "services/EthereumService";
import "./liquidity.scss";
import BigNumberJs from "services/BalancerPoolLiquidity/helpers/bignumber";

const BALANCE_BUFFER = 0.01;

@customElement("liquidity")
@autoinject
export class Liquidity {

  private model: ILiquidityModel;
  private defaultPrimeAmount: BigNumber | string;
  private defaultBPrimeAmount: BigNumber | string;
  private defaultWethAmount: BigNumber | string;
  private primeWeight: BigNumber;
  private wethWeight: BigNumber;
  private amounts = new Map<Address, string>();
  private poolTokens: any;
  private _primeAmount: BigNumber;
  private _wethAmount: BigNumber;
  private _bPrimeAmount: BigNumber;
  private _primeSelected = false;
  private _wethSelected = false;

  constructor(
    private eventAggregator: EventAggregator) {}

  public activate(_model: unknown, routeConfig: { settings: { state: ILiquidityModel } }): void {
    this.model = routeConfig.settings.state;
    /**
     * hack alert: until we have something more dynamic...
     */
    if (this?.model?.poolTokenWeights) {
      this.primeWeight = this.model.poolTokenWeights.get(this.model.primeTokenAddress);
      this.wethWeight = this.model.poolTokenWeights.get(this.model.wethTokenAddress);
    }
    // if (this?.model?.poolTokenAllowances) {
    //   this.primeAllowance = this.model.poolTokenAllowances.get(this.model.primeTokenAddress);
    //   this.wethAllowance = this.model.poolTokenAllowances.get(this.model.wethTokenAddress);
    // }
  }

  private get primeSelected() {
    return this._primeSelected;
  }

  private set primeSelected(newValue: boolean) {
    this._primeSelected = newValue;
    this.poolTokens = null;
    this.amounts = new Map<Address, string>();
    if (newValue){
      this.defaultPrimeAmount = BigNumber.from(0);
    }
    if (this.wethSelected) {
      setTimeout(() => this.amountChanged(
        this.wethAmount,
        this.model.wethTokenAddress), 100);
    }
  }

  private get wethSelected() {
    return this._wethSelected;
  }

  private set wethSelected(newValue: boolean) {
    this._wethSelected = newValue;
    this.poolTokens = null;
    this.amounts = new Map<Address, string>();
    if (newValue) {
      this.defaultWethAmount = BigNumber.from(0);
    }
    if (this.primeSelected) {
      setTimeout(() => this.amountChanged(
        this.primeAmount,
        this.model.primeTokenAddress), 0);
    }
  }
  /**
   * true if two non-zero assets are entered
   */
  @computedFrom("wethSelected", "primeSelected")
  private get isMultiAsset(): boolean {
    return this.wethSelected && this.primeSelected;
  }

  /**
   * true if exactly one non-zero asset is entered
   */
  @computedFrom("wethSelected", "primeSelected")
  private get isSingleAsset(): boolean {
    return this.wethSelected || this.primeSelected;
  }

  @computedFrom("wethSelected", "primeSelected")
  private get activeSingleTokenAddress(): Address {
    if (this.isSingleAsset) {
      return this.primeSelected ? this.model.primeTokenAddress : this.model.wethTokenAddress;
    } else {
      return null;
    }
  }

  @computedFrom("wethSelected", "primeSelected")
  private get activeSingleTokenAmount(): BigNumber {
    if (this.isSingleAsset) {
      return this.primeSelected ? this.primeAmount : this.wethAmount;
    } else {
      return null;
    }
  }

  @computedFrom("_primeAmount")
  private get primeAmount(): BigNumber {
    return this._primeAmount;
  }

  private set primeAmount(newValue: BigNumber) {
    this._primeAmount = newValue;
    if (!this.defaultPrimeAmount || !this._primeAmount?.eq(this.defaultPrimeAmount)) { // to avoid cycles
      this.amountChanged(
        this.primeAmount,
        this.model.primeTokenAddress);
    }
  }

  @computedFrom("_wethAmount")
  private get wethAmount(): BigNumber {
    return this._wethAmount;
  }

  private set wethAmount(newValue: BigNumber) {
    this._wethAmount = newValue;
    if (!this.defaultWethAmount || !this._wethAmount?.eq(this.defaultWethAmount)) { // to avoid cycles
      this.amountChanged(
        this.wethAmount,
        this.model.wethTokenAddress);
    }
  }

  @computedFrom("_bPrimeAmount")
  private get bPrimeAmount(): BigNumber {
    return this._bPrimeAmount;
  }

  private set bPrimeAmount(newValue: BigNumber) {
    this._bPrimeAmount = newValue;
    this.bPrimeAmountChanged();
  }

  @computedFrom("primeAmount", "model.userPrimeBalance")
  private get primeAmountValid(): boolean {
    return !!this.primeAmount?.lte(this.model.userPrimeBalance) && !this.primeAmount?.isZero();
  }

  @computedFrom("wethAmount", "model.userWethBalance")
  private get wethAmountValid(): boolean {
    return !!this.wethAmount?.lte(this.model.userWethBalance) && !this.wethAmount?.isZero();
  }

  @computedFrom("model.poolTokenAllowances")
  private get primeHasSufficientAllowance(): boolean {
    return !this.primeAmount || this.model.poolTokenAllowances.get(this.model.primeTokenAddress).gte(this.primeAmount);
  }

  @computedFrom("model.poolTokenAllowances")
  private get wethHasSufficientAllowance(): boolean {
    return !this.wethAmount || this.model.poolTokenAllowances.get(this.model.wethTokenAddress).gte(this.wethAmount);
  }

  private async bPrimeAmountChanged() {

  }

  private amountChanged(
    changedAmount: BigNumber,
    changedToken: Address,
  ) {

    changedAmount = changedAmount ?? BigNumber.from(0);

    const changedTokenBalance = toBigNumberJs(this.model.poolBalances.get(changedToken));
    const ratio = toBigNumberJs(changedAmount).div(changedTokenBalance);
    const poolTotalSupply = toBigNumberJs(this.model.poolTotalSupply);

    if (this.isMultiAsset) {
      this.poolTokens = calcPoolTokensByRatio(
        toBigNumberJs(ratio),
        toBigNumberJs(poolTotalSupply));
    } else {
      const tokenIn = this.activeSingleTokenAddress;
      const amount = toBigNumberJs(this.amounts.get(tokenIn) ?? this.activeSingleTokenAmount);
      const tokenInBalanceIn = toBigNumberJs(this.model.poolBalances.get(tokenIn));
      const maxInRatio = 1 / 2;
      if (amount.div(tokenInBalanceIn).gt(maxInRatio)) {
        return;
      }

      const tokenWeightIn = this.model.poolTokenWeights.get(tokenIn);
      const tokenAmountIn = amount.integerValue(BigNumberJs.ROUND_UP);
      const totalWeight = toBigNumberJs(this.model.poolTotalDenormWeight);

      this.poolTokens = calcPoolOutGivenSingleIn(
        tokenInBalanceIn,
        toBigNumberJs(tokenWeightIn),
        poolTotalSupply,
        totalWeight,
        tokenAmountIn,
        toBigNumberJs(this.model.swapfee))
        .toString(); // swapFee
    }

    this.amounts.set(changedToken, changedAmount.toString());
    const minPoolAmountOut = toBigNumberJs(this.poolTokens)
      .times(1 - BALANCE_BUFFER)
      .integerValue(BigNumberJs.ROUND_UP)
      .toString();

    this.bPrimeAmount = BigNumber.from(minPoolAmountOut);

    if (this.isMultiAsset) {
      this.model.poolTokenAddresses.map(tokenAddr => {
        if (tokenAddr !== changedToken) {
          const balancedAmountString = ratio.isNaN() ? "" :
            ratio.times(toBigNumberJs(this.model.poolBalances.get(tokenAddr))).toString();

          this.amounts.set(tokenAddr, balancedAmountString);
          // since we're not yet binding the UI to an array of tokens
          const balancedAmount = BigNumber.from(balancedAmountString);
          if (tokenAddr === this.model.wethTokenAddress) {
            this.defaultWethAmount = balancedAmount;
          } else {
            this.defaultPrimeAmount = balancedAmount;
          }
        }
      });
    }
  }

  private async getRemoveTokenAmountOut(
    poolAmountIn: BigNumber,
    tokenAddress: Address): Promise<BigNumberJs> {

    if (!parseFloat(poolAmountIn?.toString())) return new BigNumberJs(0);

    const tokenBalanceOut = toBigNumberJs(this.model.poolBalances.get(tokenAddress));
    const tokenWeightOut = await this.model.crPool.getDenormalizedWeight(tokenAddress);
    const poolSupply = toBigNumberJs(await this.model.crPool.totalSupply());
    const totalWeight = await this.model.crPool.getTotalDenormalizedWeight();
    const swapFee = bnum(toBigNumberJs(this.model.swapfee)).times("1e18");

    return calcSingleOutGivenPoolIn(
      tokenBalanceOut,
      tokenWeightOut,
      poolSupply,
      totalWeight,
      toBigNumberJs(poolAmountIn),
      swapFee,
    );
  }

  private valid(): boolean {
    if (this.model.remove) {

      if (this.isSingleAsset) {
        if (this.activeSingleTokenAmount.gt(this.model.poolBalances.get(this.activeSingleTokenAddress))) {
          this.eventAggregator.publish("handleValidationError", "Can't remove this amount because it exceeds the amount in the pool");
          return false;
        }
      }

    } else {

      if (this.wethAmount?.isZero() && this.primeAmount?.isZero()) {
        this.eventAggregator.publish("handleValidationError", "Please specify amounts for PRIME and/or WETH");
        return false;
      }
      if (this.wethAmount &&
        !this.wethAmount.isZero() &&
        this.wethAmount.gt(this.model.userTokenBalances.get(this.model.wethTokenAddress))) {
        this.eventAggregator.publish("handleValidationError", "Can't add this amount, you will exceed your balance of WETH");
        return false;
      }
      if (this.primeAmount &&
        !this.primeAmount.isZero() &&
        this.primeAmount.gt(this.model.userTokenBalances.get(this.model.primeTokenAddress))) {
        this.eventAggregator.publish("handleValidationError", "Can't add this amount, you will exceed your balance of PRIME");
        return false;
      }
    }
    return true;
  }

  private async handleSubmit(): Promise<void> {

    if (!this.valid()) {
      return;
    }

    if (this.model.remove) {
      if (this.isMultiAsset) {
        await this.model.liquidityExit(
          this.bPrimeAmount,
          this.model.poolTokenAddresses.map(() => "0"),
        );
      } else {
        const poolAmountIn = this.activeSingleTokenAmount;
        const tokenAddress = this.activeSingleTokenAddress;
        const minTokenAmountOut = (await this.getRemoveTokenAmountOut(poolAmountIn, tokenAddress))
          .times(1 - BALANCE_BUFFER)
          .integerValue(BigNumberJs.ROUND_UP)
          .toString();
        this.model.liquidityExitswapPoolAmountIn(
          tokenAddress,
          poolAmountIn,
          minTokenAmountOut,
        );
      }
    } else { // Add Liquidity
      if (this.isMultiAsset) {
      // computed by amountChanged
        const poolAmountOut = this.poolTokens;
        const maxAmountsIn =
          this.model.poolTokenAddresses.map(tokenAddress => {
            // this.amounts computed by amountChanged
            const inputAmountIn = toBigNumberJs(this.amounts.get(tokenAddress))
              .div(1 - BALANCE_BUFFER)
              .integerValue(BigNumberJs.ROUND_UP);
            /**
           * pool is crPool
           * balance of the token held by the crPool
           */
            const balanceAmountIn = toBigNumberJs(this.model.userTokenBalances[tokenAddress]);
            const tokenAmountIn = BigNumberJs.min(inputAmountIn, balanceAmountIn);
            return tokenAmountIn.toString();
          });

        this.model.liquidityJoinPool(poolAmountOut, maxAmountsIn);

      } else { // singleAsset
        const tokenIn = this.activeSingleTokenAddress;
        if (!tokenIn) {
          return;
        }

        const tokenAmountIn = toBigNumberJs(this.amounts.get(tokenIn))
          .integerValue(BigNumberJs.ROUND_UP)
          .toString();

        const minPoolAmountOut = this.bPrimeAmount.toString();

        this.model.liquidityJoinswapExternAmountIn(tokenIn, tokenAmountIn, minPoolAmountOut);
      }
    }
  }

  private handleGetMaxWeth() {
    this.defaultWethAmount = this.model.userWethBalance;
  }

  private handleGetMaxPrime() {
    this.defaultPrimeAmount = this.model.userPrimeBalance;
  }

  private handleGetMaxBPrime() {
    this.defaultBPrimeAmount = this.model.userBPrimeBalance;
  }

  private unlock(tokenAddress: Address) {
    this.model.liquiditySetTokenAllowance(tokenAddress,
      tokenAddress === this.model.primeTokenAddress ? this.primeAmount : this.wethAmount);
  }
}

interface ILiquidityModel {
  bPool: any,
  poolBalances: Map<Address, BigNumber>;
  connected: boolean;
  crPool: any,
  liquidityJoinPool(poolAmountOut, maxAmountsIn): Promise<void>;
  liquidityJoinswapExternAmountIn(tokenIn, tokenAmountIn, minPoolAmountOut): Promise<void>;
  liquidityExit(poolAmountIn, minAmountsOut): Promise<void>;
  liquidityExitswapPoolAmountIn(tokenAddress, poolAmountIn, minTokenAmountOut): Promise<void>;
  liquiditySetTokenAllowance(tokenAddress: Address, amount: BigNumber): Promise<void>;
  remove: boolean; // if falsy then add
  swapfee: BigNumber;
  userBPrimeBalance: BigNumber;
  userPrimeBalance: BigNumber;
  userWethBalance: BigNumber;
  poolTokenWeights: Map<string, BigNumber>;
  poolTokenAddresses: Array<Address>;
  poolTokenAllowances: Map<Address, BigNumber>;
  primeToken: any;
  primeTokenAddress: Address;
  poolTotalSupply: BigNumber;
  poolTotalDenormWeight: BigNumber;
  weth: any;
  wethTokenAddress: Address;
  userTokenBalances: Map<Address, BigNumber>;
}

/**
 * random TODO:  handle cases where tokens may not have 18 decimals?
 */
