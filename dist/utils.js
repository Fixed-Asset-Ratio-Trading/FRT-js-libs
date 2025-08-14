"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBasisPoints = toBasisPoints;
exports.fromBasisPoints = fromBasisPoints;
exports.normalizeTokenOrder = normalizeTokenOrder;
exports.deriveSystemStatePDA = deriveSystemStatePDA;
exports.deriveMainTreasuryPDA = deriveMainTreasuryPDA;
exports.derivePoolStatePDA = derivePoolStatePDA;
exports.deriveTokenVaultPDAs = deriveTokenVaultPDAs;
exports.deriveLPTokenMintPDAs = deriveLPTokenMintPDAs;
exports.calculateRequiredLiquidity = calculateRequiredLiquidity;
exports.calculateSwapOutput = calculateSwapOutput;
exports.applySlippage = applySlippage;
exports.parseErrorCode = parseErrorCode;
exports.formatError = formatError;
exports.validateTokenAmount = validateTokenAmount;
exports.encodeMessage = encodeMessage;
exports.keysEqual = keysEqual;
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const constants_1 = require("./constants");
/**
 * Utility functions for Fixed Ratio Trading operations
 */
/**
 * Convert a display amount to basis points (smallest unit)
 * @param amount - The amount in display units (e.g., 1.5 for 1.5 SOL)
 * @param decimals - The number of decimals for the token
 * @returns BN representation in basis points
 */
function toBasisPoints(amount, decimals) {
    const multiplier = Math.pow(10, decimals);
    return new bn_js_1.default(Math.floor(amount * multiplier));
}
/**
 * Convert basis points to display amount
 * @param basisPoints - Amount in basis points
 * @param decimals - Number of decimals for the token
 * @returns Display amount as number
 */
function fromBasisPoints(basisPoints, decimals) {
    const divisor = Math.pow(10, decimals);
    return basisPoints.toNumber() / divisor;
}
/**
 * Normalize token order for consistent PDA derivation
 * @param tokenAMint - First token mint
 * @param tokenBMint - Second token mint
 * @returns Normalized token order [mintA, mintB]
 */
function normalizeTokenOrder(tokenAMint, tokenBMint) {
    return tokenAMint.toBuffer() < tokenBMint.toBuffer()
        ? [tokenAMint, tokenBMint]
        : [tokenBMint, tokenAMint];
}
/**
 * Derive the system state PDA
 * @returns [PublicKey, bump]
 */
function deriveSystemStatePDA() {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(constants_1.SEEDS.SYSTEM_STATE)], constants_1.PROGRAM_ID);
}
/**
 * Derive the main treasury PDA
 * @returns [PublicKey, bump]
 */
function deriveMainTreasuryPDA() {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(constants_1.SEEDS.MAIN_TREASURY)], constants_1.PROGRAM_ID);
}
/**
 * Derive the pool state PDA
 * @param tokenAMint - First token mint
 * @param tokenBMint - Second token mint
 * @param ratioA - Ratio for token A
 * @param ratioB - Ratio for token B
 * @returns [PublicKey, bump]
 */
function derivePoolStatePDA(tokenAMint, tokenBMint, ratioA, ratioB) {
    const [mintA, mintB] = normalizeTokenOrder(tokenAMint, tokenBMint);
    return web3_js_1.PublicKey.findProgramAddressSync([
        Buffer.from(constants_1.SEEDS.POOL_STATE_V2),
        mintA.toBuffer(),
        mintB.toBuffer(),
        ratioA.toArrayLike(Buffer, 'le', 8),
        ratioB.toArrayLike(Buffer, 'le', 8)
    ], constants_1.PROGRAM_ID);
}
/**
 * Derive token vault PDAs for a pool
 * @param poolStatePDA - The pool state PDA
 * @returns Object with vault PDAs
 */
function deriveTokenVaultPDAs(poolStatePDA) {
    return {
        tokenAVault: web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(constants_1.SEEDS.TOKEN_A_VAULT), poolStatePDA.toBuffer()], constants_1.PROGRAM_ID),
        tokenBVault: web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(constants_1.SEEDS.TOKEN_B_VAULT), poolStatePDA.toBuffer()], constants_1.PROGRAM_ID)
    };
}
/**
 * Derive LP token mint PDAs for a pool
 * @param poolStatePDA - The pool state PDA
 * @returns Object with LP token mint PDAs
 */
function deriveLPTokenMintPDAs(poolStatePDA) {
    return {
        lpTokenAMint: web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(constants_1.SEEDS.LP_TOKEN_A_MINT), poolStatePDA.toBuffer()], constants_1.PROGRAM_ID),
        lpTokenBMint: web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(constants_1.SEEDS.LP_TOKEN_B_MINT), poolStatePDA.toBuffer()], constants_1.PROGRAM_ID)
    };
}
/**
 * Calculate the required amount of the other token for liquidity provision
 * @param depositAmount - Amount of the deposit token
 * @param depositTokenRatio - Ratio of the deposit token in the pool
 * @param otherTokenRatio - Ratio of the other token in the pool
 * @returns Required amount of the other token
 */
function calculateRequiredLiquidity(depositAmount, depositTokenRatio, otherTokenRatio) {
    return depositAmount.mul(otherTokenRatio).div(depositTokenRatio);
}
/**
 * Calculate expected output for a swap
 * @param inputAmount - Amount of input tokens
 * @param inputRatio - Ratio of input token in the pool
 * @param outputRatio - Ratio of output token in the pool
 * @returns Expected output amount (before fees)
 */
function calculateSwapOutput(inputAmount, inputRatio, outputRatio) {
    return inputAmount.mul(outputRatio).div(inputRatio);
}
/**
 * Apply slippage tolerance to an expected amount
 * @param expectedAmount - The expected amount
 * @param slippageTolerance - Slippage tolerance as percentage (e.g., 1 for 1%)
 * @returns Minimum acceptable amount
 */
function applySlippage(expectedAmount, slippageTolerance) {
    const tolerance = Math.floor((100 - slippageTolerance) * 100); // Convert to basis points
    return expectedAmount.mul(new bn_js_1.default(tolerance)).div(new bn_js_1.default(10000));
}
/**
 * Parse error code from transaction logs
 * @param logs - Transaction logs
 * @returns Error code or null if not found
 */
function parseErrorCode(logs) {
    for (const log of logs) {
        const match = log.match(/Custom program error: 0x([0-9a-fA-F]+)/);
        if (match) {
            return parseInt(match[1], 16);
        }
    }
    return null;
}
/**
 * Format error message from error code
 * @param errorCode - The error code
 * @returns Human-readable error message
 */
function formatError(errorCode) {
    const errorMap = {
        6006: "System is paused",
        6007: "Pool is paused",
        6008: "Slippage tolerance exceeded",
        6009: "Insufficient balance",
        6010: "Invalid amount",
        6011: "Invalid ratio",
        6012: "Pool already exists",
        6013: "Pool not found",
        6014: "Unauthorized",
        6015: "Invalid token mint",
        6016: "Invalid account",
    };
    return errorMap[errorCode] || `Unknown error code: ${errorCode}`;
}
/**
 * Validate that a token amount is positive and within reasonable bounds
 * @param amount - The amount to validate
 * @param tokenInfo - Token information including decimals
 * @returns True if valid
 */
function validateTokenAmount(amount, tokenInfo) {
    if (amount.lte(new bn_js_1.default(0))) {
        return false;
    }
    // Check for reasonable upper bound (avoid overflow)
    const maxAmount = new bn_js_1.default(10).pow(new bn_js_1.default(tokenInfo.decimals + 9)); // 1B tokens max
    return amount.lt(maxAmount);
}
/**
 * Create a message buffer with length prefix (for donations)
 * @param message - The message string
 * @param maxLength - Maximum message length (default 200)
 * @returns Buffer with length prefix + message
 */
function encodeMessage(message, maxLength = 200) {
    const truncatedMessage = message.slice(0, maxLength);
    const messageBuffer = Buffer.from(truncatedMessage, 'utf8');
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32LE(messageBuffer.length, 0);
    return Buffer.concat([lengthBuffer, messageBuffer]);
}
/**
 * Check if two PublicKeys are equal
 * @param a - First PublicKey
 * @param b - Second PublicKey
 * @returns True if equal
 */
function keysEqual(a, b) {
    return a.toBase58() === b.toBase58();
}
