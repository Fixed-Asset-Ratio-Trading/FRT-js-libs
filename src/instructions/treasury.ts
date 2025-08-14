import {
    PublicKey,
    TransactionInstruction,
    SystemProgram,
} from '@solana/web3.js';
import BN from 'bn.js';
import { PROGRAM_ID, PoolInstruction, FEES } from '../constants';
import { deriveSystemStatePDA, deriveMainTreasuryPDA, encodeMessage } from '../utils';
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
export function createDonateSolInstruction(params: DonationParams): TransactionInstruction {
    const { donor, amount, message = "" } = params;

    // Derive required PDAs
    const [systemStatePDA] = deriveSystemStatePDA();
    const [mainTreasuryPDA] = deriveMainTreasuryPDA();

    // Encode message with length prefix
    const messageBuffer = encodeMessage(message, 200);

    // Serialize instruction data
    const instructionData = Buffer.concat([
        Buffer.from([PoolInstruction.DonateSol]),
        amount.toArrayLike(Buffer, 'le', 8),
        messageBuffer
    ]);

    return new TransactionInstruction({
        keys: [
            { pubkey: donor, isSigner: true, isWritable: true },
            { pubkey: mainTreasuryPDA, isSigner: false, isWritable: true },
            { pubkey: systemStatePDA, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: instructionData,
    });
}

/**
 * Create an instruction to consolidate pool fees
 * Authority: Public (anyone can trigger fee consolidation)
 * Note: This helps collect fees from pools into the main treasury
 * @param poolStatePDAs - Array of pool state PDAs to consolidate fees from
 * @returns TransactionInstruction
 */
export function createConsolidatePoolFeesInstruction(
    poolStatePDAs: PublicKey[]
): TransactionInstruction {
    // Derive required PDAs
    const [systemStatePDA] = deriveSystemStatePDA();
    const [mainTreasuryPDA] = deriveMainTreasuryPDA();

    // Limit to maximum 20 pools per transaction to avoid account limit
    const limitedPools = poolStatePDAs.slice(0, 20);

    // Serialize instruction data
    const poolCountBuffer = Buffer.alloc(4);
    poolCountBuffer.writeUInt32LE(limitedPools.length, 0);
    
    const instructionData = Buffer.concat([
        Buffer.from([PoolInstruction.ConsolidatePoolFees]),
        poolCountBuffer
    ]);

    // Build accounts array
    const accounts = [
        { pubkey: systemStatePDA, isSigner: false, isWritable: false },
        { pubkey: mainTreasuryPDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        // Add pool state PDAs
        ...limitedPools.map(poolPDA => ({
            pubkey: poolPDA,
            isSigner: false,
            isWritable: true
        }))
    ];

    return new TransactionInstruction({
        keys: accounts,
        programId: PROGRAM_ID,
        data: instructionData,
    });
}

/**
 * Validate donation parameters
 * @param params - Donation parameters
 * @returns Validation result
 */
export function validateDonationParams(params: DonationParams): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Check minimum donation amount
    if (params.amount.lt(FEES.MIN_DONATION_AMOUNT)) {
        errors.push(`Minimum donation is ${FEES.MIN_DONATION_AMOUNT.toNumber() / 1e9} SOL`);
    }

    // Check maximum reasonable donation (to prevent overflow)
    const maxDonation = new BN(1000).mul(new BN(1e9)); // 1000 SOL max
    if (params.amount.gt(maxDonation)) {
        errors.push("Donation amount too large (max 1000 SOL)");
    }

    // Check message length
    if (params.message && params.message.length > 200) {
        errors.push("Message too long (max 200 characters)");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validate pool consolidation parameters
 * @param poolStatePDAs - Array of pool PDAs
 * @returns Validation result
 */
export function validateConsolidationParams(poolStatePDAs: PublicKey[]): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (poolStatePDAs.length === 0) {
        errors.push("At least one pool must be specified");
    }

    if (poolStatePDAs.length > 20) {
        errors.push("Maximum 20 pools per consolidation transaction");
    }

    // Check for duplicate pools
    const uniquePools = new Set(poolStatePDAs.map(p => p.toBase58()));
    if (uniquePools.size !== poolStatePDAs.length) {
        errors.push("Duplicate pools found in consolidation list");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Calculate donation compute units based on amount
 * Larger donations require more compute units for processing
 * @param donationAmount - Donation amount in lamports
 * @returns Estimated compute units needed
 */
export function calculateDonationComputeUnits(donationAmount: BN): number {
    const baseUnits = 5000;
    const oneSOL = new BN(1e9);
    
    // Add extra CUs for large donations
    if (donationAmount.gte(oneSOL.mul(new BN(100)))) {
        return 120000; // 100+ SOL donations
    } else if (donationAmount.gte(oneSOL.mul(new BN(10)))) {
        return 80000;  // 10+ SOL donations
    } else if (donationAmount.gte(oneSOL)) {
        return 40000;  // 1+ SOL donations
    } else {
        return baseUnits; // Small donations
    }
}

/**
 * Calculate consolidation compute units based on pool count
 * @param poolCount - Number of pools to consolidate
 * @returns Estimated compute units needed
 */
export function calculateConsolidationComputeUnits(poolCount: number): number {
    const baseCUs = 4000;
    const perPoolCUs = 5000;
    return baseCUs + (poolCount * perPoolCUs);
}

/**
 * Helper to create donation instruction with display amount
 * @param donor - Donor's public key
 * @param amountSOL - Amount in SOL (display units)
 * @param message - Optional message
 * @returns TransactionInstruction
 */
export function createDonationInstructionWithDisplayAmount(
    donor: PublicKey,
    amountSOL: number,
    message?: string
): TransactionInstruction {
    const amount = new BN(amountSOL * 1e9); // Convert SOL to lamports
    
    return createDonateSolInstruction({
        donor,
        amount,
        message,
    });
}

/**
 * Get minimum donation amount in SOL
 * @returns Minimum donation in SOL
 */
export function getMinDonationSOL(): number {
    return FEES.MIN_DONATION_AMOUNT.toNumber() / 1e9;
}

/**
 * Format donation amount for display
 * @param lamports - Amount in lamports
 * @returns Formatted string with SOL amount
 */
export function formatDonationAmount(lamports: BN): string {
    const sol = lamports.toNumber() / 1e9;
    return `${sol.toFixed(9)} SOL`;
}

/**
 * Estimate total cost for donation (including transaction fees)
 * @param donationAmount - Donation amount in lamports
 * @param priorityFee - Optional priority fee in lamports
 * @returns Total cost breakdown
 */
export function estimateDonationCost(
    donationAmount: BN,
    priorityFee: BN = new BN(0)
): {
    donation: BN;
    transactionFee: BN;
    priorityFee: BN;
    total: BN;
} {
    const transactionFee = new BN(5000); // Base transaction fee (~0.000005 SOL)
    
    return {
        donation: donationAmount,
        transactionFee,
        priorityFee,
        total: donationAmount.add(transactionFee).add(priorityFee),
    };
}
