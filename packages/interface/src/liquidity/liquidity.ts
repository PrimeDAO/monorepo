import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, customElement, singleton, computedFrom } from "aurelia-framework";
import { BigNumber } from "ethers";
import { toBigNumberJs } from "services/BalancerPoolLiquidity/helpers/bignumber";
import { calcPoolOutGivenSingleIn, calcSingleOutGivenPoolIn } from "services/BalancerPoolLiquidity/helpers/math";
import { bnum, calcPoolTokensByRatio } from "services/BalancerPoolLiquidity/helpers/utils";
import { Address } from "services/EthereumService";
import "./liquidity.scss";
import BigNumberJs from "services/BalancerPoolLiquidity/helpers/bignumber";

const BALANCE_BUFFER = 0.01;

@singleton(false)
@customElement("liquidity")
@autoinject
export class Liquidity {

  private model: ILiquidityModel;
  private defaultPrimeAmount: BigNumber | string;
  private defaultBPrimeAmount: BigNumber | string;
  private defaultWethAmount: BigNumber | string;
  private primeWeight: BigNumber;
  private wethWeight: BigNumber;
  private amounts = new Map<Address, BigNumber>();
  private poolTokens: any;
  private _primeAmount: BigNumber;
  private _wethAmount: BigNumber;
  private bPrimeAmount: BigNumber;

  constructor(
    private eventAggregator: EventAggregator) {}

  @computedFrom("wethAmount", "primeAmount")
  private get activeSingleTokenAddress(): Address {
    if (!this.isMultiAsset) {
      return (this.wethAmount && !this.wethAmount.isZero()) ?
        this.model.wethTokenAddress :
        (this.primeAmount && !this.primeAmount.isZero()) ? this.model.primeTokenAddress : null;
    } else {
      return null;
    }
  }

  @computedFrom("wethAmount", "primeAmount")
  private get activeSingleTokenAmount(): BigNumber {
    if (!this.isMultiAsset) {
      return (this.wethAmount && !this.wethAmount.isZero()) ?
        this.wethAmount :
        (this.primeAmount && !this.primeAmount.isZero()) ? this.primeAmount : null;
    } else {
      return null;
    }
  }

  /**
   * true if two non-zero assets are entered
   */
  @computedFrom("wethAmount", "primeAmount")
  private get isMultiAsset(): boolean {
    return (this.wethAmount && !this.wethAmount.isZero()) &&
      (this.primeAmount && !this.primeAmount.isZero());
  }

  /**
   * true if exactly one non-zero asset is entered
   */
  @computedFrom("wethAmount", "primeAmount")
  private get isSingleAsset(): boolean {
    return (this.wethAmount && !this.wethAmount.isZero() && (!this.primeAmount || this.primeAmount.isZero())) ||
      (this.primeAmount && !this.primeAmount.isZero() && (!this.wethAmount || this.wethAmount.isZero()));
  }

  private get primeAmount(): BigNumber {
    return this._primeAmount;
  }

  private set primeAmount(newValue: BigNumber) {
    this._primeAmount = newValue;
    this.amountChanged(
      this.primeAmount,
      this.model.primeTokenAddress,
      this.primeWeight);
  }

  private get wethAmount(): BigNumber {
    return this._wethAmount;
  }

  private set wethAmount(newValue: BigNumber) {
    this._wethAmount = newValue;
    this.amountChanged(
      this.wethAmount,
      this.model.wethTokenAddress,
      this.wethWeight);
  }

  private async amountChanged(
    amount: BigNumber,
    tokenAddress: Address,
    tokenWeight: BigNumber,
  ) {

    if (this.model.remove) {
      /**
       * enforce that only one token has a non-zero value, ie, cannot be multiasset.
       */
      if (this.isMultiAsset) {
        if (tokenAddress === this.model.primeTokenAddress) {
          this.defaultWethAmount = BigNumber.from(0);
        } else {
          this.defaultPrimeAmount = BigNumber.from(0);
        }
      }
    } else {
      const poolTokenBalance = toBigNumberJs(this.model.bPoolBalances.get(tokenAddress));
      // const prevAmount = toBigNumberJs(this.amounts[tokenAddress]).integerValue(BigNumberJs.ROUND_UP);
      const bnAmount = toBigNumberJs(amount).integerValue(BigNumberJs.ROUND_UP);
      const ratio = toBigNumberJs(amount).div(poolTokenBalance);
      const poolTotalSupply = toBigNumberJs(await this.model.bPool.totalSupply());

      if (this.isMultiAsset) {
        this.poolTokens = calcPoolTokensByRatio(
          toBigNumberJs(ratio),
          toBigNumberJs(poolTotalSupply));
      } else {
        const totalWeight = await this.model.bPool.getTotalDenormalizedWeight();
        const maxInRatio = 1 / 2;
        if (bnAmount.div(poolTokenBalance).gt(maxInRatio)) {
          return;
        }

        this.poolTokens = await calcPoolOutGivenSingleIn(
          poolTokenBalance, // tokenBalanceIn
          toBigNumberJs(tokenWeight), // tokenWeightIn
          poolTotalSupply, // poolSupply
          totalWeight, // totalWeight
          bnAmount, // tokenAmountIn
          toBigNumberJs(this.model.swapfee))
          .toString(); // swapFee
      }

      if (this.isMultiAsset) {
        this.model.poolTokenAddresses.map(tokenAddr => {
          if (tokenAddr !== tokenAddress) {
            this.amounts.set(tokenAddr,
              ratio.isNaN() ? "" : ratio.times(toBigNumberJs(this.model.bPoolBalances[tokenAddr])) as any);
          }
        });
      }
    }
  }

  public activate(_model: unknown, routeConfig: { settings: { state: ILiquidityModel }}): void {
    this.model = routeConfig.settings.state;
    /**
     * hack alert: until we have something more dynamic...
     */
    if (this?.model?.poolTokenWeights) {
      this.primeWeight = this.model.poolTokenWeights.get("PRIME");
      this.wethWeight = this.model.poolTokenWeights.get("WETH");
    }
  }

  private valid(): boolean {
    if (this.model.remove) {

      if (this.isSingleAsset) {
        if (this.activeSingleTokenAmount.gt(this.model.bPoolBalances.get(this.activeSingleTokenAddress))) {
          this.eventAggregator.publish("handleValidationError", "Can't remove this amount because it exceeds the amount in the pool");
          return false;
        }
      }

    } else {
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

  private async getRemoveTokenAmountOut(
    poolAmountIn: BigNumber,
    tokenAddress: Address): Promise<BigNumberJs> {

    if (!parseFloat(poolAmountIn?.toString())) return new BigNumberJs(0);

    const tokenBalanceOut = toBigNumberJs(this.model.bPoolBalances.get(tokenAddress));
    const tokenWeightOut = await this.model.bPool.getDenormalizedWeight(tokenAddress);
    const poolSupply = toBigNumberJs(await this.model.bPool.totalSupply());
    const totalWeight = await this.model.bPool.getTotalDenormalizedWeight();
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
            const inputAmountIn = toBigNumberJs(this.amounts[tokenAddress])
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

        const tokenAmountIn = toBigNumberJs(this.amounts[tokenIn])
          .integerValue(BigNumberJs.ROUND_UP)
          .toString();

        const minPoolAmountOut = toBigNumberJs(this.poolTokens)
          .times(1 - BALANCE_BUFFER)
          .integerValue(BigNumberJs.ROUND_UP)
          .toString();

        this.model.liquidityJoinswapExternAmountIn(minPoolAmountOut, tokenAmountIn);
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
}

interface ILiquidityModel {
  bPool: any;
  bPoolAddress: Address;
  bPoolBalances: Map<Address, BigNumber>;
  connected: boolean;
  crPool: any,
  liquidityJoinPool(poolAmountOut, maxAmountsIn): Promise<void>;
  liquidityJoinswapExternAmountIn(minPoolAmountOut, tokenAmountIn): Promise<void>;
  liquidityExit(poolAmountIn, minAmountsOut): Promise<void>;
  liquidityExitswapPoolAmountIn(tokenAddress, poolAmountIn, minTokenAmountOut): Promise<void>;
  poolshare: BigNumber;
  remove: boolean; // if falsy then add
  swapfee: BigNumber;
  userBPrimeBalance: BigNumber;
  userPrimeBalance: BigNumber;
  userWethBalance: BigNumber;
  poolTokenWeights: Map<string, BigNumber>;
  poolTokenAddresses: Array<Address>;
  primeToken: any;
  primeTokenAddress: Address;
  weth: any;
  wethTokenAddress: Address;
  userTokenBalances: Map<Address, BigNumber>;
}

/**
 * random TODO:  handle cases where tokens may not have 18 decimals?
 */
