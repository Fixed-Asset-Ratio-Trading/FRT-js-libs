import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import { PoolCreationParams } from '../types';
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
export declare function createInitializePoolInstruction(params: PoolCreationParams): TransactionInstruction;
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
export declare function createPoolWithDisplayAmounts(userAuthority: PublicKey, tokenAMint: PublicKey, tokenBMint: PublicKey, tokenAAmount: number, tokenBAmount: number, tokenADecimals: number, tokenBDecimals: number): TransactionInstruction;
/**
 * Get all the PDAs associated with a pool
 * @param tokenAMint - First token mint
 * @param tokenBMint - Second token mint
 * @param ratioA - Ratio for token A
 * @param ratioB - Ratio for token B
 * @returns Object containing all pool-related PDAs
 */
export declare function getPoolPDAs(tokenAMint: PublicKey, tokenBMint: PublicKey, ratioA: BN, ratioB: BN): {
    poolStatePDA: PublicKey;
    poolBump: number;
    tokenAVault: PublicKey;
    tokenAVaultBump: number;
    tokenBVault: PublicKey;
    tokenBVaultBump: number;
    lpTokenAMint: PublicKey;
    lpTokenAMintBump: number;
    lpTokenBMint: PublicKey;
    lpTokenBMintBump: number;
    normalizedTokenA: PublicKey;
    normalizedTokenB: PublicKey;
};
/**
 * Check if a pool exists by attempting to fetch its account
 * @param connection - Solana connection
 * @param poolStatePDA - Pool state PDA to check
 * @returns Promise<boolean> - True if pool exists
 */
export declare function doesPoolExist(connection: any, // Using any to avoid circular import with Connection
poolStatePDA: PublicKey): Promise<boolean>;
/**
 * Estimate pool creation costs
 * @returns Object with cost breakdown
 */
export declare function estimatePoolCreationCosts(): {
    registrationFee: BN;
    rentExemption: BN;
    estimatedTotal: BN;
};
/**
 * Validate pool creation parameters
 * @param params - Pool creation parameters
 * @returns Object with validation result
 */
export declare function validatePoolCreationParams(params: PoolCreationParams): {
    isValid: boolean;
    errors: string[];
};
