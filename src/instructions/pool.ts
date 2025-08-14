import {
    PublicKey,
    TransactionInstruction,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import { PROGRAM_ID, PoolInstruction } from '../constants';
import {
    deriveSystemStatePDA,
    deriveMainTreasuryPDA,
    derivePoolStatePDA,
    deriveTokenVaultPDAs,
    deriveLPTokenMintPDAs,
    normalizeTokenOrder,
} from '../utils';
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
export function createInitializePoolInstruction(params: PoolCreationParams): TransactionInstruction {
    const { tokenAMint, tokenBMint, ratioA, ratioB, userAuthority } = params;

    // Normalize token order for consistent PDA derivation
    const [mintA, mintB] = normalizeTokenOrder(tokenAMint, tokenBMint);
    
    // Derive all required PDAs
    const [systemStatePDA] = deriveSystemStatePDA();
    const [mainTreasuryPDA] = deriveMainTreasuryPDA();
    const [poolStatePDA] = derivePoolStatePDA(mintA, mintB, ratioA, ratioB);
    
    const { tokenAVault, tokenBVault } = deriveTokenVaultPDAs(poolStatePDA);
    const { lpTokenAMint, lpTokenBMint } = deriveLPTokenMintPDAs(poolStatePDA);

    // Serialize instruction data
    const instructionData = Buffer.concat([
        Buffer.from([PoolInstruction.InitializePool]),
        ratioA.toArrayLike(Buffer, 'le', 8),
        ratioB.toArrayLike(Buffer, 'le', 8)
    ]);

    return new TransactionInstruction({
        keys: [
            { pubkey: userAuthority, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: systemStatePDA, isSigner: false, isWritable: false },
            { pubkey: poolStatePDA, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: mainTreasuryPDA, isSigner: false, isWritable: true },
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
            { pubkey: mintA, isSigner: false, isWritable: false },
            { pubkey: mintB, isSigner: false, isWritable: false },
            { pubkey: tokenAVault[0], isSigner: false, isWritable: true },
            { pubkey: tokenBVault[0], isSigner: false, isWritable: true },
            { pubkey: lpTokenAMint[0], isSigner: false, isWritable: true },
            { pubkey: lpTokenBMint[0], isSigner: false, isWritable: true },
        ],
        programId: PROGRAM_ID,
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
export function createPoolWithDisplayAmounts(
    userAuthority: PublicKey,
    tokenAMint: PublicKey,
    tokenBMint: PublicKey,
    tokenAAmount: number,
    tokenBAmount: number,
    tokenADecimals: number,
    tokenBDecimals: number
): TransactionInstruction {
    // Convert to basis points
    const ratioA = new BN(tokenAAmount * Math.pow(10, tokenADecimals));
    const ratioB = new BN(tokenBAmount * Math.pow(10, tokenBDecimals));

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
export function getPoolPDAs(
    tokenAMint: PublicKey,
    tokenBMint: PublicKey,
    ratioA: BN,
    ratioB: BN
) {
    const [mintA, mintB] = normalizeTokenOrder(tokenAMint, tokenBMint);
    const [poolStatePDA, poolBump] = derivePoolStatePDA(mintA, mintB, ratioA, ratioB);
    
    const { tokenAVault, tokenBVault } = deriveTokenVaultPDAs(poolStatePDA);
    const { lpTokenAMint, lpTokenBMint } = deriveLPTokenMintPDAs(poolStatePDA);

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
export async function doesPoolExist(
    connection: any, // Using any to avoid circular import with Connection
    poolStatePDA: PublicKey
): Promise<boolean> {
    try {
        const accountInfo = await connection.getAccountInfo(poolStatePDA);
        return accountInfo !== null && accountInfo.data.length > 0;
    } catch (error) {
        return false;
    }
}

/**
 * Estimate pool creation costs
 * @returns Object with cost breakdown
 */
export function estimatePoolCreationCosts(): {
    registrationFee: BN;
    rentExemption: BN;
    estimatedTotal: BN;
} {
    const registrationFee = new BN(1_150_000_000); // 1.15 SOL
    const rentExemption = new BN(50_000_000); // ~0.05 SOL for account creation (estimated)
    
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
export function validatePoolCreationParams(params: PoolCreationParams): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Check if ratios are positive
    if (params.ratioA.lte(new BN(0))) {
        errors.push("Ratio A must be positive");
    }
    if (params.ratioB.lte(new BN(0))) {
        errors.push("Ratio B must be positive");
    }

    // Check if tokens are different
    if (params.tokenAMint.equals(params.tokenBMint)) {
        errors.push("Token A and Token B must be different");
    }

    // Check for reasonable ratio sizes (avoid overflow)
    const maxRatio = new BN(10).pow(new BN(18)); // 10^18 max
    if (params.ratioA.gte(maxRatio) || params.ratioB.gte(maxRatio)) {
        errors.push("Ratios too large (max 10^18)");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}
