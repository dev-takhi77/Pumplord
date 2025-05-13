// import { Connection, Keypair, PublicKey } from "@solana/web3.js";
// import { AnchorProvider, Program } from '@coral-xyz/anchor'
// import idl from './pump.json'
// import { Pump } from './pump'
// import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

// const wallet = new NodeWallet(Keypair.generate())
// const connection = new Connection(process.env.RPC_ENDPOINT || process.exit(1))
// const programId = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
// const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" })


// const program = new Program(idl as Pump, idl.metadata.address, provider);


// const POOL_SEED_PREFIX = "liquidity_pool";
// // const LIQUIDITY_SEED = "LiqudityProvider";
// const SOL_VAULT_PREFIX = "liquidity_sol_vault";
// export {
//     programId,
//     idl,
//     POOL_SEED_PREFIX,
//     SOL_VAULT_PREFIX,
//     connection,
//     program
// }