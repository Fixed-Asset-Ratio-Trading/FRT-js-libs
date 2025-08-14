"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDepositInstruction = createDepositInstruction;
exports.createWithdrawInstruction = createWithdrawInstruction;
exports.calculateDepositAmounts = calculateDepositAmounts;
exports.estimateLPTokensFromDeposit = estimateLPTokensFromDeposit;
exports.estimateTokensFromWithdraw = estimateTokensFromWithdraw;
exports.validateDepositParams = validateDepositParams;
exports.validateWithdrawParams = validateWithdrawParams;
exports.getDepositFee = getDepositFee;
exports.getWithdrawalFee = getWithdrawalFee;
exports.createDepositInstructionWithDisplayAmount = createDepositInstructionWithDisplayAmount;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const bn_js_1 = __importDefault(require("bn.js"));
const constants_1 = require("../constants");
const utils_1 = require("../utils");
/**
 * Liquidity operations - deposit and withdraw functions for users
 */
/**
 * Create an instruction to deposit liquidity into a pool
 * Authority: Any user
 * Fee: 0.0013 SOL deposit fee
 * @param params - Liquidity deposit parameters
 * @returns TransactionInstruction
 */
function createDepositInstruction(params) {
    const { poolStatePDA, depositAmount, depositTokenMint, userAuthority, userTokenAccount, userLpAccount, } = params;
    // Derive required PDAs
    const [systemStatePDA] = (0, utils_1.deriveSystemStatePDA)();
    const [mainTreasuryPDA] = (0, utils_1.deriveMainTreasuryPDA)();
    // Serialize instruction data
    const instructionData = Buffer.concat([
        Buffer.from([constants_1.PoolInstruction.Deposit]),
        depositTokenMint.toBuffer(),
        depositAmount.toArrayLike(Buffer, 'le', 8)
    ]);
    return new web3_js_1.TransactionInstruction({
        keys: [
            { pubkey: userAuthority, isSigner: true, isWritable: true },
            { pubkey: systemStatePDA, isSigner: false, isWritable: false },
            { pubkey: poolStatePDA, isSigner: false, isWritable: true },
            { pubkey: userTokenAccount, isSigner: false, isWritable: true },
            // Note: Pool token vaults and LP token accounts are derived by the program
            // based on the deposit token mint and pool state
            { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: mainTreasuryPDA, isSigner: false, isWritable: true },
            { pubkey: depositTokenMint, isSigner: false, isWritable: false },
            { pubkey: userLpAccount, isSigner: false, isWritable: true },
        ],
        programId: constants_1.PROGRAM_ID,
        data: instructionData,
    });
}
/**
 * Create an instruction to withdraw liquidity from a pool
 * Authority: LP token holder
 * Fee: 0.0013 SOL withdrawal fee
 * @param poolStatePDA - Pool state PDA
 * @param withdrawAmount - Amount of LP tokens to burn
 * @param withdrawTokenMint - Token mint to receive (A or B)
 * @param userAuthority - User withdrawing liquidity
 * @param userLpAccount - User's LP token account
 * @param userTokenAccount - User's token account to receive funds
 * @returns TransactionInstruction
 */
function createWithdrawInstruction(poolStatePDA, withdrawAmount, withdrawTokenMint, userAuthority, userLpAccount, userTokenAccount) {
    // Derive required PDAs
    const [systemStatePDA] = (0, utils_1.deriveSystemStatePDA)();
    const [mainTreasuryPDA] = (0, utils_1.deriveMainTreasuryPDA)();
    // Serialize instruction data
    const instructionData = Buffer.concat([
        Buffer.from([constants_1.PoolInstruction.Withdraw]),
        withdrawTokenMint.toBuffer(),
        withdrawAmount.toArrayLike(Buffer, 'le', 8)
    ]);
    return new web3_js_1.TransactionInstruction({
        keys: [
            { pubkey: userAuthority, isSigner: true, isWritable: true },
            { pubkey: systemStatePDA, isSigner: false, isWritable: false },
            { pubkey: poolStatePDA, isSigner: false, isWritable: true },
            { pubkey: userLpAccount, isSigner: false, isWritable: true },
            { pubkey: userTokenAccount, isSigner: false, isWritable: true },
            // Pool token vault derived by program based on withdraw token mint
            { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: mainTreasuryPDA, isSigner: false, isWritable: true },
            { pubkey: withdrawTokenMint, isSigner: false, isWritable: false },
        ],
        programId: constants_1.PROGRAM_ID,
        data: instructionData,
    });
}
/**
 * Calculate required liquidity amounts for deposit
 * @param depositAmount - Amount of the deposit token
 * @param depositTokenMint - Token being deposited
 * @param poolRatioA - Pool ratio for token A
 * @param poolRatioB - Pool ratio for token B
 * @param tokenAMint - Token A mint
 * @returns Object with required amounts
 */
function calculateDepositAmounts(depositAmount, depositTokenMint, poolRatioA, poolRatioB, tokenAMint) {
    const isDepositingTokenA = depositTokenMint.equals(tokenAMint);
    if (isDepositingTokenA) {
        return {
            tokenAAmount: depositAmount,
            tokenBAmount: (0, utils_1.calculateRequiredLiquidity)(depositAmount, poolRatioA, poolRatioB),
            isDepositingTokenA: true,
        };
    }
    else {
        return {
            tokenAAmount: (0, utils_1.calculateRequiredLiquidity)(depositAmount, poolRatioB, poolRatioA),
            tokenBAmount: depositAmount,
            isDepositingTokenA: false,
        };
    }
}
/**
 * Calculate expected LP tokens to receive from deposit
 * Note: This is an approximation - actual LP tokens depend on current pool state
 * @param depositAmount - Amount being deposited
 * @param currentPoolBalance - Current balance of the deposit token in pool
 * @param currentLpSupply - Current LP token supply for the deposit token
 * @returns Estimated LP tokens to receive
 */
function estimateLPTokensFromDeposit(depositAmount, currentPoolBalance, currentLpSupply) {
    if (currentLpSupply.eq(new bn_js_1.default(0)) || currentPoolBalance.eq(new bn_js_1.default(0))) {
        // Initial deposit - LP tokens equal deposit amount
        return depositAmount;
    }
    // LP tokens = (deposit amount * current LP supply) / current pool balance
    return depositAmount.mul(currentLpSupply).div(currentPoolBalance);
}
/**
 * Calculate expected tokens to receive from LP withdrawal
 * @param lpAmount - Amount of LP tokens to burn
 * @param currentPoolBalance - Current balance of the token in pool
 * @param currentLpSupply - Current LP token supply
 * @returns Expected tokens to receive
 */
function estimateTokensFromWithdraw(lpAmount, currentPoolBalance, currentLpSupply) {
    if (currentLpSupply.eq(new bn_js_1.default(0))) {
        return new bn_js_1.default(0);
    }
    // Tokens = (LP amount * current pool balance) / current LP supply
    return lpAmount.mul(currentPoolBalance).div(currentLpSupply);
}
/**
 * Validate liquidity deposit parameters
 * @param params - Deposit parameters
 * @returns Validation result
 */
function validateDepositParams(params) {
    const errors = [];
    if (params.depositAmount.lte(new bn_js_1.default(0))) {
        errors.push("Deposit amount must be positive");
    }
    // Check for reasonable deposit size (avoid overflow)
    const maxDeposit = new bn_js_1.default(10).pow(new bn_js_1.default(15)); // 10^15 max
    if (params.depositAmount.gte(maxDeposit)) {
        errors.push("Deposit amount too large");
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
/**
 * Validate withdrawal parameters
 * @param withdrawAmount - LP tokens to burn
 * @param userLpBalance - User's current LP token balance
 * @returns Validation result
 */
function validateWithdrawParams(withdrawAmount, userLpBalance) {
    const errors = [];
    if (withdrawAmount.lte(new bn_js_1.default(0))) {
        errors.push("Withdraw amount must be positive");
    }
    if (withdrawAmount.gt(userLpBalance)) {
        errors.push("Insufficient LP token balance");
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
/**
 * Calculate deposit fee in SOL
 * @returns Deposit fee in lamports
 */
function getDepositFee() {
    return new bn_js_1.default(1300000); // 0.0013 SOL
}
/**
 * Calculate withdrawal fee in SOL
 * @returns Withdrawal fee in lamports
 */
function getWithdrawalFee() {
    return new bn_js_1.default(1300000); // 0.0013 SOL
}
/**
 * Helper to create deposit instruction with display amounts
 * @param poolStatePDA - Pool state PDA
 * @param depositAmountDisplay - Deposit amount in display units
 * @param tokenDecimals - Number of decimals for the token
 * @param depositTokenMint - Token being deposited
 * @param userAuthority - User authority
 * @param userTokenAccount - User's token account
 * @param userLpAccount - User's LP token account
 * @returns TransactionInstruction
 */
function createDepositInstructionWithDisplayAmount(poolStatePDA, depositAmountDisplay, tokenDecimals, depositTokenMint, userAuthority, userTokenAccount, userLpAccount) {
    const depositAmount = new bn_js_1.default(depositAmountDisplay * Math.pow(10, tokenDecimals));
    return createDepositInstruction({
        poolStatePDA,
        depositAmount,
        depositTokenMint,
        userAuthority,
        userTokenAccount,
        userLpAccount,
    });
}
