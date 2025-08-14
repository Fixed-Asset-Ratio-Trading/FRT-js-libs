import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { TokenInfo } from './types';
/**
 * Utility functions for Fixed Ratio Trading operations
 */
/**
 * Convert a display amount to basis points (smallest unit)
 * @param amount - The amount in display units (e.g., 1.5 for 1.5 SOL)
 * @param decimals - The number of decimals for the token
 * @returns BN representation in basis points
 */
export declare function toBasisPoints(amount: number, decimals: number): BN;
/**
 * Convert basis points to display amount
 * @param basisPoints - Amount in basis points
 * @param decimals - Number of decimals for the token
 * @returns Display amount as number
 */
export declare function fromBasisPoints(basisPoints: BN, decimals: number): number;
/**
 * Normalize token order for consistent PDA derivation
 * @param tokenAMint - First token mint
 * @param tokenBMint - Second token mint
 * @returns Normalized token order [mintA, mintB]
 */
export declare function normalizeTokenOrder(tokenAMint: PublicKey, tokenBMint: PublicKey): [PublicKey, PublicKey];
/**
 * Derive the system state PDA
 * @returns [PublicKey, bump]
 */
export declare function deriveSystemStatePDA(): [PublicKey, number];
/**
 * Derive the main treasury PDA
 * @returns [PublicKey, bump]
 */
export declare function deriveMainTreasuryPDA(): [PublicKey, number];
/**
 * Derive the pool state PDA
 * @param tokenAMint - First token mint
 * @param tokenBMint - Second token mint
 * @param ratioA - Ratio for token A
 * @param ratioB - Ratio for token B
 * @returns [PublicKey, bump]
 */
export declare function derivePoolStatePDA(tokenAMint: PublicKey, tokenBMint: PublicKey, ratioA: BN, ratioB: BN): [PublicKey, number];
/**
 * Derive token vault PDAs for a pool
 * @param poolStatePDA - The pool state PDA
 * @returns Object with vault PDAs
 */
export declare function deriveTokenVaultPDAs(poolStatePDA: PublicKey): {
    tokenAVault: [PublicKey, number];
    tokenBVault: [PublicKey, number];
};
/**
 * Derive LP token mint PDAs for a pool
 * @param poolStatePDA - The pool state PDA
 * @returns Object with LP token mint PDAs
 */
export declare function deriveLPTokenMintPDAs(poolStatePDA: PublicKey): {
    lpTokenAMint: [PublicKey, number];
    lpTokenBMint: [PublicKey, number];
};
/**
 * Calculate the required amount of the other token for liquidity provision
 * @param depositAmount - Amount of the deposit token
 * @param depositTokenRatio - Ratio of the deposit token in the pool
 * @param otherTokenRatio - Ratio of the other token in the pool
 * @returns Required amount of the other token
 */
export declare function calculateRequiredLiquidity(depositAmount: BN, depositTokenRatio: BN, otherTokenRatio: BN): BN;
/**
 * Calculate expected output for a swap
 * @param inputAmount - Amount of input tokens
 * @param inputRatio - Ratio of input token in the pool
 * @param outputRatio - Ratio of output token in the pool
 * @returns Expected output amount (before fees)
 */
export declare function calculateSwapOutput(inputAmount: BN, inputRatio: BN, outputRatio: BN): BN;
/**
 * Apply slippage tolerance to an expected amount
 * @param expectedAmount - The expected amount
 * @param slippageTolerance - Slippage tolerance as percentage (e.g., 1 for 1%)
 * @returns Minimum acceptable amount
 */
export declare function applySlippage(expectedAmount: BN, slippageTolerance: number): BN;
/**
 * Parse error code from transaction logs
 * @param logs - Transaction logs
 * @returns Error code or null if not found
 */
export declare function parseErrorCode(logs: string[]): number | null;
/**
 * Format error message from error code
 * @param errorCode - The error code
 * @returns Human-readable error message
 */
export declare function formatError(errorCode: number): string;
/**
 * Validate that a token amount is positive and within reasonable bounds
 * @param amount - The amount to validate
 * @param tokenInfo - Token information including decimals
 * @returns True if valid
 */
export declare function validateTokenAmount(amount: BN, tokenInfo: TokenInfo): boolean;
/**
 * Create a message buffer with length prefix (for donations)
 * @param message - The message string
 * @param maxLength - Maximum message length (default 200)
 * @returns Buffer with length prefix + message
 */
export declare function encodeMessage(message: string, maxLength?: number): Buffer;
/**
 * Check if two PublicKeys are equal
 * @param a - First PublicKey
 * @param b - Second PublicKey
 * @returns True if equal
 */
export declare function keysEqual(a: PublicKey, b: PublicKey): boolean;
