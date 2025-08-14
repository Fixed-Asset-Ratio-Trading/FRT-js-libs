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
    calculateRequiredLiquidity,
} from '../utils';
import { LiquidityParams, LiquidityResult } from '../types';

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
export function createDepositInstruction(params: LiquidityParams): TransactionInstruction {
    const {
        poolStatePDA,
        depositAmount,
        depositTokenMint,
        userAuthority,
        userTokenAccount,
        userLpAccount,
    } = params;

    // Derive required PDAs
    const [systemStatePDA] = deriveSystemStatePDA();
    const [mainTreasuryPDA] = deriveMainTreasuryPDA();

    // Serialize instruction data
    const instructionData = Buffer.concat([
        Buffer.from([PoolInstruction.Deposit]),
        depositTokenMint.toBuffer(),
        depositAmount.toArrayLike(Buffer, 'le', 8)
    ]);

    return new TransactionInstruction({
        keys: [
            { pubkey: userAuthority, isSigner: true, isWritable: true },
            { pubkey: systemStatePDA, isSigner: false, isWritable: false },
            { pubkey: poolStatePDA, isSigner: false, isWritable: true },
            { pubkey: userTokenAccount, isSigner: false, isWritable: true },
            // Note: Pool token vaults and LP token accounts are derived by the program
            // based on the deposit token mint and pool state
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: mainTreasuryPDA, isSigner: false, isWritable: true },
            { pubkey: depositTokenMint, isSigner: false, isWritable: false },
            { pubkey: userLpAccount, isSigner: false, isWritable: true },
        ],
        programId: PROGRAM_ID,
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
export function createWithdrawInstruction(
    poolStatePDA: PublicKey,
    withdrawAmount: BN,
    withdrawTokenMint: PublicKey,
    userAuthority: PublicKey,
    userLpAccount: PublicKey,
    userTokenAccount: PublicKey
): TransactionInstruction {
    // Derive required PDAs
    const [systemStatePDA] = deriveSystemStatePDA();
    const [mainTreasuryPDA] = deriveMainTreasuryPDA();

    // Serialize instruction data
    const instructionData = Buffer.concat([
        Buffer.from([PoolInstruction.Withdraw]),
        withdrawTokenMint.toBuffer(),
        withdrawAmount.toArrayLike(Buffer, 'le', 8)
    ]);

    return new TransactionInstruction({
        keys: [
            { pubkey: userAuthority, isSigner: true, isWritable: true },
            { pubkey: systemStatePDA, isSigner: false, isWritable: false },
            { pubkey: poolStatePDA, isSigner: false, isWritable: true },
            { pubkey: userLpAccount, isSigner: false, isWritable: true },
            { pubkey: userTokenAccount, isSigner: false, isWritable: true },
            // Pool token vault derived by program based on withdraw token mint
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: mainTreasuryPDA, isSigner: false, isWritable: true },
            { pubkey: withdrawTokenMint, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
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
export function calculateDepositAmounts(
    depositAmount: BN,
    depositTokenMint: PublicKey,
    poolRatioA: BN,
    poolRatioB: BN,
    tokenAMint: PublicKey
): {
    tokenAAmount: BN;
    tokenBAmount: BN;
    isDepositingTokenA: boolean;
} {
    const isDepositingTokenA = depositTokenMint.equals(tokenAMint);
    
    if (isDepositingTokenA) {
        return {
            tokenAAmount: depositAmount,
            tokenBAmount: calculateRequiredLiquidity(depositAmount, poolRatioA, poolRatioB),
            isDepositingTokenA: true,
        };
    } else {
        return {
            tokenAAmount: calculateRequiredLiquidity(depositAmount, poolRatioB, poolRatioA),
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
export function estimateLPTokensFromDeposit(
    depositAmount: BN,
    currentPoolBalance: BN,
    currentLpSupply: BN
): BN {
    if (currentLpSupply.eq(new BN(0)) || currentPoolBalance.eq(new BN(0))) {
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
export function estimateTokensFromWithdraw(
    lpAmount: BN,
    currentPoolBalance: BN,
    currentLpSupply: BN
): BN {
    if (currentLpSupply.eq(new BN(0))) {
        return new BN(0);
    }
    
    // Tokens = (LP amount * current pool balance) / current LP supply
    return lpAmount.mul(currentPoolBalance).div(currentLpSupply);
}

/**
 * Validate liquidity deposit parameters
 * @param params - Deposit parameters
 * @returns Validation result
 */
export function validateDepositParams(params: LiquidityParams): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (params.depositAmount.lte(new BN(0))) {
        errors.push("Deposit amount must be positive");
    }

    // Check for reasonable deposit size (avoid overflow)
    const maxDeposit = new BN(10).pow(new BN(15)); // 10^15 max
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
export function validateWithdrawParams(
    withdrawAmount: BN,
    userLpBalance: BN
): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (withdrawAmount.lte(new BN(0))) {
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
export function getDepositFee(): BN {
    return new BN(1_300_000); // 0.0013 SOL
}

/**
 * Calculate withdrawal fee in SOL
 * @returns Withdrawal fee in lamports
 */
export function getWithdrawalFee(): BN {
    return new BN(1_300_000); // 0.0013 SOL
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
export function createDepositInstructionWithDisplayAmount(
    poolStatePDA: PublicKey,
    depositAmountDisplay: number,
    tokenDecimals: number,
    depositTokenMint: PublicKey,
    userAuthority: PublicKey,
    userTokenAccount: PublicKey,
    userLpAccount: PublicKey
): TransactionInstruction {
    const depositAmount = new BN(depositAmountDisplay * Math.pow(10, tokenDecimals));
    
    return createDepositInstruction({
        poolStatePDA,
        depositAmount,
        depositTokenMint,
        userAuthority,
        userTokenAccount,
        userLpAccount,
    });
}
