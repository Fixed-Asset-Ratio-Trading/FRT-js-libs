/**
 * Fixed Ratio Trading JavaScript Library
 *
 * A comprehensive JavaScript/TypeScript library for interacting with the Fixed Ratio Trading
 * protocol on Solana. This library provides functions that can be used by any user without
 * requiring program upgrade authority.
 *
 * @author Fixed Ratio Trading Team
 * @version 1.0.0
 */
import { PublicKey, Connection } from '@solana/web3.js';
export * from './constants';
export * from './types';
export * from './utils';
export * from './instructions/public';
export * from './instructions/pool';
export * from './instructions/liquidity';
export * from './instructions/swap';
export * from './instructions/treasury';
export { PublicKey, Connection, Transaction, TransactionInstruction, Keypair, sendAndConfirmTransaction, LAMPORTS_PER_SOL, } from '@solana/web3.js';
export { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createMintToInstruction, createTransferInstruction, } from '@solana/spl-token';
export { default as BN } from 'bn.js';
export declare const VERSION = "1.0.0";
export declare const PROGRAM_VERSION = "0.14.1040";
/**
 * Main client class for Fixed Ratio Trading operations
 */
export declare class FixedRatioTradingClient {
    connection: Connection;
    programId: PublicKey;
    constructor(connection: Connection, programId?: PublicKey);
    getContractVersion(): Promise<string>;
    getTreasuryInfo(): Promise<import("./types").TreasuryInfo>;
    createInitializePoolInstruction(params: PoolCreationParams): import("@solana/web3.js").TransactionInstruction;
    createPoolWithDisplayAmounts(userAuthority: PublicKey, tokenAMint: PublicKey, tokenBMint: PublicKey, tokenAAmount: number, tokenBAmount: number, tokenADecimals: number, tokenBDecimals: number): import("@solana/web3.js").TransactionInstruction;
    getPoolPDAs(tokenAMint: PublicKey, tokenBMint: PublicKey, ratioA: BN, ratioB: BN): {
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
    doesPoolExist(poolStatePDA: PublicKey): Promise<boolean>;
    createDepositInstruction(params: LiquidityParams): import("@solana/web3.js").TransactionInstruction;
    createWithdrawInstruction(poolStatePDA: PublicKey, withdrawAmount: BN, withdrawTokenMint: PublicKey, userAuthority: PublicKey, userLpAccount: PublicKey, userTokenAccount: PublicKey): import("@solana/web3.js").TransactionInstruction;
    calculateDepositAmounts(depositAmount: BN, depositTokenMint: PublicKey, poolRatioA: BN, poolRatioB: BN, tokenAMint: PublicKey): {
        tokenAAmount: BN;
        tokenBAmount: BN;
        isDepositingTokenA: boolean;
    };
    createSwapInstruction(params: SwapParams): import("@solana/web3.js").TransactionInstruction;
    calculateExpectedSwapOutput(amountIn: BN, inputTokenMint: PublicKey, poolRatioA: BN, poolRatioB: BN, tokenAMint: PublicKey): BN;
    calculateSwapWithPriceImpact(amountIn: BN, inputTokenMint: PublicKey, poolBalanceA: BN, poolBalanceB: BN, tokenAMint: PublicKey): import("./types").SwapResult;
    isPoolPublicSwapEnabled(poolStatePDA: PublicKey): Promise<boolean>;
    createDonateSolInstruction(params: DonationParams): import("@solana/web3.js").TransactionInstruction;
    createConsolidatePoolFeesInstruction(poolStatePDAs: PublicKey[]): import("@solana/web3.js").TransactionInstruction;
    createDonationInstructionWithDisplayAmount(donor: PublicKey, amountSOL: number, message?: string): import("@solana/web3.js").TransactionInstruction;
    toBasisPoints(amount: number, decimals: number): BN;
    fromBasisPoints(basisPoints: BN, decimals: number): number;
    parseErrorCode(logs: string[]): number | null;
    formatError(errorCode: number): string;
}
import { PoolCreationParams, LiquidityParams, SwapParams, DonationParams } from './types';
import BN from 'bn.js';
