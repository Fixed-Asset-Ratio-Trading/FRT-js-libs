"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODES = exports.SEEDS = exports.COMPUTE_UNITS = exports.FEES = exports.PoolInstruction = exports.PROGRAM_ID = void 0;
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
/**
 * Fixed Ratio Trading Program Constants
 */
// Program ID for the Fixed Ratio Trading contract on Solana Mainnet
exports.PROGRAM_ID = new web3_js_1.PublicKey("4aeVqtWhrUh6wpX8acNj2hpWXKEQwxjA3PYb2sHhNyCn");
// Instruction enum matching the contract
exports.PoolInstruction = {
    // System Management
    InitializeProgram: 0,
    PauseSystem: 1,
    UnpauseSystem: 2,
    GetVersion: 14, // Read-only version info
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
};
// Fee constants (in lamports)
exports.FEES = {
    REGISTRATION_FEE: new bn_js_1.default(1150000000), // 1.15 SOL for pool creation
    DEPOSIT_WITHDRAWAL_FEE: new bn_js_1.default(1300000), // 0.0013 SOL for liquidity operations
    SWAP_CONTRACT_FEE: new bn_js_1.default(27150), // 0.00002715 SOL for swaps
    MIN_DONATION_AMOUNT: new bn_js_1.default(100000000), // 0.1 SOL minimum donation
};
// Compute unit limits for different operations
exports.COMPUTE_UNITS = {
    GET_VERSION: 50000,
    INITIALIZE_POOL: 500000,
    DEPOSIT: 310000,
    WITHDRAW: 310000,
    SWAP: 250000,
    GET_TREASURY_INFO: 50000,
    DONATE_SOL: 120000, // Variable based on amount
    CONSOLIDATE_POOL_FEES: 54000, // For ~10 pools
};
// PDA seed constants
exports.SEEDS = {
    SYSTEM_STATE: "system_state",
    MAIN_TREASURY: "main_treasury",
    POOL_STATE_V2: "pool_state_v2",
    TOKEN_A_VAULT: "token_a_vault",
    TOKEN_B_VAULT: "token_b_vault",
    LP_TOKEN_A_MINT: "lp_token_a_mint",
    LP_TOKEN_B_MINT: "lp_token_b_mint",
};
// Error codes from the contract
exports.ERROR_CODES = {
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
};
