import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, computedFrom } from "aurelia-framework";
import { BigNumber } from "ethers";
import { toBigNumberJs } from "services/BigNumberService";
import { calcPoolOutGivenSingleIn, calcSingleOutGivenPoolIn } from "services/BalancerPoolLiquidity/helpers/math";
import { calcPoolTokensByRatio } from "services/BalancerPoolLiquidity/helpers/utils";
import { Address } from "services/EthereumService";
import "./liquidity.scss";
import BigNumberJs from "services/BigNumberService";

const BALANCE_BUFFER = 0.01;

@autoinject
export class Liquidity {

  constructor(
    private eventAggregator: EventAggregator) { }

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
  private submitButton: HTMLButtonElement;

  public activate(_model: unknown, routeConfig: { settings: { state: ILiquidityModel } }): void {
    this.model = routeConfig.settings.state;
    /**
     * hack alert: until we have something more dynamic...
     */
    if (this?.model?.poolTokenNormWeights) {
      this.primeWeight = this.model.poolTokenNormWeights.get(this.model.primeTokenAddress).mul(100);
      this.wethWeight = this.model.poolTokenNormWeights.get(this.model.wethTokenAddress).mul(100);
    }
  }

  @computedFrom("model.poolUsersTokenShare")
  private get userPrimePoolShare(): BigNumber {
    return this.model.poolUsersTokenShare?.get(this.model.primeTokenAddress);
  }

  @computedFrom("model.poolUsersTokenShare")
  private get userWethPoolShare(): BigNumber {
    return this.model.poolUsersTokenShare?.get(this.model.wethTokenAddress);
  }

  private get primeSelected() {
    return this._primeSelected;
  }

  private set primeSelected(yes: boolean) {
    this._primeSelected = yes;
    if (!this.model.remove) {
      this.poolTokens = null;
      // this.amounts = new Map<Address, string>();
      this.defaultPrimeAmount = null;

      // setTimeout(() => this.amountChanged(
      //   this.primeAmount,
      //   this.model.primeTokenAddress), 0);
    } else {
      setTimeout(() => this.syncWithNewBPrimeAmount(), 100);
    }
  }

  private get wethSelected() {
    return this._wethSelected;
  }

  private set wethSelected(yes: boolean) {
    this._wethSelected = yes;
    if (!this.model.remove) {
      this.poolTokens = null;
      // this.amounts = new Map<Address, string>();
      this.defaultWethAmount = null;
    // setTimeout(() => this.amountChanged(
    //   this.wethAmount,
    //   this.model.wethTokenAddress), 100);
    } else {
      setTimeout(() => this.syncWithNewBPrimeAmount(), 100);
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
    const yes = this.wethSelected !== this.primeSelected;
    if (this.model.remove) {
      if (yes) {
        this.submitButton.classList.add("colorMeRed");
      }
      else {
        this.submitButton.classList.remove("colorMeRed");
      }
    }
    return yes;
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
      return (this.primeSelected ? this.primeAmount : this.wethAmount) ?? BigNumber.from(0);
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
    if (!this.model.remove && (!this.defaultPrimeAmount || !this._primeAmount?.eq(this.defaultPrimeAmount))) { // to avoid cycles
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
    if (!this.model.remove && (!this.defaultWethAmount || !this._wethAmount?.eq(this.defaultWethAmount))) { // to avoid cycles
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
    if (this.model.remove){
      this._bPrimeAmount = newValue;
      this.syncWithNewBPrimeAmount();
    }
  }

  private syncWithNewBPrimeAmount(): void {
    this.primeAmount = this.computeTokenToRemoveAmount(this.model.primeTokenAddress);
    this.wethAmount = this.computeTokenToRemoveAmount(this.model.wethTokenAddress);
  }

  @computedFrom("validPrimeAdd", "primeHasSufficientAllowance", "this.model.remove")
  private get showPrimeUnlock(): boolean {
    return !this.model.remove && this.validPrimeAdd && !this.primeHasSufficientAllowance;
  }

  @computedFrom("validWethAdd", "wethHasSufficientAllowance", "this.model.remove")
  private get showWethUnlock(): boolean {
    return !this.model.remove && this.validWethAdd && !this.wethHasSufficientAllowance;
  }

  @computedFrom("model.poolTokenAllowances")
  private get primeAllowance(): BigNumber {
    return this.model.poolTokenAllowances.get(this.model.primeTokenAddress);
  }

  @computedFrom("model.poolTokenAllowances")
  private get wethAllowance(): BigNumber {
    return this.model.poolTokenAllowances.get(this.model.wethTokenAddress);
  }

  @computedFrom("primeAmount", "primeAllowance")
  private get primeHasSufficientAllowance(): boolean {
    return !this.primeAmount || this.primeAllowance.gte(this.primeAmount);
  }

  @computedFrom("wethAmount", "wethAllowance")
  private get wethHasSufficientAllowance(): boolean {
    return !this.wethAmount || this.wethAllowance.gte(this.wethAmount);
  }

  @computedFrom("poolTokens", "model.userBPrimeBalance", "model.poolTotalBPrimeSupply")
  private get userLiquidity() {
    const userShares = toBigNumberJs(this.model.userBPrimeBalance);
    const totalShares = toBigNumberJs(this.model.poolTotalBPrimeSupply);
    const current = userShares.div(totalShares).integerValue(BigNumberJs.ROUND_UP);
    if (!this.valid || !(this.isSingleAsset || this.isMultiAsset)) {
      return {
        absolute: {
          current: BigNumber.from(userShares.toString()),
        },
        relative: {
          current: BigNumber.from(current.toString()),
        },
      };
    }

    const poolTokens = toBigNumberJs(this.poolTokens ?? "0");

    const future = userShares.plus(poolTokens)
      .div(totalShares.plus(poolTokens))
      .integerValue(BigNumberJs.ROUND_UP);

    return {
      absolute: {
        current: BigNumber.from(userShares.toString()),
        future: BigNumber.from(userShares.plus(poolTokens).toString()),
      },
      relative: {
        current: BigNumber.from(current.toString()),
        future: BigNumber.from(future.toString()),
      },
    };
  }

  @computedFrom("valid", "activeSingleTokenAddress", "model.remove")
  private get showSlippage(): boolean {
    return this.valid && this.activeSingleTokenAddress && !this.model.remove;
  }

  @computedFrom("showSlippage", "activeSingleTokenAmount", "model.poolBalances", "model.poolTotalBPrimeSupply", "model.poolTotalDenormWeights", "model.poolTotalDenormWeight")
  private get slippage(): BigNumber {
    if (!this.showSlippage) {
      return undefined;
    }
    const tokenInAddress = this.activeSingleTokenAddress;
    const amount = toBigNumberJs(this.amounts[tokenInAddress]);

    const tokenInBalanceIn = toBigNumberJs(this.model.poolBalances.get(tokenInAddress));
    const poolTokenShares = toBigNumberJs(this.model.poolTotalBPrimeSupply);
    const tokenWeightIn = toBigNumberJs(this.model.poolTotalDenormWeights.get(tokenInAddress));
    const tokenAmountIn = toBigNumberJs(amount.integerValue(BigNumberJs.ROUND_UP));
    const totalWeight = toBigNumberJs(this.model.poolTotalDenormWeight);

    const poolAmountOut = calcPoolOutGivenSingleIn(
      tokenInBalanceIn,
      toBigNumberJs(tokenWeightIn),
      poolTokenShares,
      totalWeight,
      tokenAmountIn,
      toBigNumberJs(this.model.swapfee));

    const expectedPoolAmountOut = tokenAmountIn
      .times(tokenWeightIn)
      .times(poolTokenShares)
      .div(tokenInBalanceIn)
      .div(totalWeight);

    return BigNumber.from(toBigNumberJs(1)
      .minus(poolAmountOut.div(expectedPoolAmountOut))
      .toString());
  }

  private computeTokenToRemoveAmount(tokenAddress: Address): BigNumber {
    if (!this.bPrimeAmount || this.bPrimeAmount.eq(0)) return BigNumber.from(0);
    const poolTokenBalance = this.model.poolBalances.get(tokenAddress);
    const bPoolTokenSupply = this.model.poolTotalBPrimeSupply;
    if (this.isMultiAsset) {
      return BigNumber.from(toBigNumberJs(poolTokenBalance)
        .div(toBigNumberJs(bPoolTokenSupply))
        .times(toBigNumberJs(this.bPrimeAmount))
        .integerValue(BigNumberJs.ROUND_UP)
        .toString());
    } else {
      return BigNumber.from(calcSingleOutGivenPoolIn(
        toBigNumberJs(poolTokenBalance),
        toBigNumberJs(this.model.poolTotalDenormWeights.get(tokenAddress)),
        toBigNumberJs(bPoolTokenSupply),
        toBigNumberJs(this.model.poolTotalDenormWeight),
        toBigNumberJs(this.bPrimeAmount),
        toBigNumberJs(this.model.swapfee))
        .integerValue(BigNumberJs.ROUND_UP)
        .toString());
    }
  }

  private amountChanged(
    changedAmount: BigNumber,
    changedToken: Address,
  ): void {

    if (!this.model.remove)
    {
      changedAmount = changedAmount ?? BigNumber.from(0);

      const changedTokenBalance = toBigNumberJs(this.model.poolBalances.get(changedToken));
      const ratio = toBigNumberJs(changedAmount).div(changedTokenBalance);
      const poolTokenShares = toBigNumberJs(this.model.poolTotalBPrimeSupply);

      if (this.isMultiAsset) {
        this.poolTokens = calcPoolTokensByRatio(
          toBigNumberJs(ratio),
          toBigNumberJs(poolTokenShares));
      } else {
        const tokenIn = this.activeSingleTokenAddress;
        const amount = toBigNumberJs(this.activeSingleTokenAmount);
        const tokenInBalanceIn = toBigNumberJs(this.model.poolBalances.get(tokenIn));
        const maxInRatio = 1 / 2;
        if (amount.div(tokenInBalanceIn).gt(maxInRatio)) {
          return;
        }

        const tokenWeightIn = this.model.poolTotalDenormWeights.get(tokenIn);
        const tokenAmountIn = amount.integerValue(BigNumberJs.ROUND_UP);
        const totalWeight = toBigNumberJs(this.model.poolTotalDenormWeight);

        this.poolTokens = calcPoolOutGivenSingleIn(
          tokenInBalanceIn,
          toBigNumberJs(tokenWeightIn),
          poolTokenShares,
          totalWeight,
          tokenAmountIn,
          toBigNumberJs(this.model.swapfee))
          .toString();
      }

      this.amounts.set(changedToken, changedAmount.toString());

      if (this.isMultiAsset) {

        this.bPrimeAmount = BigNumber.from(this.poolTokens);

        this.model.poolTokenAddresses.map(tokenAddr => {
          if (tokenAddr !== changedToken) {
            const balancedAmountString = ratio.isNaN() ? "" :
              ratio.times(toBigNumberJs(this.model.poolBalances.get(tokenAddr)))
                .integerValue(BigNumberJs.ROUND_UP)
                .toString();

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
  }

  private async getRemoveTokenAmountOut(
    bPrimeAmount: BigNumber,
    tokenAddress: Address): Promise<BigNumberJs> {

    if (!bPrimeAmount || bPrimeAmount.eq(0)) return new BigNumberJs(0);

    return calcSingleOutGivenPoolIn(
      toBigNumberJs(this.model.poolBalances.get(tokenAddress)),
      toBigNumberJs(this.model.poolTotalDenormWeights.get(tokenAddress)),
      toBigNumberJs(this.model.poolTotalBPrimeSupply),
      toBigNumberJs(this.model.poolTotalDenormWeight),
      toBigNumberJs(bPrimeAmount),
      toBigNumberJs(this.model.swapfee),
    );
  }

  private assetsAreLocked(issueMessage = true): boolean {
    let message: string;
    if (this.isMultiAsset) {
      if (!this.primeHasSufficientAllowance || !this.wethHasSufficientAllowance) {
        message = "You need to unlock PRIME and/or WETH for transfer";
      }
    } else if (this.isSingleAsset) {
      if (this.primeSelected) {
        if (!this.primeHasSufficientAllowance) {
          message = "You need to unlock PRIME for transfer";
        }
      } else {
        if (!this.wethHasSufficientAllowance) {
          message = "You need to unlock WETH for transfer";
        }
      }
    }

    if (message) {
      if (issueMessage) {
        this.eventAggregator.publish("handleValidationError", message);
      }
      return false;
    }

    return true;
  }

  /**
   * return is valid enough to submit, except for checking unlocked condition
 */
  @computedFrom("validPrimeAdd", "validWethAdd", "isSingleAsset", "model.remove", "model.poolBalances", "activeSingleTokenAmount", "activeSingleTokenAddress")
  private get valid(): string {
    let message: string;

    if (this.model.remove) {
      if (this.isSingleAsset) {
        if (this.activeSingleTokenAmount.gt(this.model.poolBalances.get(this.activeSingleTokenAddress))) {
          message = "Can't remove this amount because it exceeds the amount in the pool";
        }
      }
    } else {
      message = this.validPrimeAdd || this.validWethAdd;
    }

    return message;
  }

  @computedFrom("primeAmount")
  private get validPrimeAdd(): string {
    let message: string;

    if (this.primeAmount?.isZero()) {
      message = "Please specify an amount of PRIME";
    }

    // if (!this.primeHasSufficientAllowance) {
    //   message = "Can't add this amount, you will exceed your balance of PRIME";
    // }

    return message;
  }

  @computedFrom("wethAmount")
  private get validWethAdd(): string {
    let message: string;

    if (this.wethAmount?.isZero()) {
      message = "Please specify an amount of WETH";
    }

    // if (!this.wethHasSufficientAllowance) {
    //   message = "Can't add this amount, you will exceed your balance of WETH";
    // }

    return message;
  }

  private isValid(): boolean {
    const message = this.valid;

    if (message) {
      this.eventAggregator.publish("handleValidationError", message);
    }

    return !!message;
  }

  private async handleSubmit(): Promise<void> {

    if (!this.isValid() || !this.assetsAreLocked()) {
      return;
    }

    if (this.model.remove) {
      if (this.isMultiAsset) {
        await this.model.liquidityExit(
          this.bPrimeAmount,
          this.model.poolTokenAddresses.map(() => "0"),
        );
      } else {
        const bPrimeAmount = this.activeSingleTokenAmount;
        const tokenAddress = this.activeSingleTokenAddress;
        const minTokenAmountOut = (await this.getRemoveTokenAmountOut(bPrimeAmount, tokenAddress))
          .times(1 - BALANCE_BUFFER)
          .integerValue(BigNumberJs.ROUND_UP)
          .toString();
        this.model.liquidityExitswapPoolAmountIn(
          tokenAddress,
          bPrimeAmount,
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
            const balanceAmountIn = toBigNumberJs(this.model.userTokenBalances.get(tokenAddress));
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

        const minPoolAmountOut = toBigNumberJs(this.poolTokens)
          .times(1 - BALANCE_BUFFER)
          .integerValue(BigNumberJs.ROUND_UP)
          .toString();

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
    // just to be sure
    if ((tokenAddress === this.model.primeTokenAddress) && (this.primeAllowance.gte(this.primeAmount))) {
      this.eventAggregator.publish("handleValidationError", "An error has occurred, the PRIME allowance is already sufficient");
      return;
    }
    if ((tokenAddress === this.model.wethTokenAddress) && (this.wethAllowance.gte(this.wethAmount))) {
      this.eventAggregator.publish("handleValidationError", "An error has occurred, the WETH allowance is already sufficient");
      return;
    }
    this.model.liquiditySetTokenAllowance(tokenAddress,
      tokenAddress === this.model.primeTokenAddress ?
        this.primeAmount.sub(this.primeAllowance) : this.wethAmount.sub(this.wethAllowance));
  }
}

interface ILiquidityModel {
  bPool: any,
  poolBalances: Map<Address, BigNumber>;
  connected: boolean;
  crPool: any,
  liquidityJoinPool(poolAmountOut, maxAmountsIn): Promise<void>;
  liquidityJoinswapExternAmountIn(tokenIn, tokenAmountIn, minPoolAmountOut): Promise<void>;
  liquidityExit(bPrimeAmount, minAmountsOut): Promise<void>;
  liquidityExitswapPoolAmountIn(tokenAddress, bPrimeAmount, minTokenAmountOut): Promise<void>;
  liquiditySetTokenAllowance(tokenAddress: Address, amount: BigNumber): Promise<void>;
  remove: boolean; // if falsy then add
  swapfee: BigNumber;
  userBPrimeBalance: BigNumber;
  userPrimeBalance: BigNumber;
  userWethBalance: BigNumber;
  poolUsersBPrimeShare: number;
  poolTotalDenormWeights: Map<string, BigNumber>;
  poolTokenNormWeights: Map<Address, BigNumber>;
  poolTokenAddresses: Array<Address>;
  poolTokenAllowances: Map<Address, BigNumber>;
  poolUsersTokenShare: Map<Address, BigNumber>;
  primeToken: any;
  primeTokenAddress: Address;
  poolTotalBPrimeSupply: BigNumber;
  poolTotalDenormWeight: BigNumber;
  weth: any;
  wethTokenAddress: Address;
  userTokenBalances: Map<Address, BigNumber>;
}

/**
 * random TODO:  handle cases where tokens may not have 18 decimals?
 */
