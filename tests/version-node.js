// Node.js test: Get contract version using the library
const { FixedRatioTradingClient, Connection } = require('../dist');

async function main() {
  const rpcUrl = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');
  const client = new FixedRatioTradingClient(connection);

  console.log('Getting contract version from', rpcUrl);
  const version = await client.getContractVersion();
  console.log('Contract version:', version);
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});

