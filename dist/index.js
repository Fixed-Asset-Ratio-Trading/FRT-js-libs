"use strict";
/**
 * Fixed Ratio Trading JavaScript Library
 *
 * A comprehensive JavaScript/TypeScript library for interacting with the Fixed Ratio Trading
 * protocol on Solana. This library provides functions that can be used by any user without
 * requiring program upgrade authority.
 *
 * @author Fixed Ratio Trading Team
 * @version 1.0.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixedRatioTradingClient = exports.PROGRAM_VERSION = exports.VERSION = exports.BN = exports.createTransferInstruction = exports.createMintToInstruction = exports.getAssociatedTokenAddress = exports.createAssociatedTokenAccountInstruction = exports.TOKEN_PROGRAM_ID = exports.LAMPORTS_PER_SOL = exports.sendAndConfirmTransaction = exports.Keypair = exports.TransactionInstruction = exports.Transaction = exports.Connection = exports.PublicKey = void 0;
// Export constants
__exportStar(require("./constants"), exports);
// Export types
__exportStar(require("./types"), exports);
// Export utilities
__exportStar(require("./utils"), exports);
// Export instruction builders
__exportStar(require("./instructions/public"), exports);
__exportStar(require("./instructions/pool"), exports);
__exportStar(require("./instructions/liquidity"), exports);
__exportStar(require("./instructions/swap"), exports);
__exportStar(require("./instructions/treasury"), exports);
// Re-export commonly used Solana types for convenience
var web3_js_1 = require("@solana/web3.js");
Object.defineProperty(exports, "PublicKey", { enumerable: true, get: function () { return web3_js_1.PublicKey; } });
Object.defineProperty(exports, "Connection", { enumerable: true, get: function () { return web3_js_1.Connection; } });
Object.defineProperty(exports, "Transaction", { enumerable: true, get: function () { return web3_js_1.Transaction; } });
Object.defineProperty(exports, "TransactionInstruction", { enumerable: true, get: function () { return web3_js_1.TransactionInstruction; } });
Object.defineProperty(exports, "Keypair", { enumerable: true, get: function () { return web3_js_1.Keypair; } });
Object.defineProperty(exports, "sendAndConfirmTransaction", { enumerable: true, get: function () { return web3_js_1.sendAndConfirmTransaction; } });
Object.defineProperty(exports, "LAMPORTS_PER_SOL", { enumerable: true, get: function () { return web3_js_1.LAMPORTS_PER_SOL; } });
var spl_token_1 = require("@solana/spl-token");
Object.defineProperty(exports, "TOKEN_PROGRAM_ID", { enumerable: true, get: function () { return spl_token_1.TOKEN_PROGRAM_ID; } });
Object.defineProperty(exports, "createAssociatedTokenAccountInstruction", { enumerable: true, get: function () { return spl_token_1.createAssociatedTokenAccountInstruction; } });
Object.defineProperty(exports, "getAssociatedTokenAddress", { enumerable: true, get: function () { return spl_token_1.getAssociatedTokenAddress; } });
Object.defineProperty(exports, "createMintToInstruction", { enumerable: true, get: function () { return spl_token_1.createMintToInstruction; } });
Object.defineProperty(exports, "createTransferInstruction", { enumerable: true, get: function () { return spl_token_1.createTransferInstruction; } });
var bn_js_1 = require("bn.js");
Object.defineProperty(exports, "BN", { enumerable: true, get: function () { return __importDefault(bn_js_1).default; } });
// Export version information
exports.VERSION = '1.0.0';
exports.PROGRAM_VERSION = '0.14.1040';
/**
 * Main client class for Fixed Ratio Trading operations
 */
class FixedRatioTradingClient {
    constructor(connection, programId = constants_1.PROGRAM_ID) {
        this.connection = connection;
        this.programId = programId;
    }
    // Public functions
    async getContractVersion() {
        return (0, public_1.getContractVersion)(this.connection);
    }
    async getTreasuryInfo() {
        return (0, public_1.getTreasuryInfo)(this.connection);
    }
    // Pool management
    createInitializePoolInstruction(params) {
        return (0, pool_1.createInitializePoolInstruction)(params);
    }
    createPoolWithDisplayAmounts(userAuthority, tokenAMint, tokenBMint, tokenAAmount, tokenBAmount, tokenADecimals, tokenBDecimals) {
        return (0, pool_1.createPoolWithDisplayAmounts)(userAuthority, tokenAMint, tokenBMint, tokenAAmount, tokenBAmount, tokenADecimals, tokenBDecimals);
    }
    getPoolPDAs(tokenAMint, tokenBMint, ratioA, ratioB) {
        return (0, pool_1.getPoolPDAs)(tokenAMint, tokenBMint, ratioA, ratioB);
    }
    async doesPoolExist(poolStatePDA) {
        return (0, pool_1.doesPoolExist)(this.connection, poolStatePDA);
    }
    // Liquidity operations
    createDepositInstruction(params) {
        return (0, liquidity_1.createDepositInstruction)(params);
    }
    createWithdrawInstruction(poolStatePDA, withdrawAmount, withdrawTokenMint, userAuthority, userLpAccount, userTokenAccount) {
        return (0, liquidity_1.createWithdrawInstruction)(poolStatePDA, withdrawAmount, withdrawTokenMint, userAuthority, userLpAccount, userTokenAccount);
    }
    calculateDepositAmounts(depositAmount, depositTokenMint, poolRatioA, poolRatioB, tokenAMint) {
        return (0, liquidity_1.calculateDepositAmounts)(depositAmount, depositTokenMint, poolRatioA, poolRatioB, tokenAMint);
    }
    // Swap operations
    createSwapInstruction(params) {
        return (0, swap_1.createSwapInstruction)(params);
    }
    calculateExpectedSwapOutput(amountIn, inputTokenMint, poolRatioA, poolRatioB, tokenAMint) {
        return (0, swap_1.calculateExpectedSwapOutput)(amountIn, inputTokenMint, poolRatioA, poolRatioB, tokenAMint);
    }
    calculateSwapWithPriceImpact(amountIn, inputTokenMint, poolBalanceA, poolBalanceB, tokenAMint) {
        return (0, swap_1.calculateSwapWithPriceImpact)(amountIn, inputTokenMint, poolBalanceA, poolBalanceB, tokenAMint);
    }
    async isPoolPublicSwapEnabled(poolStatePDA) {
        return (0, swap_1.isPoolPublicSwapEnabled)(this.connection, poolStatePDA);
    }
    // Treasury operations
    createDonateSolInstruction(params) {
        return (0, treasury_1.createDonateSolInstruction)(params);
    }
    createConsolidatePoolFeesInstruction(poolStatePDAs) {
        return (0, treasury_1.createConsolidatePoolFeesInstruction)(poolStatePDAs);
    }
    createDonationInstructionWithDisplayAmount(donor, amountSOL, message) {
        return (0, treasury_1.createDonationInstructionWithDisplayAmount)(donor, amountSOL, message);
    }
    // Utility functions
    toBasisPoints(amount, decimals) {
        return (0, utils_1.toBasisPoints)(amount, decimals);
    }
    fromBasisPoints(basisPoints, decimals) {
        return (0, utils_1.fromBasisPoints)(basisPoints, decimals);
    }
    parseErrorCode(logs) {
        return (0, utils_1.parseErrorCode)(logs);
    }
    formatError(errorCode) {
        return (0, utils_1.formatError)(errorCode);
    }
}
exports.FixedRatioTradingClient = FixedRatioTradingClient;
// Import individual functions for re-export
const constants_1 = require("./constants");
const public_1 = require("./instructions/public");
const pool_1 = require("./instructions/pool");
const liquidity_1 = require("./instructions/liquidity");
const swap_1 = require("./instructions/swap");
const treasury_1 = require("./instructions/treasury");
const utils_1 = require("./utils");
