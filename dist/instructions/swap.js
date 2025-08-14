"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSwapInstruction = createSwapInstruction;
exports.calculateExpectedSwapOutput = calculateExpectedSwapOutput;
exports.calculateSwapWithPriceImpact = calculateSwapWithPriceImpact;
exports.getMinAmountOut = getMinAmountOut;
exports.validateSwapParams = validateSwapParams;
exports.getSwapFee = getSwapFee;
exports.createSwapInstructionWithDisplayAmounts = createSwapInstructionWithDisplayAmounts;
exports.estimateSwapOutputDisplay = estimateSwapOutputDisplay;
exports.isPoolPublicSwapEnabled = isPoolPublicSwapEnabled;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const bn_js_1 = __importDefault(require("bn.js"));
const constants_1 = require("../constants");
const utils_1 = require("../utils");
/**
 * Swap operations for users (unless pool is in owner-only mode)
 */
/**
 * Create an instruction to execute a swap
 * Authority: Any user (unless owner-only mode is enabled for the pool)
 * Fee: 0.00002715 SOL swap fee
 * @param params - Swap parameters
 * @returns TransactionInstruction
 */
function createSwapInstruction(params) {
    const { poolStatePDA, amountIn, expectedAmountOut, inputTokenMint, userAuthority, userInputAccount, userOutputAccount, } = params;
    // Derive required PDAs
    const [systemStatePDA] = (0, utils_1.deriveSystemStatePDA)();
    const [mainTreasuryPDA] = (0, utils_1.deriveMainTreasuryPDA)();
    // Apply slippage tolerance if provided
    const slippageTolerance = params.slippageTolerance || 1; // Default 1%
    const minAmountOut = (0, utils_1.applySlippage)(expectedAmountOut, slippageTolerance);
    // Serialize instruction data
    const instructionData = Buffer.concat([
        Buffer.from([constants_1.PoolInstruction.Swap]),
        inputTokenMint.toBuffer(),
        amountIn.toArrayLike(Buffer, 'le', 8),
        minAmountOut.toArrayLike(Buffer, 'le', 8) // Use min amount out for slippage protection
    ]);
    return new web3_js_1.TransactionInstruction({
        keys: [
            { pubkey: userAuthority, isSigner: true, isWritable: true },
            { pubkey: systemStatePDA, isSigner: false, isWritable: false },
            { pubkey: poolStatePDA, isSigner: false, isWritable: true },
            { pubkey: userInputAccount, isSigner: false, isWritable: true },
            { pubkey: userOutputAccount, isSigner: false, isWritable: true },
            // Pool token vaults are derived by the program based on input/output tokens
            { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: mainTreasuryPDA, isSigner: false, isWritable: true },
            { pubkey: inputTokenMint, isSigner: false, isWritable: false },
        ],
        programId: constants_1.PROGRAM_ID,
        data: instructionData,
    });
}
/**
 * Calculate expected swap output
 * @param amountIn - Input amount
 * @param inputTokenMint - Input token mint
 * @param poolRatioA - Pool ratio for token A
 * @param poolRatioB - Pool ratio for token B
 * @param tokenAMint - Token A mint
 * @returns Expected output amount (before fees)
 */
function calculateExpectedSwapOutput(amountIn, inputTokenMint, poolRatioA, poolRatioB, tokenAMint) {
    const isInputTokenA = inputTokenMint.equals(tokenAMint);
    if (isInputTokenA) {
        // Swapping A for B
        return (0, utils_1.calculateSwapOutput)(amountIn, poolRatioA, poolRatioB);
    }
    else {
        // Swapping B for A
        return (0, utils_1.calculateSwapOutput)(amountIn, poolRatioB, poolRatioA);
    }
}
/**
 * Calculate swap with price impact
 * @param amountIn - Input amount
 * @param inputTokenMint - Input token mint
 * @param poolBalanceA - Current balance of token A in pool
 * @param poolBalanceB - Current balance of token B in pool
 * @param tokenAMint - Token A mint
 * @returns Swap result with price impact
 */
function calculateSwapWithPriceImpact(amountIn, inputTokenMint, poolBalanceA, poolBalanceB, tokenAMint) {
    const isInputTokenA = inputTokenMint.equals(tokenAMint);
    let amountOut;
    let priceImpact;
    if (isInputTokenA) {
        // Swapping A for B
        // In fixed ratio, price impact is minimal since ratios are maintained
        amountOut = amountIn.mul(poolBalanceB).div(poolBalanceA);
        // Calculate price impact (simplified for fixed ratio)
        const idealPrice = poolBalanceB.toNumber() / poolBalanceA.toNumber();
        const actualPrice = amountOut.toNumber() / amountIn.toNumber();
        priceImpact = Math.abs((actualPrice - idealPrice) / idealPrice) * 100;
    }
    else {
        // Swapping B for A
        amountOut = amountIn.mul(poolBalanceA).div(poolBalanceB);
        const idealPrice = poolBalanceA.toNumber() / poolBalanceB.toNumber();
        const actualPrice = amountOut.toNumber() / amountIn.toNumber();
        priceImpact = Math.abs((actualPrice - idealPrice) / idealPrice) * 100;
    }
    const fees = new bn_js_1.default(27150); // 0.00002715 SOL
    return {
        amountIn,
        amountOut,
        priceImpact,
        fees,
    };
}
/**
 * Get the minimum amount out with slippage protection
 * @param expectedAmountOut - Expected output amount
 * @param slippageTolerance - Slippage tolerance percentage (e.g., 1 for 1%)
 * @returns Minimum acceptable output amount
 */
function getMinAmountOut(expectedAmountOut, slippageTolerance) {
    return (0, utils_1.applySlippage)(expectedAmountOut, slippageTolerance);
}
/**
 * Validate swap parameters
 * @param params - Swap parameters
 * @returns Validation result
 */
function validateSwapParams(params) {
    const errors = [];
    if (params.amountIn.lte(new bn_js_1.default(0))) {
        errors.push("Input amount must be positive");
    }
    if (params.expectedAmountOut.lte(new bn_js_1.default(0))) {
        errors.push("Expected output amount must be positive");
    }
    if (params.slippageTolerance !== undefined) {
        if (params.slippageTolerance < 0 || params.slippageTolerance > 50) {
            errors.push("Slippage tolerance must be between 0 and 50 percent");
        }
    }
    // Check for reasonable swap size (avoid overflow)
    const maxSwap = new bn_js_1.default(10).pow(new bn_js_1.default(15)); // 10^15 max
    if (params.amountIn.gte(maxSwap)) {
        errors.push("Swap amount too large");
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
/**
 * Calculate swap fee in SOL
 * @returns Swap fee in lamports
 */
function getSwapFee() {
    return new bn_js_1.default(27150); // 0.00002715 SOL
}
/**
 * Helper to create swap instruction with display amounts
 * @param poolStatePDA - Pool state PDA
 * @param amountInDisplay - Input amount in display units
 * @param expectedAmountOutDisplay - Expected output in display units
 * @param inputTokenDecimals - Decimals for input token
 * @param outputTokenDecimals - Decimals for output token
 * @param inputTokenMint - Input token mint
 * @param userAuthority - User authority
 * @param userInputAccount - User's input token account
 * @param userOutputAccount - User's output token account
 * @param slippageTolerance - Slippage tolerance percentage
 * @returns TransactionInstruction
 */
function createSwapInstructionWithDisplayAmounts(poolStatePDA, amountInDisplay, expectedAmountOutDisplay, inputTokenDecimals, outputTokenDecimals, inputTokenMint, userAuthority, userInputAccount, userOutputAccount, slippageTolerance = 1) {
    const amountIn = new bn_js_1.default(amountInDisplay * Math.pow(10, inputTokenDecimals));
    const expectedAmountOut = new bn_js_1.default(expectedAmountOutDisplay * Math.pow(10, outputTokenDecimals));
    return createSwapInstruction({
        poolStatePDA,
        amountIn,
        expectedAmountOut,
        inputTokenMint,
        userAuthority,
        userInputAccount,
        userOutputAccount,
        slippageTolerance,
    });
}
/**
 * Estimate swap output with display amounts
 * @param amountInDisplay - Input amount in display units
 * @param inputTokenDecimals - Input token decimals
 * @param outputTokenDecimals - Output token decimals
 * @param poolRatioA - Pool ratio A
 * @param poolRatioB - Pool ratio B
 * @param isInputTokenA - Whether input token is token A
 * @returns Output amount in display units
 */
function estimateSwapOutputDisplay(amountInDisplay, inputTokenDecimals, outputTokenDecimals, poolRatioA, poolRatioB, isInputTokenA) {
    const amountIn = new bn_js_1.default(amountInDisplay * Math.pow(10, inputTokenDecimals));
    let amountOut;
    if (isInputTokenA) {
        amountOut = (0, utils_1.calculateSwapOutput)(amountIn, poolRatioA, poolRatioB);
    }
    else {
        amountOut = (0, utils_1.calculateSwapOutput)(amountIn, poolRatioB, poolRatioA);
    }
    return amountOut.toNumber() / Math.pow(10, outputTokenDecimals);
}
/**
 * Check if a pool allows public swaps or is in owner-only mode
 * Note: This would require reading the pool state account
 * @param connection - Solana connection
 * @param poolStatePDA - Pool state PDA
 * @returns Promise<boolean> - True if public swaps are allowed
 */
async function isPoolPublicSwapEnabled(connection, // Using any to avoid circular import
poolStatePDA) {
    try {
        const accountInfo = await connection.getAccountInfo(poolStatePDA);
        if (!accountInfo || !accountInfo.data) {
            throw new Error("Pool not found");
        }
        // Parse pool state to check if owner-only mode is enabled
        // This would require knowledge of the pool state structure
        // For now, return true (assuming public swaps are enabled)
        // In a real implementation, you'd parse the account data
        return true;
    }
    catch (error) {
        throw new Error(`Failed to check pool swap mode: ${error}`);
    }
}
