// import { getAddress } from "@ethersproject/address";
// import BigNumber from "./helpers/bignumber";
// import {
//   calcPoolTokensByRatio,
//   bnum,
//   normalizeBalance,
//   denormalizeBalance,
//   isTxReverted,
//   getTokenBySymbol,
//   liquidityToggleOptions,
//   isLocked,
// } from "./helpers/utils";
// import { calcPoolOutGivenSingleIn } from "./helpers/math";
// import { validateNumberInput, formatError } from "./helpers/validation";

// const BALANCE_BUFFER = 0.01;

// function hasToken(pool, symbol) {
//   const token = getTokenBySymbol(symbol);
//   if (!token) {
//     return false;
//   }
//   const tokenAddress = token.address;
//   return pool.tokensList.includes(tokenAddress);
// }

// export class AddLiquidityService {

//   private bPool: any = {}; // bPool from their Pool class
//   private pool: any = {}; // bPool from their subgraph MetaData
//   private poolTokens = null;
//   private amounts = Object.fromEntries(
//     this.pool.tokens.map(token => {
//       return [token.checksum, ""];
//     }),
//   );
//   private type = "MULTI_ASSET";
//   private activeToken = this.pool.tokens[0].checksum;
//   private checkboxAccept = false;
//   private transactionReverted = false;

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
//     const poolSharesFrom = parseFloat(this.poolTokenBalance);
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

//     const poolTokens = this.poolTokens
//       ? bnum(this.poolTokens)
//         .div("1e18")
//         .toNumber()
//       : 0;
//     const future = (poolSharesFrom + poolTokens) / (totalShares + poolTokens);
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

//   private get tokenError() {
//     if (
//       this.pool.tokens.some(token =>
//         this.config.untrusted.includes(token.checksum),
//       )
//     ) {
//       return this.$t("untrustedTokens");
//     }
//     return undefined;
//   }

//   private get validationError() {
//     if (this.tokenError) {
//       return undefined;
//     }
//     for (const token of this.pool.tokensList) {
//       if (!this.isMultiAsset && this.activeToken !== token) {
//         continue;
//       }
//       const amountError = validateNumberInput(this.amounts[token]);
//       const amountErrorText = formatError(amountError);
//       if (amountErrorText) return amountErrorText;
//     }
//     // Amount validation
//     for (const token of this.pool.tokensList) {
//       if (!this.isMultiAsset && this.activeToken !== token) {
//         continue;
//       }
//       const amount = bnum(this.amounts[token]);
//       const balance = normalizeBalance(
//         this.web3.balances[token],
//         this.web3.tokenMetadata[token].decimals,
//       );
//       if (amount.gt(balance)) {
//         return this.$t("amountExceedsBalance");
//       }
//     }
//     // Max in ratio validation
//     if (!this.isMultiAsset) {
//       const maxInRatio = 1 / 2;
//       const amount = bnum(this.amounts[this.activeToken]);
//       const tokenIn = this.pool.tokens.find(
//         token => token.checksum === this.activeToken,
//       );
//       if (amount.div(tokenIn.balance).gt(maxInRatio)) {
//         return this.$t("insufficientLiquidity");
//       }
//     }
//     return undefined;
//   }

//   private get lockedTokenError() {
//     if (this.tokenError || this.validationError) {
//       return undefined;
//     }
//     for (const token of this.pool.tokens) {
//       const tokenAddress = token.checksum;

//       if (
//         isLocked(
//           this.web3.allowances,
//           tokenAddress,
//           this.web3.dsProxyAddress,
//           this.amounts[tokenAddress],
//           this.web3.tokenMetadata[tokenAddress].decimals,
//         )
//       ) {
//         const displaySymbol =
//             typeof token.symbol === "undefined"
//               ? this._shortenAddress(tokenAddress)
//               : token.symbol;

//         return `${this.$t("unlock")} ${displaySymbol} ${this.$t(
//           "toContinue",
//         )}`;
//       }
//     }
//     return undefined;
//   }

//   private get transferError() {
//     if (this.tokenError || this.validationError || this.lockedTokenError)
//       return undefined;
//     if (!this.transactionReverted) return undefined;
//     if (hasToken(this.pool, "SNX")) {
//       return this.$t("addStakedSNX");
//     }
//     const synths = ["sUSD", "sBTC", "sETH", "sXAU", "sXAG", "sDEFI", "sXMR"];
//     if (synths.some(synth => hasToken(this.pool, synth))) {
//       return this.$t("addSNXUnderwater");
//     }
//     const aTokens = [
//       "aDAI",
//       "aUSDT",
//       "aUSDC",
//       "aSUSD",
//       "aTUSD",
//       "aBUSD",
//       "aBAT",
//       "aETH",
//       "aKNC",
//       "aLEND",
//       "aLINK",
//       "aMANA",
//       "aMKR",
//       "aREP",
//       "aSNX",
//       "aWBTC",
//       "aZRX",
//     ];
//     if (aTokens.some(aToken => hasToken(this.pool, aToken))) {
//       return this.$t("addAAVEUnderwater");
//     }
//     const cTokens = [
//       "cUSDC",
//       "cDAI",
//       "cETH",
//       "cUSDT",
//       "cREP",
//       "cZRX",
//       "cBAT",
//       "cWBTC",
//     ];
//     if (cTokens.some(cToken => hasToken(this.pool, cToken))) {
//       return this.$t("addCompoundUnderwater");
//     }
//     return this.$t("addTransferBlocked");
//   }

//   private get hasCustomToken() {
//     if (this.validationError || this.tokenError) {
//       return false;
//     }
//     for (const token of this.pool.tokens) {
//       const tokenMetadata = this.web3.tokenMetadata[token.checksum];
//       if (!tokenMetadata || !tokenMetadata.whitelisted) {
//         return true;
//       }
//     }
//     return false;
//   }

//   private get rateChangeWarning() {
//     if (this.validationError || this.tokenError) {
//       return false;
//     }
//     if (!this.isMultiAsset) {
//       return false;
//     }
//     const token = this.findFrontrunnableToken;
//     if (!token) {
//       return false;
//     }
//     const frontrunningThreshold = 1 - BALANCE_BUFFER;
//     const address = token.checksum;
//     const amount = bnum(this.amounts[address]);
//     const denormAmount = denormalizeBalance(amount, token.decimals);
//     const balance = this.web3.balances[address];
//     const amountToBalanceRatio = denormAmount.div(balance);
//     return (
//       amountToBalanceRatio.gt(frontrunningThreshold) &&
//         amountToBalanceRatio.lte(1)
//     );
//   }

//   private get slippage() {
//     if (this.validationError || this.tokenError) {
//       return undefined;
//     }
//     if (this.isMultiAsset) {
//       return undefined;
//     }
//     const tokenInAddress = this.activeToken;
//     if (!this.amounts[tokenInAddress]) {
//       return undefined;
//     }
//     const tokenIn = this.pool.tokens.find(
//       token => token.checksum === tokenInAddress,
//     );
//     const amount = bnum(this.amounts[tokenInAddress]);

//     const tokenBalanceIn = denormalizeBalance(
//       tokenIn.balance,
//       tokenIn.decimals,
//     );
//     const tokenWeightIn = bnum(tokenIn.denormWeight).times("1e18");
//     const poolSupply = denormalizeBalance(this.totalShares, 18);
//     const totalWeight = bnum(this.pool.totalWeight).times("1e18");
//     const tokenAmountIn = denormalizeBalance(
//       amount,
//       tokenIn.decimals,
//     ).integerValue(BigNumber.ROUND_UP);
//     const swapFee = bnum(this.pool.swapFee).times("1e18");

//     const poolAmountOut = calcPoolOutGivenSingleIn(
//       tokenBalanceIn,
//       tokenWeightIn,
//       poolSupply,
//       totalWeight,
//       tokenAmountIn,
//       swapFee,
//     );
//     const expectedPoolAmountOut = tokenAmountIn
//       .times(tokenWeightIn)
//       .times(poolSupply)
//       .div(tokenBalanceIn)
//       .div(totalWeight);
//     return bnum(1).minus(poolAmountOut.div(expectedPoolAmountOut));
//   }

//   private get findFrontrunnableToken() {
//     if (this.validationError) {
//       return;
//     }
//     let maxAmountToBalanceRatio = bnum(0);
//     let maxRatioToken = undefined;
//     for (const token of this.pool.tokens) {
//       const address = token.checksum;
//       const amount = bnum(this.amounts[address]);
//       const denormAmount = denormalizeBalance(amount, token.decimals);
//       const balance = this.web3.balances[address];
//       const amountToBalanceRatio = denormAmount.div(balance);
//       if (amountToBalanceRatio.gt(maxAmountToBalanceRatio)) {
//         maxAmountToBalanceRatio = amountToBalanceRatio;
//         maxRatioToken = token;
//       }
//     }
//     return maxRatioToken;
//   }

//   private get isMultiAsset() {
//     return this.type === "MULTI_ASSET";
//   }


//   private handleChange(changedAmount, changedToken) {
//     const ratio = bnum(changedAmount).div(changedToken.balance);
//     if (this.isMultiAsset) {
//       this.poolTokens = calcPoolTokensByRatio(ratio, this.totalShares);
//     } else {
//       const tokenIn = this.pool.tokens.find(
//         token => token.checksum === this.activeToken,
//       );
//       const amount = new BigNumber(this.amounts[tokenIn.checksum]);

//       const maxInRatio = 1 / 2;
//       if (amount.div(tokenIn.balance).gt(maxInRatio)) {
//         return;
//       }

//       const tokenBalanceIn = denormalizeBalance(
//         tokenIn.balance,
//         tokenIn.decimals,
//       );
//       const tokenWeightIn = bnum(tokenIn.denormWeight).times("1e18");
//       const poolSupply = denormalizeBalance(this.totalShares, 18);
//       const totalWeight = bnum(this.pool.totalWeight).times("1e18");
//       const tokenAmountIn = denormalizeBalance(
//         amount,
//         tokenIn.decimals,
//       ).integerValue(BigNumber.ROUND_UP);
//       const swapFee = bnum(this.pool.swapFee).times("1e18");

//       this.poolTokens = calcPoolOutGivenSingleIn(
//         tokenBalanceIn,
//         tokenWeightIn,
//         poolSupply,
//         totalWeight,
//         tokenAmountIn,
//         swapFee,
//       ).toString();
//     }

//     this.pool.tokens.forEach(token => {
//       if (!this.isMultiAsset) {
//         return;
//       }
//       if (token.checksum === changedToken.checksum) {
//         return;
//       }
//       this.amounts[token.checksum] = ratio.isNaN()
//         ? ""
//         : ratio.times(token.balance).toString();
//     });
//   }

//   private handleMax(token) {
//     const balance = this.web3.balances[token.checksum];
//     const amount = normalizeBalance(balance, token.decimals);
//     this.amounts[token.checksum] = amount.toString();
//     this.handleTokenSelect(token.checksum);
//     this.handleChange(amount, token);
//   }

//   private lowerAmounts() {
//     const frontrunningThreshold = 1 - BALANCE_BUFFER;
//     const token = this.findFrontrunnableToken;
//     const address = token.checksum;
//     const balance = this.web3.balances[address];
//     const safeAmount = bnum(balance).times(frontrunningThreshold);
//     const normalizedAmount = normalizeBalance(safeAmount, token.decimals);
//     this.amounts[token.checksum] = normalizedAmount.toString();
//     this.handleChange(normalizedAmount, token);
//   }

//   private handleSelectType(type) {
//     this.type = type;
//     this.poolTokens = null;
//     this.amounts = Object.fromEntries(
//       this.pool.tokens.map(token => {
//         return [token.checksum, ""];
//       }),
//     );
//   }

//   private handleTokenSelect(token) {
//     this.activeToken = token;
//   }

//   private async handleSubmit() {
//     this.loading = true;
//     const poolAddress = this.bPool.getBptAddress();
//     if (this.isMultiAsset) {
//       const params = {
//         poolAddress,
//         poolAmountOut: this.poolTokens,
//         maxAmountsIn: this.pool.tokensList.map(tokenAddress => {
//           const token = this.pool.tokens.find(
//             token => token.checksum === tokenAddress,
//           );
//           const amount = bnum(this.amounts[token.checksum]);
//           const inputAmountIn = denormalizeBalance(amount, token.decimals)
//             .div(1 - BALANCE_BUFFER)
//             .integerValue(BigNumber.ROUND_UP);
//           const balanceAmountIn = bnum(this.web3.balances[token.checksum]);
//           const tokenAmountIn = BigNumber.min(inputAmountIn, balanceAmountIn);
//           return tokenAmountIn.toString();
//         }),
//         isCrp: this.bPool.isCrp(),
//       };
//       const txResult = await this.joinPool(params);
//       if (isTxReverted(txResult)) this.transactionReverted = true;
//     } else {
//       const tokenIn = this.pool.tokens.find(
//         token => token.checksum === this.activeToken,
//       );
//       const tokenAmountIn = denormalizeBalance(
//         this.amounts[tokenIn.checksum],
//         tokenIn.decimals,
//       )
//         .integerValue(BigNumber.ROUND_UP)
//         .toString();
//       const minPoolAmountOut = bnum(this.poolTokens)
//         .times(1 - BALANCE_BUFFER)
//         .integerValue(BigNumber.ROUND_UP)
//         .toString();
//       const params = {
//         poolAddress,
//         tokenInAddress: this.activeToken,
//         tokenAmountIn,
//         minPoolAmountOut,
//       };
//       await this.joinswapExternAmountIn(params);
//     }
//     this.$emit("close");
//     this.$emit("reload");
//     this.loading = false;
//   }

//   private isInputValid(token) {
//     const tokenAddress = token.checksum;
//     if (!this.isMultiAsset && this.activeToken !== tokenAddress) {
//       return true;
//     }
//     const amount = this.amounts[tokenAddress];
//     if (!amount || isNaN(amount)) {
//       return false;
//     }
//     const amountNumber = denormalizeBalance(amount, token.decimals);
//     const balance = this.web3.balances[tokenAddress];
//     return amountNumber.lte(balance);
//   }

//   private formatBalance(balanceString, tokenDecimals) {
//     return normalizeBalance(balanceString, tokenDecimals);
//   }
// }
