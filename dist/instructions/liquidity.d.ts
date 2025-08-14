import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import { LiquidityParams } from '../types';
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
export declare function createDepositInstruction(params: LiquidityParams): TransactionInstruction;
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
export declare function createWithdrawInstruction(poolStatePDA: PublicKey, withdrawAmount: BN, withdrawTokenMint: PublicKey, userAuthority: PublicKey, userLpAccount: PublicKey, userTokenAccount: PublicKey): TransactionInstruction;
/**
 * Calculate required liquidity amounts for deposit
 * @param depositAmount - Amount of the deposit token
 * @param depositTokenMint - Token being deposited
 * @param poolRatioA - Pool ratio for token A
 * @param poolRatioB - Pool ratio for token B
 * @param tokenAMint - Token A mint
 * @returns Object with required amounts
 */
export declare function calculateDepositAmounts(depositAmount: BN, depositTokenMint: PublicKey, poolRatioA: BN, poolRatioB: BN, tokenAMint: PublicKey): {
    tokenAAmount: BN;
    tokenBAmount: BN;
    isDepositingTokenA: boolean;
};
/**
 * Calculate expected LP tokens to receive from deposit
 * Note: This is an approximation - actual LP tokens depend on current pool state
 * @param depositAmount - Amount being deposited
 * @param currentPoolBalance - Current balance of the deposit token in pool
 * @param currentLpSupply - Current LP token supply for the deposit token
 * @returns Estimated LP tokens to receive
 */
export declare function estimateLPTokensFromDeposit(depositAmount: BN, currentPoolBalance: BN, currentLpSupply: BN): BN;
/**
 * Calculate expected tokens to receive from LP withdrawal
 * @param lpAmount - Amount of LP tokens to burn
 * @param currentPoolBalance - Current balance of the token in pool
 * @param currentLpSupply - Current LP token supply
 * @returns Expected tokens to receive
 */
export declare function estimateTokensFromWithdraw(lpAmount: BN, currentPoolBalance: BN, currentLpSupply: BN): BN;
/**
 * Validate liquidity deposit parameters
 * @param params - Deposit parameters
 * @returns Validation result
 */
export declare function validateDepositParams(params: LiquidityParams): {
    isValid: boolean;
    errors: string[];
};
/**
 * Validate withdrawal parameters
 * @param withdrawAmount - LP tokens to burn
 * @param userLpBalance - User's current LP token balance
 * @returns Validation result
 */
export declare function validateWithdrawParams(withdrawAmount: BN, userLpBalance: BN): {
    isValid: boolean;
    errors: string[];
};
/**
 * Calculate deposit fee in SOL
 * @returns Deposit fee in lamports
 */
export declare function getDepositFee(): BN;
/**
 * Calculate withdrawal fee in SOL
 * @returns Withdrawal fee in lamports
 */
export declare function getWithdrawalFee(): BN;
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
export declare function createDepositInstructionWithDisplayAmount(poolStatePDA: PublicKey, depositAmountDisplay: number, tokenDecimals: number, depositTokenMint: PublicKey, userAuthority: PublicKey, userTokenAccount: PublicKey, userLpAccount: PublicKey): TransactionInstruction;
