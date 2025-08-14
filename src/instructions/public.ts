import {
    Connection,
    PublicKey,
    TransactionInstruction,
    Keypair,
    Transaction,
    VersionedTransaction,
    TransactionMessage,
    ComputeBudgetProgram,
} from '@solana/web3.js';
import BN from 'bn.js';
import { PROGRAM_ID, PoolInstruction, COMPUTE_UNITS } from '../constants';
import { deriveSystemStatePDA, deriveMainTreasuryPDA } from '../utils';
import { TreasuryInfo } from '../types';

/**
 * Public read-only functions that don't require special authority
 */

/**
 * Get contract version information
 * This is a read-only operation that returns version info via program logs
 * @param connection - Solana connection
 * @returns Promise<string> - Version information extracted from logs
 */
export async function getContractVersion(connection: Connection): Promise<string> {
    try {
        // Create instruction
        const instruction = new TransactionInstruction({
            keys: [], // No accounts needed for version check
            programId: PROGRAM_ID,
            data: Buffer.from([PoolInstruction.GetVersion]),
        });

        // Create a v0 message and versioned transaction for simulation
        const payer = Keypair.generate();
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        const message = new TransactionMessage({
            payerKey: payer.publicKey,
            recentBlockhash: blockhash,
            instructions: [instruction],
        }).compileToV0Message();

        const vtx = new VersionedTransaction(message);
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
        
    } catch (error: any) {
        throw new Error(`Failed to get contract version: ${error.message}`);
    }
}

/**
 * Extract version information from program logs
 * @param logs - Array of log strings
 * @returns Formatted version string
 */
function extractVersionFromLogs(logs: string[]): string {
    const versionInfo: Record<string, string> = {};
    
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
    const parts: string[] = [];
    if (versionInfo.name) parts.push(`Name: ${versionInfo.name}`);
    if (versionInfo.version) parts.push(`Version: ${versionInfo.version}`);
    if (versionInfo.buildDate) parts.push(`Build: ${versionInfo.buildDate}`);
    if (versionInfo.rustVersion) parts.push(`Rust: ${versionInfo.rustVersion}`);

    return parts.join(' | ');
}

/**
 * Get treasury information
 * This function retrieves current treasury state including balance and statistics
 * @param connection - Solana connection
 * @returns Promise<TreasuryInfo> - Treasury information
 */
export async function getTreasuryInfo(connection: Connection): Promise<TreasuryInfo> {
    try {
        // Derive PDAs
        const [systemStatePDA] = deriveSystemStatePDA();
        const [mainTreasuryPDA] = deriveMainTreasuryPDA();

        // Create instruction
        const instruction = new TransactionInstruction({
            keys: [
                { pubkey: systemStatePDA, isSigner: false, isWritable: false },
                { pubkey: mainTreasuryPDA, isSigner: false, isWritable: false },
            ],
            programId: PROGRAM_ID,
            data: Buffer.from([PoolInstruction.GetTreasuryInfo]),
        });

        // Create versioned transaction for simulation
        const payer = Keypair.generate();
        const { blockhash } = await connection.getLatestBlockhash();
        const message = new TransactionMessage({
            payerKey: payer.publicKey,
            recentBlockhash: blockhash,
            instructions: [instruction],
        }).compileToV0Message();
        const vtx = new VersionedTransaction(message);
        vtx.sign([payer]);

        // Simulate to get logs
        const simulation = await connection.simulateTransaction(vtx);

        if (simulation.value.err) {
            throw new Error(`Treasury info simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }

        const logs = simulation.value.logs || [];
        return parseTreasuryInfoFromLogs(logs);

    } catch (error: any) {
        throw new Error(`Failed to get treasury info: ${error.message}`);
    }
}

/**
 * Parse treasury information from program logs
 * @param logs - Array of log strings
 * @returns TreasuryInfo object
 */
function parseTreasuryInfoFromLogs(logs: string[]): TreasuryInfo {
    const info: Partial<TreasuryInfo> = {};

    for (const log of logs) {
        // Parse different treasury metrics from logs
        if (log.includes('Total Balance:')) {
            const match = log.match(/Total Balance:\s*(\d+)/);
            if (match) info.totalBalance = new BN(match[1]);
        }
        if (log.includes('Total Fees Collected:')) {
            const match = log.match(/Total Fees Collected:\s*(\d+)/);
            if (match) info.totalFeesCollected = new BN(match[1]);
        }
        if (log.includes('Last Withdrawal:')) {
            const match = log.match(/Last Withdrawal:\s*(\d+)/);
            if (match) info.lastWithdrawalTime = new BN(match[1]);
        }
        if (log.includes('Withdrawal Count:')) {
            const match = log.match(/Withdrawal Count:\s*(\d+)/);
            if (match) info.withdrawalCount = parseInt(match[1]);
        }
        if (log.includes('Donation Count:')) {
            const match = log.match(/Donation Count:\s*(\d+)/);
            if (match) info.donationCount = parseInt(match[1]);
        }
        if (log.includes('Total Donations:')) {
            const match = log.match(/Total Donations:\s*(\d+)/);
            if (match) info.totalDonations = new BN(match[1]);
        }
    }

    // Provide defaults for any missing values
    return {
        totalBalance: info.totalBalance || new BN(0),
        totalFeesCollected: info.totalFeesCollected || new BN(0),
        lastWithdrawalTime: info.lastWithdrawalTime || new BN(0),
        withdrawalCount: info.withdrawalCount || 0,
        donationCount: info.donationCount || 0,
        totalDonations: info.totalDonations || new BN(0),
    };
}

/**
 * Create a get treasury info instruction for manual transaction building
 * @returns TransactionInstruction
 */
export function createGetTreasuryInfoInstruction(): TransactionInstruction {
    const [systemStatePDA] = deriveSystemStatePDA();
    const [mainTreasuryPDA] = deriveMainTreasuryPDA();

    return new TransactionInstruction({
        keys: [
            { pubkey: systemStatePDA, isSigner: false, isWritable: false },
            { pubkey: mainTreasuryPDA, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.from([PoolInstruction.GetTreasuryInfo]),
    });
}

/**
 * Create a get version instruction for manual transaction building
 * @returns TransactionInstruction
 */
export function createGetVersionInstruction(): TransactionInstruction {
    return new TransactionInstruction({
        keys: [], // No accounts needed
        programId: PROGRAM_ID,
        data: Buffer.from([PoolInstruction.GetVersion]),
    });
}
