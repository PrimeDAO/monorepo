// import { BigNumber } from "bignumber.js";
// import { getAddress } from "@ethersproject/address";
// import {
//   bnum,
//   normalizeBalance,
//   denormalizeBalance,
// } from "./helpers/utils";
// import { calcSingleOutGivenPoolIn } from "./helpers/math";
// import { validateNumberInput, formatError } from "./helpers/validation";

// const BALANCE_BUFFER = 0.01;

// export class RemoveLiquidityService {

//   private bPool: any = {}; // bPool from their Pool class
//   private pool: any = {}; // bPool from their subgraph MetaData
//   private poolAmountIn = "";
//   private loading = false;
//   private type = "MULTI_ASSET";
//   private activeToken = this.pool.tokens[0].address;


//   private get poolTokenBalance() {
//     const bptAddress = this.bPool.getBptAddress();
//     const balance = this.web3.balances[getAddress(bptAddress)];
//     return normalizeBalance(balance || "0", 18);
//   }

//   private get totalShares() {
//     const poolAddress = this.bPool.getBptAddress();
//     const poolSupply = this.web3.supplies[poolAddress] || 0;
//     const totalShareNumber = normalizeBalance(poolSupply, 18);
//     return totalShareNumber.toString();
//   }

//   private get userLiquidity() {
//     const poolSharesFrom = this.poolTokenBalance;
//     const totalShares = parseFloat(this.totalShares);
//     const current = poolSharesFrom / totalShares;
//     if (this.validationError) {
//       return {
//         absolute: {
//           current: poolSharesFrom,
//         },
//         relative: {
//           current,
//         },
//       };
//     }

//     const poolTokens = parseFloat(this.poolAmountIn);
//     const future = (poolSharesFrom - poolTokens) / (totalShares - poolTokens);
//     return {
//       absolute: {
//         current: poolSharesFrom,
//         future: poolSharesFrom + poolTokens,
//       },
//       relative: {
//         current,
//         future,
//       },
//     };
//   }

//   private get tokens() {
//     return this.pool.tokens.map(token => {
//       token.myBalance = this.getTokenBalance(token);
//       return token;
//     });
//   }

//   private get validationError() {
//     const amountError = validateNumberInput(this.poolAmountIn);
//     const amountErrorText = formatError(amountError);
//     if (amountErrorText) return amountErrorText;
//     // Amount validation
//     const amount = bnum(this.poolAmountIn);
//     if (amount.gt(this.poolTokenBalance)) {
//       return this.$t("errExceedsBalance");
//     }
//     // Max ratio out validation
//     if (!this.isMultiAsset) {
//       const tokenOutAddress = this.activeToken;
//       const tokenOut = this.pool.tokens.find(
//         token => token.address === tokenOutAddress,
//       );

//       const maxOutRatio = 1 / 3;
//       const amount = denormalizeBalance(this.poolAmountIn, 18);

//       const tokenBalanceOut = denormalizeBalance(
//         tokenOut.balance,
//         tokenOut.decimals,
//       );
//       const tokenWeightOut = bnum(tokenOut.denormWeight).times("1e18");
//       const poolSupply = denormalizeBalance(this.totalShares, 18);
//       const totalWeight = bnum(this.pool.totalWeight).times("1e18");
//       const swapFee = bnum(this.pool.swapFee).times("1e18");

//       if (amount.div(poolSupply).gt(0.99)) {
//         // Invalidate user's attempt to withdraw the entire pool supply in a single token
//         // At amounts close to 100%, solidity math freaks out
//         return this.$t("insufficientLiquidity");
//       }

//       const tokenAmountOut = calcSingleOutGivenPoolIn(
//         tokenBalanceOut,
//         tokenWeightOut,
//         poolSupply,
//         totalWeight,
//         amount,
//         swapFee,
//       );
//       if (tokenAmountOut.div(tokenBalanceOut).gt(maxOutRatio)) {
//         return this.$t("insufficientLiquidity");
//       }
//     }
//     return undefined;
//   }

//   private get slippage() {
//     if (this.validationError) return undefined;
//     if (this.isMultiAsset) return undefined;

//     const tokenOutAddress = this.activeToken;
//     const tokenOut = this.pool.tokens.find(
//       token => token.address === tokenOutAddress,
//     );
//     const amount = bnum(this.poolAmountIn).times("1e18");

//     const tokenBalanceOut = denormalizeBalance(
//       tokenOut.balance,
//       tokenOut.decimals,
//     );
//     const tokenWeightOut = bnum(tokenOut.denormWeight).times("1e18");
//     const poolSupply = denormalizeBalance(this.totalShares, 18);
//     const totalWeight = bnum(this.pool.totalWeight).times("1e18");
//     const swapFee = bnum(this.pool.swapFee).times("1e18");

//     if (amount.div(poolSupply).gt(0.99)) {
//       // Invalidate user's attempt to withdraw the entire pool supply in a single token
//       // At amounts close to 100%, solidity math freaks out
//       return 0;
//     }

//     const tokenAmountOut = calcSingleOutGivenPoolIn(
//       tokenBalanceOut,
//       tokenWeightOut,
//       poolSupply,
//       totalWeight,
//       amount,
//       swapFee,
//     );
//     const expectedTokenAmountOut = amount
//       .times(totalWeight)
//       .times(tokenBalanceOut)
//       .div(poolSupply)
//       .div(tokenWeightOut);
//     return bnum(1).minus(tokenAmountOut.div(expectedTokenAmountOut));
//   }

//   private get isMultiAsset() {
//     return this.type === "MULTI_ASSET";
//   }

//   private async handleSubmit() {
//     this.loading = true;
//     const poolAddress = this.bPool.getBptAddress();
//     if (this.isMultiAsset) {
//       await this.exitPool({
//         poolAddress,
//         poolAmountIn: this.poolAmountIn,
//         minAmountsOut: this.pool.tokensList.map(() => "0"),
//         // FIXME Code below leads to withdrawal issues
//         // minAmountsOut: this.pool.tokensList.map(tokenAddress => {
//         //   const token = this.pool.tokens.find(
//         //     token => token.checksum === tokenAddress
//         //   );
//         //   return denormalizeBalance(
//         //     this.getTokenAmountOut(token),
//         //     token.decimals
//         //   )
//         //     .times(1 - BALANCE_BUFFER)
//         //     .integerValue(BigNumber.ROUND_UP)
//         //     .toString();
//         // })
//       });
//     } else {
//       const tokenOutAddress = this.activeToken;
//       const tokenOut = this.pool.tokens.find(
//         token => token.address === this.activeToken,
//       );
//       const minTokenAmountOut = denormalizeBalance(
//         this.getTokenAmountOut(tokenOut),
//         tokenOut.decimals,
//       )
//         .times(1 - BALANCE_BUFFER)
//         .integerValue(BigNumber.ROUND_UP)
//         .toString();
//       await this.exitswapPoolAmountIn({
//         poolAddress,
//         tokenOutAddress,
//         poolAmountIn: this.poolAmountIn,
//         minTokenAmountOut,
//       });
//     }
//     this.$emit("close");
//     this.$emit("reload");
//     this.loading = false;
//   }
//   private handleSelectType(type) {
//     this.type = type;
//   }

//   private onTokenSelect(token) {
//     this.activeToken = token;
//   }

//   private getTokenBalance(token) {
//     if (!this.poolTokenBalance) return 0;
//     return (this.poolTokenBalance / this.totalShares) * token.balance;
//   }

//   private getTokenAmountOut(token) {
//     if (!this.poolAmountIn || !parseFloat(this.poolAmountIn)) return 0;
//     if (this.isMultiAsset) {
//       return (token.balance / this.totalShares) * this.poolAmountIn;
//     } else {
//       if (this.activeToken !== token.address) {
//         return 0;
//       }
//       const tokenOut = this.pool.tokens.find(
//         token => token.address === this.activeToken,
//       );
//       const amount = denormalizeBalance(this.poolAmountIn, 18);

//       const tokenBalanceOut = denormalizeBalance(
//         tokenOut.balance,
//         tokenOut.decimals,
//       );
//       const tokenWeightOut = bnum(tokenOut.denormWeight).times("1e18");
//       const poolSupply = denormalizeBalance(this.totalShares, 18);
//       const totalWeight = bnum(this.pool.totalWeight).times("1e18");
//       const swapFee = bnum(this.pool.swapFee).times("1e18");

//       const tokenAmountOut = calcSingleOutGivenPoolIn(
//         tokenBalanceOut,
//         tokenWeightOut,
//         poolSupply,
//         totalWeight,
//         amount,
//         swapFee,
//       );
//       const tokenAmountNormalized = normalizeBalance(
//         tokenAmountOut,
//         tokenOut.decimals,
//       );
//       return tokenAmountNormalized.toNumber();
//     }
//   }

//   private setMax() {
//     this.poolAmountIn = this.poolTokenBalance.toString();
//   }
// }
