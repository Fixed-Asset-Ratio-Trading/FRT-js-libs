/**
 * Basic usage examples for the Fixed Ratio Trading JavaScript Library
 * 
 * This example demonstrates how to use the library for common operations
 * like creating pools, adding liquidity, swapping, and donating.
 */

const {
    FixedRatioTradingClient,
    Connection,
    PublicKey,
    Transaction,
    Keypair,
    sendAndConfirmTransaction,
    BN,
} = require('frt-js-lib');

// Initialize connection and client
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
const client = new FixedRatioTradingClient(connection);

async function main() {
    console.log('🚀 Fixed Ratio Trading Library - Basic Usage Examples\n');

    try {
        // 1. Get contract version
        console.log('📋 Getting contract version...');
        const version = await client.getContractVersion();
        console.log('Contract version:', version);

        // 2. Get treasury information  
        console.log('\n💰 Getting treasury information...');
        const treasuryInfo = await client.getTreasuryInfo();
        console.log('Treasury balance:', client.fromBasisPoints(treasuryInfo.totalBalance, 9), 'SOL');
        console.log('Total fees collected:', client.fromBasisPoints(treasuryInfo.totalFeesCollected, 9), 'SOL');
        console.log('Total donations:', client.fromBasisPoints(treasuryInfo.totalDonations, 9), 'SOL');

        // Example token mints (replace with actual mints)
        const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112'); // Wrapped SOL
        const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC

        // 3. Create a pool example (simulation only)
        console.log('\n🏊 Creating pool instruction example...');
        const userWallet = Keypair.generate(); // In real usage, use your wallet
        
        const poolInstruction = client.createPoolWithDisplayAmounts(
            userWallet.publicKey,
            SOL_MINT,
            USDC_MINT,
            1.0,    // 1 SOL
            160.0,  // 160 USDC  
            9,      // SOL decimals
            6       // USDC decimals
        );
        
        console.log('Pool creation instruction created successfully');
        console.log('Estimated cost:', client.fromBasisPoints(new BN(1_150_000_000), 9), 'SOL');

        // 4. Get pool PDAs
        console.log('\n🎯 Calculating pool PDAs...');
        const ratioA = client.toBasisPoints(1, 9);
        const ratioB = client.toBasisPoints(160, 6);
        
        const poolPDAs = client.getPoolPDAs(SOL_MINT, USDC_MINT, ratioA, ratioB);
        console.log('Pool State PDA:', poolPDAs.poolStatePDA.toString());
        console.log('Token A Vault:', poolPDAs.tokenAVault.toString());
        console.log('Token B Vault:', poolPDAs.tokenBVault.toString());

        // 5. Calculate swap output example
        console.log('\n🔄 Calculating swap example...');
        const swapInputAmount = client.toBasisPoints(1, 9); // 1 SOL
        const expectedOutput = client.calculateExpectedSwapOutput(
            swapInputAmount,
            SOL_MINT,
            ratioA,
            ratioB,
            SOL_MINT
        );
        
        console.log('Swapping 1 SOL would give approximately:', 
                   client.fromBasisPoints(expectedOutput, 6), 'USDC');

        // 6. Donation example
        console.log('\n💝 Creating donation instruction example...');
        const donationInstruction = client.createDonationInstructionWithDisplayAmount(
            userWallet.publicKey,
            0.1, // 0.1 SOL
            "Thanks for the awesome protocol!"
        );
        
        console.log('Donation instruction created successfully');
        console.log('Minimum donation:', client.getMinDonationSOL(), 'SOL');

        // 7. Utility functions demo
        console.log('\n🛠️  Utility functions demo...');
        console.log('Converting 1.5 SOL to lamports:', client.toBasisPoints(1.5, 9).toString());
        console.log('Converting 1500000000 lamports to SOL:', client.fromBasisPoints(new BN(1500000000), 9));
        
        // Error handling example
        const testErrorCode = 6006; // System paused
        console.log('Error 6006 means:', client.formatError(testErrorCode));

        console.log('\n✅ All examples completed successfully!');
        console.log('\n📚 Next steps:');
        console.log('- Replace example wallet with your actual wallet');
        console.log('- Use real token mints for your pools');
        console.log('- Add proper error handling for production use');
        console.log('- Test on devnet before using on mainnet');

    } catch (error) {
        console.error('❌ Error:', error.message);
        
        // Parse error from logs if available
        if (error.logs) {
            const errorCode = client.parseErrorCode(error.logs);
            if (errorCode) {
                console.error('Error code:', errorCode);
                console.error('Error meaning:', client.formatError(errorCode));
            }
        }
    }
}

// Transaction building example
async function buildTransactionExample() {
    console.log('\n🔨 Transaction Building Example\n');
    
    const wallet = Keypair.generate(); // In real usage, use your wallet
    const transaction = new Transaction();
    
    // Add multiple instructions to a single transaction
    const donationInstruction = client.createDonationInstructionWithDisplayAmount(
        wallet.publicKey,
        0.1,
        "Building with FRT!"
    );
    
    transaction.add(donationInstruction);
    
    // In a real app, you'd add more instructions, get recent blockhash, etc.
    console.log('Transaction with', transaction.instructions.length, 'instructions built');
    console.log('You would now sign and send this transaction');
}

// Advanced pool operations example
async function advancedPoolExample() {
    console.log('\n🏊‍♀️ Advanced Pool Operations Example\n');
    
    const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
    const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    const ratioA = client.toBasisPoints(1, 9);
    const ratioB = client.toBasisPoints(160, 6);
    
    // Get pool PDAs
    const poolPDAs = client.getPoolPDAs(SOL_MINT, USDC_MINT, ratioA, ratioB);
    
    // Check if pool exists (this would work with real connection)
    // const poolExists = await client.doesPoolExist(poolPDAs.poolStatePDA);
    // console.log('Pool exists:', poolExists);
    
    // Calculate required liquidity for deposit
    const depositAmount = client.toBasisPoints(5, 9); // 5 SOL
    const requiredAmounts = client.calculateDepositAmounts(
        depositAmount,
        SOL_MINT,
        ratioA,
        ratioB,
        SOL_MINT
    );
    
    console.log('To deposit 5 SOL, you need:');
    console.log('SOL:', client.fromBasisPoints(requiredAmounts.tokenAAmount, 9));
    console.log('USDC:', client.fromBasisPoints(requiredAmounts.tokenBAmount, 6));
    
    // Calculate swap with price impact
    const swapAmount = client.toBasisPoints(10, 9); // 10 SOL
    const swapResult = client.calculateSwapWithPriceImpact(
        swapAmount,
        SOL_MINT,
        client.toBasisPoints(1000, 9), // 1000 SOL pool balance
        client.toBasisPoints(160000, 6), // 160000 USDC pool balance
        SOL_MINT
    );
    
    console.log('\nSwapping 10 SOL:');
    console.log('Expected output:', client.fromBasisPoints(swapResult.amountOut, 6), 'USDC');
    console.log('Price impact:', swapResult.priceImpact.toFixed(4), '%');
}

// Run examples
if (require.main === module) {
    main()
        .then(() => buildTransactionExample())
        .then(() => advancedPoolExample())
        .catch(console.error);
}

module.exports = {
    main,
    buildTransactionExample,
    advancedPoolExample,
};
