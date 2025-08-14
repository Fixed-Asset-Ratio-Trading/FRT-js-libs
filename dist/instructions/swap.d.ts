import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
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
export declare function createSwapInstruction(params: SwapParams): TransactionInstruction;
/**
 * Calculate expected swap output
 * @param amountIn - Input amount
 * @param inputTokenMint - Input token mint
 * @param poolRatioA - Pool ratio for token A
 * @param poolRatioB - Pool ratio for token B
 * @param tokenAMint - Token A mint
 * @returns Expected output amount (before fees)
 */
export declare function calculateExpectedSwapOutput(amountIn: BN, inputTokenMint: PublicKey, poolRatioA: BN, poolRatioB: BN, tokenAMint: PublicKey): BN;
/**
 * Calculate swap with price impact
 * @param amountIn - Input amount
 * @param inputTokenMint - Input token mint
 * @param poolBalanceA - Current balance of token A in pool
 * @param poolBalanceB - Current balance of token B in pool
 * @param tokenAMint - Token A mint
 * @returns Swap result with price impact
 */
export declare function calculateSwapWithPriceImpact(amountIn: BN, inputTokenMint: PublicKey, poolBalanceA: BN, poolBalanceB: BN, tokenAMint: PublicKey): SwapResult;
/**
 * Get the minimum amount out with slippage protection
 * @param expectedAmountOut - Expected output amount
 * @param slippageTolerance - Slippage tolerance percentage (e.g., 1 for 1%)
 * @returns Minimum acceptable output amount
 */
export declare function getMinAmountOut(expectedAmountOut: BN, slippageTolerance: number): BN;
/**
 * Validate swap parameters
 * @param params - Swap parameters
 * @returns Validation result
 */
export declare function validateSwapParams(params: SwapParams): {
    isValid: boolean;
    errors: string[];
};
/**
 * Calculate swap fee in SOL
 * @returns Swap fee in lamports
 */
export declare function getSwapFee(): BN;
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
export declare function createSwapInstructionWithDisplayAmounts(poolStatePDA: PublicKey, amountInDisplay: number, expectedAmountOutDisplay: number, inputTokenDecimals: number, outputTokenDecimals: number, inputTokenMint: PublicKey, userAuthority: PublicKey, userInputAccount: PublicKey, userOutputAccount: PublicKey, slippageTolerance?: number): TransactionInstruction;
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
export declare function estimateSwapOutputDisplay(amountInDisplay: number, inputTokenDecimals: number, outputTokenDecimals: number, poolRatioA: BN, poolRatioB: BN, isInputTokenA: boolean): number;
/**
 * Check if a pool allows public swaps or is in owner-only mode
 * Note: This would require reading the pool state account
 * @param connection - Solana connection
 * @param poolStatePDA - Pool state PDA
 * @returns Promise<boolean> - True if public swaps are allowed
 */
export declare function isPoolPublicSwapEnabled(connection: any, // Using any to avoid circular import
poolStatePDA: PublicKey): Promise<boolean>;
