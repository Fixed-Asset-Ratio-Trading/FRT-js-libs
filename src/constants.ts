import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

/**
 * Fixed Ratio Trading Program Constants
 */

// Program ID for the Fixed Ratio Trading contract on Solana Mainnet
export const PROGRAM_ID = new PublicKey("4aeVqtWhrUh6wpX8acNj2hpWXKEQwxjA3PYb2sHhNyCn");

// Instruction enum matching the contract
export const PoolInstruction = {
    // System Management
    InitializeProgram: 0,
    PauseSystem: 1,
    UnpauseSystem: 2,
    GetVersion: 14,  // Read-only version info
    
    // Pool Management  
    InitializePool: 3,
    PausePool: 4,
    UnpausePool: 5,
    UpdatePoolFees: 6,
    
    // Liquidity Operations
    Deposit: 7,
    Withdraw: 8,
    
    // Swap Operations
    Swap: 9,
    SetSwapOwnerOnly: 10,
    
    // Treasury Operations
    WithdrawTreasuryFees: 11,
    GetTreasuryInfo: 12,
    DonateSol: 13,
    ConsolidatePoolFees: 15, // Note: Updated instruction number
} as const;

// Fee constants (in lamports)
export const FEES = {
    REGISTRATION_FEE: new BN(1_150_000_000), // 1.15 SOL for pool creation
    DEPOSIT_WITHDRAWAL_FEE: new BN(1_300_000), // 0.0013 SOL for liquidity operations
    SWAP_CONTRACT_FEE: new BN(27_150), // 0.00002715 SOL for swaps
    MIN_DONATION_AMOUNT: new BN(100_000_000), // 0.1 SOL minimum donation
} as const;

// Compute unit limits for different operations
export const COMPUTE_UNITS = {
    GET_VERSION: 50_000,
    INITIALIZE_POOL: 500_000,
    DEPOSIT: 310_000,
    WITHDRAW: 310_000,
    SWAP: 250_000,
    GET_TREASURY_INFO: 50_000,
    DONATE_SOL: 120_000, // Variable based on amount
    CONSOLIDATE_POOL_FEES: 54_000, // For ~10 pools
} as const;

// PDA seed constants
export const SEEDS = {
    SYSTEM_STATE: "system_state",
    MAIN_TREASURY: "main_treasury", 
    POOL_STATE_V2: "pool_state_v2",
    TOKEN_A_VAULT: "token_a_vault",
    TOKEN_B_VAULT: "token_b_vault",
    LP_TOKEN_A_MINT: "lp_token_a_mint",
    LP_TOKEN_B_MINT: "lp_token_b_mint",
} as const;

// Error codes from the contract
export const ERROR_CODES = {
    SystemPaused: 6006,
    PoolPaused: 6007,
    SlippageExceeded: 6008,
    InsufficientBalance: 6009,
    InvalidAmount: 6010,
    InvalidRatio: 6011,
    PoolAlreadyExists: 6012,
    PoolNotFound: 6013,
    Unauthorized: 6014,
    InvalidTokenMint: 6015,
    InvalidAccount: 6016,
} as const;
