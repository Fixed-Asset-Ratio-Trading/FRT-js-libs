import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import { DonationParams } from '../types';
/**
 * Treasury operations available to all users
 */
/**
 * Create an instruction to donate SOL to support development
 * Authority: Any user
 * Minimum: 0.1 SOL
 * @param params - Donation parameters
 * @returns TransactionInstruction
 */
export declare function createDonateSolInstruction(params: DonationParams): TransactionInstruction;
/**
 * Create an instruction to consolidate pool fees
 * Authority: Public (anyone can trigger fee consolidation)
 * Note: This helps collect fees from pools into the main treasury
 * @param poolStatePDAs - Array of pool state PDAs to consolidate fees from
 * @returns TransactionInstruction
 */
export declare function createConsolidatePoolFeesInstruction(poolStatePDAs: PublicKey[]): TransactionInstruction;
/**
 * Validate donation parameters
 * @param params - Donation parameters
 * @returns Validation result
 */
export declare function validateDonationParams(params: DonationParams): {
    isValid: boolean;
    errors: string[];
};
/**
 * Validate pool consolidation parameters
 * @param poolStatePDAs - Array of pool PDAs
 * @returns Validation result
 */
export declare function validateConsolidationParams(poolStatePDAs: PublicKey[]): {
    isValid: boolean;
    errors: string[];
};
/**
 * Calculate donation compute units based on amount
 * Larger donations require more compute units for processing
 * @param donationAmount - Donation amount in lamports
 * @returns Estimated compute units needed
 */
export declare function calculateDonationComputeUnits(donationAmount: BN): number;
/**
 * Calculate consolidation compute units based on pool count
 * @param poolCount - Number of pools to consolidate
 * @returns Estimated compute units needed
 */
export declare function calculateConsolidationComputeUnits(poolCount: number): number;
/**
 * Helper to create donation instruction with display amount
 * @param donor - Donor's public key
 * @param amountSOL - Amount in SOL (display units)
 * @param message - Optional message
 * @returns TransactionInstruction
 */
export declare function createDonationInstructionWithDisplayAmount(donor: PublicKey, amountSOL: number, message?: string): TransactionInstruction;
/**
 * Get minimum donation amount in SOL
 * @returns Minimum donation in SOL
 */
export declare function getMinDonationSOL(): number;
/**
 * Format donation amount for display
 * @param lamports - Amount in lamports
 * @returns Formatted string with SOL amount
 */
export declare function formatDonationAmount(lamports: BN): string;
/**
 * Estimate total cost for donation (including transaction fees)
 * @param donationAmount - Donation amount in lamports
 * @param priorityFee - Optional priority fee in lamports
 * @returns Total cost breakdown
 */
export declare function estimateDonationCost(donationAmount: BN, priorityFee?: BN): {
    donation: BN;
    transactionFee: BN;
    priorityFee: BN;
    total: BN;
};
