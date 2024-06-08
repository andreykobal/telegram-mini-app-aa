// client.js
const { createPublicClient, http } = require('viem');
const { baseSepolia } = require('viem/chains');

const customRpcUrl = process.env.REACT_APP_CUSTOM_RPC_URL;

const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(customRpcUrl),
});

module.exports = { publicClient };
