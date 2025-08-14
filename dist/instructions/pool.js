"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitializePoolInstruction = createInitializePoolInstruction;
exports.createPoolWithDisplayAmounts = createPoolWithDisplayAmounts;
exports.getPoolPDAs = getPoolPDAs;
exports.doesPoolExist = doesPoolExist;
exports.estimatePoolCreationCosts = estimatePoolCreationCosts;
exports.validatePoolCreationParams = validatePoolCreationParams;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const bn_js_1 = __importDefault(require("bn.js"));
const constants_1 = require("../constants");
const utils_1 = require("../utils");
/**
 * Pool management functions for users (no upgrade authority required)
 */
/**
 * Create an instruction to initialize a new fixed-ratio pool
 * Authority: Any user
 * Fee: 1.15 SOL registration fee
 * @param params - Pool creation parameters
 * @returns TransactionInstruction
 */
function createInitializePoolInstruction(params) {
    const { tokenAMint, tokenBMint, ratioA, ratioB, userAuthority } = params;
    // Normalize token order for consistent PDA derivation
    const [mintA, mintB] = (0, utils_1.normalizeTokenOrder)(tokenAMint, tokenBMint);
    // Derive all required PDAs
    const [systemStatePDA] = (0, utils_1.deriveSystemStatePDA)();
    const [mainTreasuryPDA] = (0, utils_1.deriveMainTreasuryPDA)();
    const [poolStatePDA] = (0, utils_1.derivePoolStatePDA)(mintA, mintB, ratioA, ratioB);
    const { tokenAVault, tokenBVault } = (0, utils_1.deriveTokenVaultPDAs)(poolStatePDA);
    const { lpTokenAMint, lpTokenBMint } = (0, utils_1.deriveLPTokenMintPDAs)(poolStatePDA);
    // Serialize instruction data
    const instructionData = Buffer.concat([
        Buffer.from([constants_1.PoolInstruction.InitializePool]),
        ratioA.toArrayLike(Buffer, 'le', 8),
        ratioB.toArrayLike(Buffer, 'le', 8)
    ]);
    return new web3_js_1.TransactionInstruction({
        keys: [
            { pubkey: userAuthority, isSigner: true, isWritable: true },
            { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: systemStatePDA, isSigner: false, isWritable: false },
            { pubkey: poolStatePDA, isSigner: false, isWritable: true },
            { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: mainTreasuryPDA, isSigner: false, isWritable: true },
            { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
            { pubkey: mintA, isSigner: false, isWritable: false },
            { pubkey: mintB, isSigner: false, isWritable: false },
            { pubkey: tokenAVault[0], isSigner: false, isWritable: true },
            { pubkey: tokenBVault[0], isSigner: false, isWritable: true },
            { pubkey: lpTokenAMint[0], isSigner: false, isWritable: true },
            { pubkey: lpTokenBMint[0], isSigner: false, isWritable: true },
        ],
        programId: constants_1.PROGRAM_ID,
        data: instructionData,
    });
}
/**
 * Helper function to create pool with display amounts
 * Automatically converts display amounts to basis points
 * @param userAuthority - User creating the pool
 * @param tokenAMint - First token mint
 * @param tokenBMint - Second token mint
 * @param tokenAAmount - Amount of token A in display units
 * @param tokenBAmount - Amount of token B in display units
 * @param tokenADecimals - Decimals for token A
 * @param tokenBDecimals - Decimals for token B
 * @returns TransactionInstruction
 */
function createPoolWithDisplayAmounts(userAuthority, tokenAMint, tokenBMint, tokenAAmount, tokenBAmount, tokenADecimals, tokenBDecimals) {
    // Convert to basis points
    const ratioA = new bn_js_1.default(tokenAAmount * Math.pow(10, tokenADecimals));
    const ratioB = new bn_js_1.default(tokenBAmount * Math.pow(10, tokenBDecimals));
    return createInitializePoolInstruction({
        tokenAMint,
        tokenBMint,
        ratioA,
        ratioB,
        userAuthority,
    });
}
/**
 * Get all the PDAs associated with a pool
 * @param tokenAMint - First token mint
 * @param tokenBMint - Second token mint
 * @param ratioA - Ratio for token A
 * @param ratioB - Ratio for token B
 * @returns Object containing all pool-related PDAs
 */
function getPoolPDAs(tokenAMint, tokenBMint, ratioA, ratioB) {
    const [mintA, mintB] = (0, utils_1.normalizeTokenOrder)(tokenAMint, tokenBMint);
    const [poolStatePDA, poolBump] = (0, utils_1.derivePoolStatePDA)(mintA, mintB, ratioA, ratioB);
    const { tokenAVault, tokenBVault } = (0, utils_1.deriveTokenVaultPDAs)(poolStatePDA);
    const { lpTokenAMint, lpTokenBMint } = (0, utils_1.deriveLPTokenMintPDAs)(poolStatePDA);
    return {
        poolStatePDA,
        poolBump,
        tokenAVault: tokenAVault[0],
        tokenAVaultBump: tokenAVault[1],
        tokenBVault: tokenBVault[0],
        tokenBVaultBump: tokenBVault[1],
        lpTokenAMint: lpTokenAMint[0],
        lpTokenAMintBump: lpTokenAMint[1],
        lpTokenBMint: lpTokenBMint[0],
        lpTokenBMintBump: lpTokenBMint[1],
        normalizedTokenA: mintA,
        normalizedTokenB: mintB,
    };
}
/**
 * Check if a pool exists by attempting to fetch its account
 * @param connection - Solana connection
 * @param poolStatePDA - Pool state PDA to check
 * @returns Promise<boolean> - True if pool exists
 */
async function doesPoolExist(connection, // Using any to avoid circular import with Connection
poolStatePDA) {
    try {
        const accountInfo = await connection.getAccountInfo(poolStatePDA);
        return accountInfo !== null && accountInfo.data.length > 0;
    }
    catch (error) {
        return false;
    }
}
/**
 * Estimate pool creation costs
 * @returns Object with cost breakdown
 */
function estimatePoolCreationCosts() {
    const registrationFee = new bn_js_1.default(1150000000); // 1.15 SOL
    const rentExemption = new bn_js_1.default(50000000); // ~0.05 SOL for account creation (estimated)
    return {
        registrationFee,
        rentExemption,
        estimatedTotal: registrationFee.add(rentExemption),
    };
}
/**
 * Validate pool creation parameters
 * @param params - Pool creation parameters
 * @returns Object with validation result
 */
function validatePoolCreationParams(params) {
    const errors = [];
    // Check if ratios are positive
    if (params.ratioA.lte(new bn_js_1.default(0))) {
        errors.push("Ratio A must be positive");
    }
    if (params.ratioB.lte(new bn_js_1.default(0))) {
        errors.push("Ratio B must be positive");
    }
    // Check if tokens are different
    if (params.tokenAMint.equals(params.tokenBMint)) {
        errors.push("Token A and Token B must be different");
    }
    // Check for reasonable ratio sizes (avoid overflow)
    const maxRatio = new bn_js_1.default(10).pow(new bn_js_1.default(18)); // 10^18 max
    if (params.ratioA.gte(maxRatio) || params.ratioB.gte(maxRatio)) {
        errors.push("Ratios too large (max 10^18)");
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
