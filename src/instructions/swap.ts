import {
    PublicKey,
    TransactionInstruction,
    SystemProgram,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import { PROGRAM_ID, PoolInstruction } from '../constants';
import {
    deriveSystemStatePDA,
    deriveMainTreasuryPDA,
    calculateSwapOutput,
    applySlippage,
} from '../utils';
import { SwapParams, SwapResult } from '../types';

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
export function createSwapInstruction(params: SwapParams): TransactionInstruction {
    const {
        poolStatePDA,
        amountIn,
        expectedAmountOut,
        inputTokenMint,
        userAuthority,
        userInputAccount,
        userOutputAccount,
    } = params;

    // Derive required PDAs
    const [systemStatePDA] = deriveSystemStatePDA();
    const [mainTreasuryPDA] = deriveMainTreasuryPDA();

    // Apply slippage tolerance if provided
    const slippageTolerance = params.slippageTolerance || 1; // Default 1%
    const minAmountOut = applySlippage(expectedAmountOut, slippageTolerance);

    // Serialize instruction data
    const instructionData = Buffer.concat([
        Buffer.from([PoolInstruction.Swap]),
        inputTokenMint.toBuffer(),
        amountIn.toArrayLike(Buffer, 'le', 8),
        minAmountOut.toArrayLike(Buffer, 'le', 8) // Use min amount out for slippage protection
    ]);

    return new TransactionInstruction({
        keys: [
            { pubkey: userAuthority, isSigner: true, isWritable: true },
            { pubkey: systemStatePDA, isSigner: false, isWritable: false },
            { pubkey: poolStatePDA, isSigner: false, isWritable: true },
            { pubkey: userInputAccount, isSigner: false, isWritable: true },
            { pubkey: userOutputAccount, isSigner: false, isWritable: true },
            // Pool token vaults are derived by the program based on input/output tokens
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: mainTreasuryPDA, isSigner: false, isWritable: true },
            { pubkey: inputTokenMint, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
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
export function calculateExpectedSwapOutput(
    amountIn: BN,
    inputTokenMint: PublicKey,
    poolRatioA: BN,
    poolRatioB: BN,
    tokenAMint: PublicKey
): BN {
    const isInputTokenA = inputTokenMint.equals(tokenAMint);
    
    if (isInputTokenA) {
        // Swapping A for B
        return calculateSwapOutput(amountIn, poolRatioA, poolRatioB);
    } else {
        // Swapping B for A
        return calculateSwapOutput(amountIn, poolRatioB, poolRatioA);
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
export function calculateSwapWithPriceImpact(
    amountIn: BN,
    inputTokenMint: PublicKey,
    poolBalanceA: BN,
    poolBalanceB: BN,
    tokenAMint: PublicKey
): SwapResult {
    const isInputTokenA = inputTokenMint.equals(tokenAMint);
    
    let amountOut: BN;
    let priceImpact: number;
    
    if (isInputTokenA) {
        // Swapping A for B
        // In fixed ratio, price impact is minimal since ratios are maintained
        amountOut = amountIn.mul(poolBalanceB).div(poolBalanceA);
        
        // Calculate price impact (simplified for fixed ratio)
        const idealPrice = poolBalanceB.toNumber() / poolBalanceA.toNumber();
        const actualPrice = amountOut.toNumber() / amountIn.toNumber();
        priceImpact = Math.abs((actualPrice - idealPrice) / idealPrice) * 100;
    } else {
        // Swapping B for A
        amountOut = amountIn.mul(poolBalanceA).div(poolBalanceB);
        
        const idealPrice = poolBalanceA.toNumber() / poolBalanceB.toNumber();
        const actualPrice = amountOut.toNumber() / amountIn.toNumber();
        priceImpact = Math.abs((actualPrice - idealPrice) / idealPrice) * 100;
    }

    const fees = new BN(27_150); // 0.00002715 SOL

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
export function getMinAmountOut(expectedAmountOut: BN, slippageTolerance: number): BN {
    return applySlippage(expectedAmountOut, slippageTolerance);
}

/**
 * Validate swap parameters
 * @param params - Swap parameters
 * @returns Validation result
 */
export function validateSwapParams(params: SwapParams): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (params.amountIn.lte(new BN(0))) {
        errors.push("Input amount must be positive");
    }

    if (params.expectedAmountOut.lte(new BN(0))) {
        errors.push("Expected output amount must be positive");
    }

    if (params.slippageTolerance !== undefined) {
        if (params.slippageTolerance < 0 || params.slippageTolerance > 50) {
            errors.push("Slippage tolerance must be between 0 and 50 percent");
        }
    }

    // Check for reasonable swap size (avoid overflow)
    const maxSwap = new BN(10).pow(new BN(15)); // 10^15 max
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
export function getSwapFee(): BN {
    return new BN(27_150); // 0.00002715 SOL
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
export function createSwapInstructionWithDisplayAmounts(
    poolStatePDA: PublicKey,
    amountInDisplay: number,
    expectedAmountOutDisplay: number,
    inputTokenDecimals: number,
    outputTokenDecimals: number,
    inputTokenMint: PublicKey,
    userAuthority: PublicKey,
    userInputAccount: PublicKey,
    userOutputAccount: PublicKey,
    slippageTolerance: number = 1
): TransactionInstruction {
    const amountIn = new BN(amountInDisplay * Math.pow(10, inputTokenDecimals));
    const expectedAmountOut = new BN(expectedAmountOutDisplay * Math.pow(10, outputTokenDecimals));

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
export function estimateSwapOutputDisplay(
    amountInDisplay: number,
    inputTokenDecimals: number,
    outputTokenDecimals: number,
    poolRatioA: BN,
    poolRatioB: BN,
    isInputTokenA: boolean
): number {
    const amountIn = new BN(amountInDisplay * Math.pow(10, inputTokenDecimals));
    
    let amountOut: BN;
    if (isInputTokenA) {
        amountOut = calculateSwapOutput(amountIn, poolRatioA, poolRatioB);
    } else {
        amountOut = calculateSwapOutput(amountIn, poolRatioB, poolRatioA);
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
export async function isPoolPublicSwapEnabled(
    connection: any, // Using any to avoid circular import
    poolStatePDA: PublicKey
): Promise<boolean> {
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
    } catch (error) {
        throw new Error(`Failed to check pool swap mode: ${error}`);
    }
}
