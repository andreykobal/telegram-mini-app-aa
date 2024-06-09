// Import required modules from viem and other libraries
const { createPublicClient, createWalletClient, http } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { baseSepolia } = require("viem/chains");
const { createSmartAccountClient } = require("@biconomy/account");
const { formatEther } = require("viem");

require('dotenv').config();

// Configuration for Biconomy Paymaster, Bundler, and RPC URL
const config = {
    biconomyPaymasterApiKey: process.env.BICONOMY_PAYMASTER_API_KEY,
    bundlerUrl: process.env.BUNDLER_URL
};

const customRpcUrl = process.env.CUSTOM_RPC_URL;

// USDT and USDC contract addresses
const usdtAddress = '0x5934F0856ed563760D3087d2a99ad7b3D8cd42c5';
const usdcAddress = '0xA8fDAad0d4B52232cf9A676064EAbFB088F5003B';

// Minimal ABI to interact with ERC20 Tokens
const erc20Abi = [
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "balance",
                "type": "uint256"
            }
        ],
        "type": "function"
    }
];

// Function to get the smart wallet address
async function getSmartWalletAddress(privateKey) {
    const account = privateKeyToAccount(privateKey);
    const client = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http(customRpcUrl),
    });

    const smartWallet = await createSmartAccountClient({
        signer: client,
        biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
        bundlerUrl: config.bundlerUrl,
    });

    const saAddress = await smartWallet.getAccountAddress();
    return saAddress;
}

// Function to get the ETH balance
async function getEthBalance(address) {
    const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(customRpcUrl)
    });

    const balance = await publicClient.getBalance({
        address: address,
        blockTag: 'latest'  // Optional parameter
    });

    return balance;
}

// Function to get token balance
async function getTokenBalance(tokenAddress, walletAddress) {
    const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(customRpcUrl)
    });

    const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [walletAddress]
    });

    return balance;
}

// Exporting functions for external use
module.exports = { getSmartWalletAddress, getEthBalance, getTokenBalance };

// Example usage
async function main() {
    const privateKey = process.env.PRIVATE_KEY;
    const smartWalletAddress = await getSmartWalletAddress(privateKey);
    const ethBalance = await getEthBalance(smartWalletAddress);
    const usdtBalance = await getTokenBalance(usdtAddress, smartWalletAddress);
    const usdcBalance = await getTokenBalance(usdcAddress, smartWalletAddress);

    console.log(`Smart Wallet Address: ${smartWalletAddress}`);
    console.log(`ETH Balance: ${ethBalance}`);
    console.log(`USDT Balance: ${usdtBalance}`);
    console.log(`USDC Balance: ${usdcBalance}`);
}

main().catch((error) => {
    console.error("Error:", error);
});
