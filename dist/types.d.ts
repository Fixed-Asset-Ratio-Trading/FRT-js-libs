import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
/**
 * TypeScript type definitions for Fixed Ratio Trading
 */
export interface PoolInfo {
    poolStatePDA: PublicKey;
    tokenAMint: PublicKey;
    tokenBMint: PublicKey;
    ratioA: BN;
    ratioB: BN;
    tokenAVault: PublicKey;
    tokenBVault: PublicKey;
    lpTokenAMint: PublicKey;
    lpTokenBMint: PublicKey;
    isPaused: boolean;
    liquidityFee: BN;
    swapFee: BN;
}
export interface TreasuryInfo {
    totalBalance: BN;
    totalFeesCollected: BN;
    lastWithdrawalTime: BN;
    withdrawalCount: number;
    donationCount: number;
    totalDonations: BN;
}
export interface SwapResult {
    amountIn: BN;
    amountOut: BN;
    priceImpact: number;
    fees: BN;
}
export interface LiquidityResult {
    tokenAAmount: BN;
    tokenBAmount: BN;
    lpTokensReceived: BN;
    fees: BN;
}
export interface TokenInfo {
    mint: PublicKey;
    decimals: number;
    symbol?: string;
    name?: string;
}
export interface PoolCreationParams {
    tokenAMint: PublicKey;
    tokenBMint: PublicKey;
    ratioA: BN;
    ratioB: BN;
    userAuthority: PublicKey;
}
export interface LiquidityParams {
    poolStatePDA: PublicKey;
    depositAmount: BN;
    depositTokenMint: PublicKey;
    userAuthority: PublicKey;
    userTokenAccount: PublicKey;
    userLpAccount: PublicKey;
}
export interface SwapParams {
    poolStatePDA: PublicKey;
    amountIn: BN;
    expectedAmountOut: BN;
    inputTokenMint: PublicKey;
    userAuthority: PublicKey;
    userInputAccount: PublicKey;
    userOutputAccount: PublicKey;
    slippageTolerance?: number;
}
export interface DonationParams {
    donor: PublicKey;
    amount: BN;
    message?: string;
}
export type PauseReason = 'emergency_stop' | 'maintenance' | 'security_review' | 'upgrade_preparation' | 'regulatory_compliance';
export interface ErrorInfo {
    code: number;
    message: string;
    logs?: string[];
}
