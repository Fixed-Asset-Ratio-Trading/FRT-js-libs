"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDonateSolInstruction = createDonateSolInstruction;
exports.createConsolidatePoolFeesInstruction = createConsolidatePoolFeesInstruction;
exports.validateDonationParams = validateDonationParams;
exports.validateConsolidationParams = validateConsolidationParams;
exports.calculateDonationComputeUnits = calculateDonationComputeUnits;
exports.calculateConsolidationComputeUnits = calculateConsolidationComputeUnits;
exports.createDonationInstructionWithDisplayAmount = createDonationInstructionWithDisplayAmount;
exports.getMinDonationSOL = getMinDonationSOL;
exports.formatDonationAmount = formatDonationAmount;
exports.estimateDonationCost = estimateDonationCost;
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const constants_1 = require("../constants");
const utils_1 = require("../utils");
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
function createDonateSolInstruction(params) {
    const { donor, amount, message = "" } = params;
    // Derive required PDAs
    const [systemStatePDA] = (0, utils_1.deriveSystemStatePDA)();
    const [mainTreasuryPDA] = (0, utils_1.deriveMainTreasuryPDA)();
    // Encode message with length prefix
    const messageBuffer = (0, utils_1.encodeMessage)(message, 200);
    // Serialize instruction data
    const instructionData = Buffer.concat([
        Buffer.from([constants_1.PoolInstruction.DonateSol]),
        amount.toArrayLike(Buffer, 'le', 8),
        messageBuffer
    ]);
    return new web3_js_1.TransactionInstruction({
        keys: [
            { pubkey: donor, isSigner: true, isWritable: true },
            { pubkey: mainTreasuryPDA, isSigner: false, isWritable: true },
            { pubkey: systemStatePDA, isSigner: false, isWritable: false },
            { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: constants_1.PROGRAM_ID,
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
function createConsolidatePoolFeesInstruction(poolStatePDAs) {
    // Derive required PDAs
    const [systemStatePDA] = (0, utils_1.deriveSystemStatePDA)();
    const [mainTreasuryPDA] = (0, utils_1.deriveMainTreasuryPDA)();
    // Limit to maximum 20 pools per transaction to avoid account limit
    const limitedPools = poolStatePDAs.slice(0, 20);
    // Serialize instruction data
    const poolCountBuffer = Buffer.alloc(4);
    poolCountBuffer.writeUInt32LE(limitedPools.length, 0);
    const instructionData = Buffer.concat([
        Buffer.from([constants_1.PoolInstruction.ConsolidatePoolFees]),
        poolCountBuffer
    ]);
    // Build accounts array
    const accounts = [
        { pubkey: systemStatePDA, isSigner: false, isWritable: false },
        { pubkey: mainTreasuryPDA, isSigner: false, isWritable: true },
        { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
        // Add pool state PDAs
        ...limitedPools.map(poolPDA => ({
            pubkey: poolPDA,
            isSigner: false,
            isWritable: true
        }))
    ];
    return new web3_js_1.TransactionInstruction({
        keys: accounts,
        programId: constants_1.PROGRAM_ID,
        data: instructionData,
    });
}
/**
 * Validate donation parameters
 * @param params - Donation parameters
 * @returns Validation result
 */
function validateDonationParams(params) {
    const errors = [];
    // Check minimum donation amount
    if (params.amount.lt(constants_1.FEES.MIN_DONATION_AMOUNT)) {
        errors.push(`Minimum donation is ${constants_1.FEES.MIN_DONATION_AMOUNT.toNumber() / 1e9} SOL`);
    }
    // Check maximum reasonable donation (to prevent overflow)
    const maxDonation = new bn_js_1.default(1000).mul(new bn_js_1.default(1e9)); // 1000 SOL max
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
function validateConsolidationParams(poolStatePDAs) {
    const errors = [];
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
function calculateDonationComputeUnits(donationAmount) {
    const baseUnits = 5000;
    const oneSOL = new bn_js_1.default(1e9);
    // Add extra CUs for large donations
    if (donationAmount.gte(oneSOL.mul(new bn_js_1.default(100)))) {
        return 120000; // 100+ SOL donations
    }
    else if (donationAmount.gte(oneSOL.mul(new bn_js_1.default(10)))) {
        return 80000; // 10+ SOL donations
    }
    else if (donationAmount.gte(oneSOL)) {
        return 40000; // 1+ SOL donations
    }
    else {
        return baseUnits; // Small donations
    }
}
/**
 * Calculate consolidation compute units based on pool count
 * @param poolCount - Number of pools to consolidate
 * @returns Estimated compute units needed
 */
function calculateConsolidationComputeUnits(poolCount) {
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
function createDonationInstructionWithDisplayAmount(donor, amountSOL, message) {
    const amount = new bn_js_1.default(amountSOL * 1e9); // Convert SOL to lamports
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
function getMinDonationSOL() {
    return constants_1.FEES.MIN_DONATION_AMOUNT.toNumber() / 1e9;
}
/**
 * Format donation amount for display
 * @param lamports - Amount in lamports
 * @returns Formatted string with SOL amount
 */
function formatDonationAmount(lamports) {
    const sol = lamports.toNumber() / 1e9;
    return `${sol.toFixed(9)} SOL`;
}
/**
 * Estimate total cost for donation (including transaction fees)
 * @param donationAmount - Donation amount in lamports
 * @param priorityFee - Optional priority fee in lamports
 * @returns Total cost breakdown
 */
function estimateDonationCost(donationAmount, priorityFee = new bn_js_1.default(0)) {
    const transactionFee = new bn_js_1.default(5000); // Base transaction fee (~0.000005 SOL)
    return {
        donation: donationAmount,
        transactionFee,
        priorityFee,
        total: donationAmount.add(transactionFee).add(priorityFee),
    };
}
