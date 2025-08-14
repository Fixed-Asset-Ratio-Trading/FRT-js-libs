import { Connection, TransactionInstruction } from '@solana/web3.js';
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
export declare function getContractVersion(connection: Connection): Promise<string>;
/**
 * Get treasury information
 * This function retrieves current treasury state including balance and statistics
 * @param connection - Solana connection
 * @returns Promise<TreasuryInfo> - Treasury information
 */
export declare function getTreasuryInfo(connection: Connection): Promise<TreasuryInfo>;
/**
 * Create a get treasury info instruction for manual transaction building
 * @returns TransactionInstruction
 */
export declare function createGetTreasuryInfoInstruction(): TransactionInstruction;
/**
 * Create a get version instruction for manual transaction building
 * @returns TransactionInstruction
 */
export declare function createGetVersionInstruction(): TransactionInstruction;
