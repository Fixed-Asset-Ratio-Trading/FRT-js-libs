"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContractVersion = getContractVersion;
exports.getTreasuryInfo = getTreasuryInfo;
exports.createGetTreasuryInfoInstruction = createGetTreasuryInfoInstruction;
exports.createGetVersionInstruction = createGetVersionInstruction;
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const constants_1 = require("../constants");
const utils_1 = require("../utils");
/**
 * Public read-only functions that don't require special authority
 */
/**
 * Get contract version information
 * This is a read-only operation that returns version info via program logs
 * @param connection - Solana connection
 * @returns Promise<string> - Version information extracted from logs
 */
async function getContractVersion(connection) {
    try {
        // Create instruction
        const instruction = new web3_js_1.TransactionInstruction({
            keys: [], // No accounts needed for version check
            programId: constants_1.PROGRAM_ID,
            data: Buffer.from([constants_1.PoolInstruction.GetVersion]),
        });
        // Create a v0 message and versioned transaction for simulation
        const payer = web3_js_1.Keypair.generate();
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        const message = new web3_js_1.TransactionMessage({
            payerKey: payer.publicKey,
            recentBlockhash: blockhash,
            instructions: [instruction],
        }).compileToV0Message();
        const vtx = new web3_js_1.VersionedTransaction(message);
        vtx.sign([payer]);
        // Simulate the versioned transaction to get logs
        const simulation = await connection.simulateTransaction(vtx);
        if (simulation.value.err) {
            // Even with AccountNotFound, we can extract version from logs
            const logs = simulation.value.logs || [];
            return extractVersionFromLogs(logs);
        }
        const logs = simulation.value.logs || [];
        return extractVersionFromLogs(logs);
    }
    catch (error) {
        throw new Error(`Failed to get contract version: ${error.message}`);
    }
}
/**
 * Extract version information from program logs
 * @param logs - Array of log strings
 * @returns Formatted version string
 */
function extractVersionFromLogs(logs) {
    const versionInfo = {};
    for (const log of logs) {
        // Look for version-related log entries
        if (log.includes('Contract Name:')) {
            versionInfo.name = log.split('Contract Name:')[1]?.trim();
        }
        if (log.includes('Contract Version:')) {
            versionInfo.version = log.split('Contract Version:')[1]?.trim();
        }
        if (log.includes('Build Date:')) {
            versionInfo.buildDate = log.split('Build Date:')[1]?.trim();
        }
        if (log.includes('Rust Version:')) {
            versionInfo.rustVersion = log.split('Rust Version:')[1]?.trim();
        }
    }
    if (Object.keys(versionInfo).length === 0) {
        return 'Version information not available in logs';
    }
    // Format the version information
    const parts = [];
    if (versionInfo.name)
        parts.push(`Name: ${versionInfo.name}`);
    if (versionInfo.version)
        parts.push(`Version: ${versionInfo.version}`);
    if (versionInfo.buildDate)
        parts.push(`Build: ${versionInfo.buildDate}`);
    if (versionInfo.rustVersion)
        parts.push(`Rust: ${versionInfo.rustVersion}`);
    return parts.join(' | ');
}
/**
 * Get treasury information
 * This function retrieves current treasury state including balance and statistics
 * @param connection - Solana connection
 * @returns Promise<TreasuryInfo> - Treasury information
 */
async function getTreasuryInfo(connection) {
    try {
        // Derive PDAs
        const [systemStatePDA] = (0, utils_1.deriveSystemStatePDA)();
        const [mainTreasuryPDA] = (0, utils_1.deriveMainTreasuryPDA)();
        // Create instruction
        const instruction = new web3_js_1.TransactionInstruction({
            keys: [
                { pubkey: systemStatePDA, isSigner: false, isWritable: false },
                { pubkey: mainTreasuryPDA, isSigner: false, isWritable: false },
            ],
            programId: constants_1.PROGRAM_ID,
            data: Buffer.from([constants_1.PoolInstruction.GetTreasuryInfo]),
        });
        // Create versioned transaction for simulation
        const payer = web3_js_1.Keypair.generate();
        const { blockhash } = await connection.getLatestBlockhash();
        const message = new web3_js_1.TransactionMessage({
            payerKey: payer.publicKey,
            recentBlockhash: blockhash,
            instructions: [instruction],
        }).compileToV0Message();
        const vtx = new web3_js_1.VersionedTransaction(message);
        vtx.sign([payer]);
        // Simulate to get logs
        const simulation = await connection.simulateTransaction(vtx);
        if (simulation.value.err) {
            throw new Error(`Treasury info simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }
        const logs = simulation.value.logs || [];
        return parseTreasuryInfoFromLogs(logs);
    }
    catch (error) {
        throw new Error(`Failed to get treasury info: ${error.message}`);
    }
}
/**
 * Parse treasury information from program logs
 * @param logs - Array of log strings
 * @returns TreasuryInfo object
 */
function parseTreasuryInfoFromLogs(logs) {
    const info = {};
    for (const log of logs) {
        // Parse different treasury metrics from logs
        if (log.includes('Total Balance:')) {
            const match = log.match(/Total Balance:\s*(\d+)/);
            if (match)
                info.totalBalance = new bn_js_1.default(match[1]);
        }
        if (log.includes('Total Fees Collected:')) {
            const match = log.match(/Total Fees Collected:\s*(\d+)/);
            if (match)
                info.totalFeesCollected = new bn_js_1.default(match[1]);
        }
        if (log.includes('Last Withdrawal:')) {
            const match = log.match(/Last Withdrawal:\s*(\d+)/);
            if (match)
                info.lastWithdrawalTime = new bn_js_1.default(match[1]);
        }
        if (log.includes('Withdrawal Count:')) {
            const match = log.match(/Withdrawal Count:\s*(\d+)/);
            if (match)
                info.withdrawalCount = parseInt(match[1]);
        }
        if (log.includes('Donation Count:')) {
            const match = log.match(/Donation Count:\s*(\d+)/);
            if (match)
                info.donationCount = parseInt(match[1]);
        }
        if (log.includes('Total Donations:')) {
            const match = log.match(/Total Donations:\s*(\d+)/);
            if (match)
                info.totalDonations = new bn_js_1.default(match[1]);
        }
    }
    // Provide defaults for any missing values
    return {
        totalBalance: info.totalBalance || new bn_js_1.default(0),
        totalFeesCollected: info.totalFeesCollected || new bn_js_1.default(0),
        lastWithdrawalTime: info.lastWithdrawalTime || new bn_js_1.default(0),
        withdrawalCount: info.withdrawalCount || 0,
        donationCount: info.donationCount || 0,
        totalDonations: info.totalDonations || new bn_js_1.default(0),
    };
}
/**
 * Create a get treasury info instruction for manual transaction building
 * @returns TransactionInstruction
 */
function createGetTreasuryInfoInstruction() {
    const [systemStatePDA] = (0, utils_1.deriveSystemStatePDA)();
    const [mainTreasuryPDA] = (0, utils_1.deriveMainTreasuryPDA)();
    return new web3_js_1.TransactionInstruction({
        keys: [
            { pubkey: systemStatePDA, isSigner: false, isWritable: false },
            { pubkey: mainTreasuryPDA, isSigner: false, isWritable: false },
        ],
        programId: constants_1.PROGRAM_ID,
        data: Buffer.from([constants_1.PoolInstruction.GetTreasuryInfo]),
    });
}
/**
 * Create a get version instruction for manual transaction building
 * @returns TransactionInstruction
 */
function createGetVersionInstruction() {
    return new web3_js_1.TransactionInstruction({
        keys: [], // No accounts needed
        programId: constants_1.PROGRAM_ID,
        data: Buffer.from([constants_1.PoolInstruction.GetVersion]),
    });
}
