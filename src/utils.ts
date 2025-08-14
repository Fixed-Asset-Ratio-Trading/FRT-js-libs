import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { PROGRAM_ID, SEEDS } from './constants';
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
export function toBasisPoints(amount: number, decimals: number): BN {
    const multiplier = Math.pow(10, decimals);
    return new BN(Math.floor(amount * multiplier));
}

/**
 * Convert basis points to display amount
 * @param basisPoints - Amount in basis points
 * @param decimals - Number of decimals for the token
 * @returns Display amount as number
 */
export function fromBasisPoints(basisPoints: BN, decimals: number): number {
    const divisor = Math.pow(10, decimals);
    return basisPoints.toNumber() / divisor;
}

/**
 * Normalize token order for consistent PDA derivation
 * @param tokenAMint - First token mint
 * @param tokenBMint - Second token mint
 * @returns Normalized token order [mintA, mintB]
 */
export function normalizeTokenOrder(
    tokenAMint: PublicKey, 
    tokenBMint: PublicKey
): [PublicKey, PublicKey] {
    return tokenAMint.toBuffer() < tokenBMint.toBuffer() 
        ? [tokenAMint, tokenBMint]
        : [tokenBMint, tokenAMint];
}

/**
 * Derive the system state PDA
 * @returns [PublicKey, bump]
 */
export function deriveSystemStatePDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.SYSTEM_STATE)],
        PROGRAM_ID
    );
}

/**
 * Derive the main treasury PDA
 * @returns [PublicKey, bump]
 */
export function deriveMainTreasuryPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.MAIN_TREASURY)],
        PROGRAM_ID
    );
}

/**
 * Derive the pool state PDA
 * @param tokenAMint - First token mint
 * @param tokenBMint - Second token mint  
 * @param ratioA - Ratio for token A
 * @param ratioB - Ratio for token B
 * @returns [PublicKey, bump]
 */
export function derivePoolStatePDA(
    tokenAMint: PublicKey,
    tokenBMint: PublicKey,
    ratioA: BN,
    ratioB: BN
): [PublicKey, number] {
    const [mintA, mintB] = normalizeTokenOrder(tokenAMint, tokenBMint);
    
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from(SEEDS.POOL_STATE_V2),
            mintA.toBuffer(),
            mintB.toBuffer(),
            ratioA.toArrayLike(Buffer, 'le', 8),
            ratioB.toArrayLike(Buffer, 'le', 8)
        ],
        PROGRAM_ID
    );
}

/**
 * Derive token vault PDAs for a pool
 * @param poolStatePDA - The pool state PDA
 * @returns Object with vault PDAs
 */
export function deriveTokenVaultPDAs(poolStatePDA: PublicKey): {
    tokenAVault: [PublicKey, number];
    tokenBVault: [PublicKey, number];
} {
    return {
        tokenAVault: PublicKey.findProgramAddressSync(
            [Buffer.from(SEEDS.TOKEN_A_VAULT), poolStatePDA.toBuffer()],
            PROGRAM_ID
        ),
        tokenBVault: PublicKey.findProgramAddressSync(
            [Buffer.from(SEEDS.TOKEN_B_VAULT), poolStatePDA.toBuffer()],
            PROGRAM_ID
        )
    };
}

/**
 * Derive LP token mint PDAs for a pool
 * @param poolStatePDA - The pool state PDA
 * @returns Object with LP token mint PDAs
 */
export function deriveLPTokenMintPDAs(poolStatePDA: PublicKey): {
    lpTokenAMint: [PublicKey, number];
    lpTokenBMint: [PublicKey, number];
} {
    return {
        lpTokenAMint: PublicKey.findProgramAddressSync(
            [Buffer.from(SEEDS.LP_TOKEN_A_MINT), poolStatePDA.toBuffer()],
            PROGRAM_ID
        ),
        lpTokenBMint: PublicKey.findProgramAddressSync(
            [Buffer.from(SEEDS.LP_TOKEN_B_MINT), poolStatePDA.toBuffer()],
            PROGRAM_ID
        )
    };
}

/**
 * Calculate the required amount of the other token for liquidity provision
 * @param depositAmount - Amount of the deposit token
 * @param depositTokenRatio - Ratio of the deposit token in the pool
 * @param otherTokenRatio - Ratio of the other token in the pool
 * @returns Required amount of the other token
 */
export function calculateRequiredLiquidity(
    depositAmount: BN,
    depositTokenRatio: BN,
    otherTokenRatio: BN
): BN {
    return depositAmount.mul(otherTokenRatio).div(depositTokenRatio);
}

/**
 * Calculate expected output for a swap
 * @param inputAmount - Amount of input tokens
 * @param inputRatio - Ratio of input token in the pool
 * @param outputRatio - Ratio of output token in the pool
 * @returns Expected output amount (before fees)
 */
export function calculateSwapOutput(
    inputAmount: BN,
    inputRatio: BN,
    outputRatio: BN
): BN {
    return inputAmount.mul(outputRatio).div(inputRatio);
}

/**
 * Apply slippage tolerance to an expected amount
 * @param expectedAmount - The expected amount
 * @param slippageTolerance - Slippage tolerance as percentage (e.g., 1 for 1%)
 * @returns Minimum acceptable amount
 */
export function applySlippage(expectedAmount: BN, slippageTolerance: number): BN {
    const tolerance = Math.floor((100 - slippageTolerance) * 100); // Convert to basis points
    return expectedAmount.mul(new BN(tolerance)).div(new BN(10000));
}

/**
 * Parse error code from transaction logs
 * @param logs - Transaction logs
 * @returns Error code or null if not found
 */
export function parseErrorCode(logs: string[]): number | null {
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
export function formatError(errorCode: number): string {
    const errorMap: Record<number, string> = {
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
export function validateTokenAmount(amount: BN, tokenInfo: TokenInfo): boolean {
    if (amount.lte(new BN(0))) {
        return false;
    }
    
    // Check for reasonable upper bound (avoid overflow)
    const maxAmount = new BN(10).pow(new BN(tokenInfo.decimals + 9)); // 1B tokens max
    return amount.lt(maxAmount);
}

/**
 * Create a message buffer with length prefix (for donations)
 * @param message - The message string
 * @param maxLength - Maximum message length (default 200)
 * @returns Buffer with length prefix + message
 */
export function encodeMessage(message: string, maxLength: number = 200): Buffer {
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
export function keysEqual(a: PublicKey, b: PublicKey): boolean {
    return a.toBase58() === b.toBase58();
}
