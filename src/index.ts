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

// Import Solana types used in this file for type annotations
import {
    PublicKey,
    Connection,
} from '@solana/web3.js';

// Export constants
export * from './constants';

// Export types
export * from './types';

// Export utilities
export * from './utils';

// Export instruction builders
export * from './instructions/public';
export * from './instructions/pool';
export * from './instructions/liquidity';
export * from './instructions/swap';
export * from './instructions/treasury';

// Re-export commonly used Solana types for convenience
export {
    PublicKey,
    Connection,
    Transaction,
    TransactionInstruction,
    Keypair,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';

export {
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    createMintToInstruction,
    createTransferInstruction,
} from '@solana/spl-token';

export { default as BN } from 'bn.js';

// Export version information
export const VERSION = '1.0.0';
export const PROGRAM_VERSION = '0.14.1040';

/**
 * Main client class for Fixed Ratio Trading operations
 */
export class FixedRatioTradingClient {
    constructor(
        public connection: Connection,
        public programId: PublicKey = PROGRAM_ID
    ) {}

    // Public functions
    async getContractVersion() {
        return getContractVersion(this.connection);
    }

    async getTreasuryInfo() {
        return getTreasuryInfo(this.connection);
    }

    // Pool management
    createInitializePoolInstruction(params: PoolCreationParams) {
        return createInitializePoolInstruction(params);
    }

    createPoolWithDisplayAmounts(
        userAuthority: PublicKey,
        tokenAMint: PublicKey,
        tokenBMint: PublicKey,
        tokenAAmount: number,
        tokenBAmount: number,
        tokenADecimals: number,
        tokenBDecimals: number
    ) {
        return createPoolWithDisplayAmounts(
            userAuthority,
            tokenAMint,
            tokenBMint,
            tokenAAmount,
            tokenBAmount,
            tokenADecimals,
            tokenBDecimals
        );
    }

    getPoolPDAs(
        tokenAMint: PublicKey,
        tokenBMint: PublicKey,
        ratioA: BN,
        ratioB: BN
    ) {
        return getPoolPDAs(tokenAMint, tokenBMint, ratioA, ratioB);
    }

    async doesPoolExist(poolStatePDA: PublicKey) {
        return doesPoolExist(this.connection, poolStatePDA);
    }

    // Liquidity operations
    createDepositInstruction(params: LiquidityParams) {
        return createDepositInstruction(params);
    }

    createWithdrawInstruction(
        poolStatePDA: PublicKey,
        withdrawAmount: BN,
        withdrawTokenMint: PublicKey,
        userAuthority: PublicKey,
        userLpAccount: PublicKey,
        userTokenAccount: PublicKey
    ) {
        return createWithdrawInstruction(
            poolStatePDA,
            withdrawAmount,
            withdrawTokenMint,
            userAuthority,
            userLpAccount,
            userTokenAccount
        );
    }

    calculateDepositAmounts(
        depositAmount: BN,
        depositTokenMint: PublicKey,
        poolRatioA: BN,
        poolRatioB: BN,
        tokenAMint: PublicKey
    ) {
        return calculateDepositAmounts(
            depositAmount,
            depositTokenMint,
            poolRatioA,
            poolRatioB,
            tokenAMint
        );
    }

    // Swap operations
    createSwapInstruction(params: SwapParams) {
        return createSwapInstruction(params);
    }

    calculateExpectedSwapOutput(
        amountIn: BN,
        inputTokenMint: PublicKey,
        poolRatioA: BN,
        poolRatioB: BN,
        tokenAMint: PublicKey
    ) {
        return calculateExpectedSwapOutput(
            amountIn,
            inputTokenMint,
            poolRatioA,
            poolRatioB,
            tokenAMint
        );
    }

    calculateSwapWithPriceImpact(
        amountIn: BN,
        inputTokenMint: PublicKey,
        poolBalanceA: BN,
        poolBalanceB: BN,
        tokenAMint: PublicKey
    ) {
        return calculateSwapWithPriceImpact(
            amountIn,
            inputTokenMint,
            poolBalanceA,
            poolBalanceB,
            tokenAMint
        );
    }

    async isPoolPublicSwapEnabled(poolStatePDA: PublicKey) {
        return isPoolPublicSwapEnabled(this.connection, poolStatePDA);
    }

    // Treasury operations
    createDonateSolInstruction(params: DonationParams) {
        return createDonateSolInstruction(params);
    }

    createConsolidatePoolFeesInstruction(poolStatePDAs: PublicKey[]) {
        return createConsolidatePoolFeesInstruction(poolStatePDAs);
    }

    createDonationInstructionWithDisplayAmount(
        donor: PublicKey,
        amountSOL: number,
        message?: string
    ) {
        return createDonationInstructionWithDisplayAmount(donor, amountSOL, message);
    }

    // Utility functions
    toBasisPoints(amount: number, decimals: number) {
        return toBasisPoints(amount, decimals);
    }

    fromBasisPoints(basisPoints: BN, decimals: number) {
        return fromBasisPoints(basisPoints, decimals);
    }

    parseErrorCode(logs: string[]) {
        return parseErrorCode(logs);
    }

    formatError(errorCode: number) {
        return formatError(errorCode);
    }
}

// Import individual functions for re-export
import { PROGRAM_ID } from './constants';
import {
    getContractVersion,
    getTreasuryInfo,
} from './instructions/public';
import {
    createInitializePoolInstruction,
    createPoolWithDisplayAmounts,
    getPoolPDAs,
    doesPoolExist,
} from './instructions/pool';
import {
    createDepositInstruction,
    createWithdrawInstruction,
    calculateDepositAmounts,
} from './instructions/liquidity';
import {
    createSwapInstruction,
    calculateExpectedSwapOutput,
    calculateSwapWithPriceImpact,
    isPoolPublicSwapEnabled,
} from './instructions/swap';
import {
    createDonateSolInstruction,
    createConsolidatePoolFeesInstruction,
    createDonationInstructionWithDisplayAmount,
} from './instructions/treasury';
import {
    toBasisPoints,
    fromBasisPoints,
    parseErrorCode,
    formatError,
} from './utils';
import { PoolCreationParams, LiquidityParams, SwapParams, DonationParams } from './types';
import BN from 'bn.js';
