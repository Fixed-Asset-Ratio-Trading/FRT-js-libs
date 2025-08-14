import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
/**
 * Fixed Ratio Trading Program Constants
 */
export declare const PROGRAM_ID: PublicKey;
export declare const PoolInstruction: {
    readonly InitializeProgram: 0;
    readonly PauseSystem: 1;
    readonly UnpauseSystem: 2;
    readonly GetVersion: 14;
    readonly InitializePool: 3;
    readonly PausePool: 4;
    readonly UnpausePool: 5;
    readonly UpdatePoolFees: 6;
    readonly Deposit: 7;
    readonly Withdraw: 8;
    readonly Swap: 9;
    readonly SetSwapOwnerOnly: 10;
    readonly WithdrawTreasuryFees: 11;
    readonly GetTreasuryInfo: 12;
    readonly DonateSol: 13;
    readonly ConsolidatePoolFees: 15;
};
export declare const FEES: {
    readonly REGISTRATION_FEE: BN;
    readonly DEPOSIT_WITHDRAWAL_FEE: BN;
    readonly SWAP_CONTRACT_FEE: BN;
    readonly MIN_DONATION_AMOUNT: BN;
};
export declare const COMPUTE_UNITS: {
    readonly GET_VERSION: 50000;
    readonly INITIALIZE_POOL: 500000;
    readonly DEPOSIT: 310000;
    readonly WITHDRAW: 310000;
    readonly SWAP: 250000;
    readonly GET_TREASURY_INFO: 50000;
    readonly DONATE_SOL: 120000;
    readonly CONSOLIDATE_POOL_FEES: 54000;
};
export declare const SEEDS: {
    readonly SYSTEM_STATE: "system_state";
    readonly MAIN_TREASURY: "main_treasury";
    readonly POOL_STATE_V2: "pool_state_v2";
    readonly TOKEN_A_VAULT: "token_a_vault";
    readonly TOKEN_B_VAULT: "token_b_vault";
    readonly LP_TOKEN_A_MINT: "lp_token_a_mint";
    readonly LP_TOKEN_B_MINT: "lp_token_b_mint";
};
export declare const ERROR_CODES: {
    readonly SystemPaused: 6006;
    readonly PoolPaused: 6007;
    readonly SlippageExceeded: 6008;
    readonly InsufficientBalance: 6009;
    readonly InvalidAmount: 6010;
    readonly InvalidRatio: 6011;
    readonly PoolAlreadyExists: 6012;
    readonly PoolNotFound: 6013;
    readonly Unauthorized: 6014;
    readonly InvalidTokenMint: 6015;
    readonly InvalidAccount: 6016;
};
