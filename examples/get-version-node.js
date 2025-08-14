// Node.js example: print ONLY the contract version number to stdout
// Usage:
//   node examples/get-version-node.js
//   RPC_URL=http://192.168.2.88:8899 node examples/get-version-node.js
//   RPC_URL=https://fixed.ngrok.app PROGRAM_ID=4aeVqtWhrUh6wpX8acNj2hpWXKEQwxjA3PYb2sHhNyCn node examples/get-version-node.js

const {
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  Keypair,
} = require('@solana/web3.js');

const GET_VERSION = 14;

const RPC_URL = process.env.RPC_URL || 'http://192.168.2.88:8899';
// Defaults to Localnet ID; override with PROGRAM_ID env for devnet/mainnet
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || '4aeVqtWhrUh6wpX8acNj2hpWXKEQwxjA3PYb2sHhNyCn'
);

function extractVersionFromLogs(logs) {
  if (!Array.isArray(logs)) return null;
  for (const raw of logs) {
    const line = String(raw);
    const m = line.match(/Contract Version:\s*([0-9.]+)/i) || line.match(/Version:\s*([0-9.]+)/i);
    if (m) return m[1];
  }
  return null;
}

async function main() {
  const connection = new Connection(RPC_URL, 'confirmed');

  const ix = new TransactionInstruction({
    keys: [],
    programId: PROGRAM_ID,
    data: Buffer.from([GET_VERSION]),
  });

  const payer = Keypair.generate();

  // Try airdrop on localnet/devnet so the ephemeral payer exists (ignore errors on mainnet)
  try {
    const sig = await connection.requestAirdrop(payer.publicKey, 1_000_000); // 0.001 SOL
    const bh = await connection.getLatestBlockhash('confirmed');
    await connection.confirmTransaction({ signature: sig, ...bh }, 'confirmed');
  } catch (_) {}

  const { blockhash } = await connection.getLatestBlockhash('confirmed');

  const msg = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: blockhash,
    instructions: [ix],
  }).compileToV0Message();

  const vtx = new VersionedTransaction(msg);
  vtx.sign([payer]);

  const sim = await connection.simulateTransaction(vtx);
  if (sim.value && sim.value.err) {
    console.error('Simulation error:', JSON.stringify(sim.value.err));
    process.exit(2);
  }

  const version = extractVersionFromLogs(sim.value && sim.value.logs);
  if (!version) {
    console.error('Version not found in logs');
    process.exit(1);
  }

  // Print ONLY the version string
  process.stdout.write(version + '\n');
}

main().catch((e) => {
  console.error('Error:', e.message || e);
  process.exit(1);
});


