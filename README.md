# Fixed Ratio Trading JavaScript Library

A comprehensive JavaScript/TypeScript library for interacting with the Fixed Ratio Trading protocol on Solana. This library provides all functions that can be used by any user without requiring program upgrade authority.

## Features

- 🔧 **Pool Management**: Create fixed-ratio liquidity pools
- 💧 **Liquidity Operations**: Deposit and withdraw liquidity with LP tokens
- 🔄 **Swap Operations**: Execute fixed-ratio swaps with slippage protection
- 💰 **Treasury Operations**: Donate SOL and consolidate pool fees
- 📊 **Read Operations**: Get contract version and treasury information
- 🛡️ **Type Safety**: Full TypeScript support with comprehensive type definitions
- 🧮 **Utilities**: Helper functions for calculations and validations

## Installation

```bash
npm install frt-js-lib
```

Or with yarn:

```bash
yarn add frt-js-lib
```

## Quick Start

```typescript
import { FixedRatioTradingClient, Connection, PublicKey } from 'frt-js-lib';

// Initialize client
const connection = new Connection('https://api.mainnet-beta.solana.com');
const client = new FixedRatioTradingClient(connection);

// Get contract version
const version = await client.getContractVersion();
console.log('Contract version:', version);

// Get treasury information
const treasuryInfo = await client.getTreasuryInfo();
console.log('Treasury balance:', treasuryInfo.totalBalance.toString());
```

## Usage Examples

### Creating a Pool

```typescript
import { PublicKey, BN } from 'frt-js-lib';

const userAuthority = new PublicKey('YOUR_WALLET_PUBLIC_KEY');
const tokenAMint = new PublicKey('TOKEN_A_MINT');
const tokenBMint = new PublicKey('TOKEN_B_MINT');

// Create pool with 1:160 ratio (e.g., 1 SOL = 160 USDC)
const instruction = client.createPoolWithDisplayAmounts(
    userAuthority,
    tokenAMint,
    tokenBMint,
    1.0,    // 1 SOL
    160.0,  // 160 USDC
    9,      // SOL decimals
    6       // USDC decimals
);

// Add to transaction and send
const transaction = new Transaction().add(instruction);
// ... sign and send transaction
```

### Adding Liquidity

```typescript
import { LiquidityParams } from 'frt-js-lib';

const depositParams: LiquidityParams = {
    poolStatePDA: poolPDA,
    depositAmount: client.toBasisPoints(10, 9), // 10 SOL
    depositTokenMint: tokenAMint,
    userAuthority: wallet.publicKey,
    userTokenAccount: userTokenAccount,
    userLpAccount: userLPAccount,
};

const depositInstruction = client.createDepositInstruction(depositParams);
```

### Executing a Swap

```typescript
import { SwapParams } from 'frt-js-lib';

const swapParams: SwapParams = {
    poolStatePDA: poolPDA,
    amountIn: client.toBasisPoints(1, 9), // 1 SOL
    expectedAmountOut: client.toBasisPoints(160, 6), // 160 USDC
    inputTokenMint: tokenAMint,
    userAuthority: wallet.publicKey,
    userInputAccount: userSOLAccount,
    userOutputAccount: userUSDCAccount,
    slippageTolerance: 1, // 1% slippage
};

const swapInstruction = client.createSwapInstruction(swapParams);
```

### Donating SOL

```typescript
import { DonationParams } from 'frt-js-lib';

const donationParams: DonationParams = {
    donor: wallet.publicKey,
    amount: client.toBasisPoints(0.5, 9), // 0.5 SOL
    message: "Thanks for the great protocol!",
};

const donateInstruction = client.createDonateSolInstruction(donationParams);
```

## Available Functions

### Public Read-Only Functions
- `getContractVersion()` - Get contract version information
- `getTreasuryInfo()` - Get treasury statistics and balance

### Pool Management (Any User)
- `createInitializePoolInstruction()` - Create a new fixed-ratio pool
- `getPoolPDAs()` - Get all PDAs associated with a pool
- `doesPoolExist()` - Check if a pool exists

### Liquidity Operations (Any User)
- `createDepositInstruction()` - Add liquidity to a pool
- `createWithdrawInstruction()` - Remove liquidity from a pool
- `calculateDepositAmounts()` - Calculate required token amounts

### Swap Operations (Any User*)
- `createSwapInstruction()` - Execute a fixed-ratio swap
- `calculateExpectedSwapOutput()` - Calculate expected swap output
- `calculateSwapWithPriceImpact()` - Calculate swap with price impact analysis

*Unless pool is in owner-only mode

### Treasury Operations (Any User)
- `createDonateSolInstruction()` - Donate SOL to support development
- `createConsolidatePoolFeesInstruction()` - Consolidate fees from multiple pools

## Fees

| Operation | Fee | Description |
|-----------|-----|-------------|
| Pool Creation | 1.15 SOL | One-time registration fee |
| Deposit/Withdraw | 0.0013 SOL | Per liquidity operation |
| Swap | 0.00002715 SOL | Per swap transaction |
| Donation | None | Minimum 0.1 SOL |

## Utility Functions

The library includes helpful utility functions:

```typescript
// Convert display amounts to basis points
const lamports = client.toBasisPoints(1.5, 9); // 1.5 SOL to lamports

// Convert basis points to display amounts
const sol = client.fromBasisPoints(lamports, 9); // lamports to SOL

// Parse error codes from transaction logs
const errorCode = client.parseErrorCode(transactionLogs);
const errorMessage = client.formatError(errorCode);

// Derive PDAs
const [systemStatePDA] = deriveSystemStatePDA();
const [poolStatePDA] = derivePoolStatePDA(tokenA, tokenB, ratioA, ratioB);
```

## Error Handling

The library provides comprehensive error handling:

```typescript
try {
    const signature = await sendAndConfirmTransaction(connection, transaction, [wallet]);
} catch (error) {
    if (error.logs) {
        const errorCode = client.parseErrorCode(error.logs);
        const errorMessage = client.formatError(errorCode);
        console.error('Transaction failed:', errorMessage);
    }
}
```

## Type Safety

The library is fully typed for TypeScript development:

```typescript
import {
    PoolInfo,
    TreasuryInfo,
    SwapResult,
    LiquidityResult,
    ErrorInfo,
} from 'frt-js-lib';
```

## Constants

Important constants are exported for your convenience:

```typescript
import {
    PROGRAM_ID,
    FEES,
    COMPUTE_UNITS,
    ERROR_CODES,
} from 'frt-js-lib';

console.log('Program ID:', PROGRAM_ID.toString());
console.log('Pool creation fee:', FEES.REGISTRATION_FEE.toString());
```

## Network Support

- **Mainnet**: `4aeVqtWhrUh6wpX8acNj2hpWXKEQwxjA3PYb2sHhNyCn`
- **Devnet/Testnet**: Contact support for deployment addresses

## Requirements

- Node.js 16+ 
- @solana/web3.js ^1.70.0
- @solana/spl-token ^0.3.0
- bn.js ^5.2.0

## Support

- **Documentation**: See `/api` directory for complete API reference
- **Email**: support@davincicodes.net
- **Issues**: Fee modifications and custom integrations available on request

## Contributing

Contributions welcome! Please ensure all functions maintain compatibility with the existing API and don't require upgrade authority.

## License

MIT License - see LICENSE file for details.

---

*This library provides access to user-accessible functions only. Administrative functions requiring program upgrade authority are not included.*
