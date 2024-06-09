const { createPublicClient, createWalletClient, http, parseUnits, encodeFunctionData, formatEther } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { baseSepolia } = require("viem/chains");
const { createSmartAccountClient, PaymasterMode } = require("@biconomy/account");

const routerArtifact = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");

require('dotenv').config();

// Configuration for Biconomy Paymaster, Bundler, and RPC URL
const config = {
    biconomyPaymasterApiKey: process.env.BICONOMY_PAYMASTER_API_KEY,
    bundlerUrl: process.env.BUNDLER_URL
};

const customRpcUrl = process.env.CUSTOM_RPC_URL;

// Contract addresses
const USDT_ADDRESS = '0x5934F0856ed563760D3087d2a99ad7b3D8cd42c5';
const USDC_ADDRESS = '0xA8fDAad0d4B52232cf9A676064EAbFB088F5003B';
const ROUTER_ADDRESS = '0x88aD494054E8EB1916D47a346baBeb2f776e859e';

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
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_spender",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "name": "success",
                "type": "bool"
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
        blockTag: 'latest'
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

// Function to approve token transfer
async function approveToken(tokenAddress, spenderAddress, amount, smartWallet) {
    const encodedCall = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress, amount]
    });

    const transaction = {
        to: tokenAddress,
        data: encodedCall,
    };

    const userOpResponse = await smartWallet.sendTransaction(transaction, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });

    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log("Approval Transaction Hash:", transactionHash);

    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success == 'true') {
        console.log("UserOp receipt", userOpReceipt);
        console.log("Transaction receipt", userOpReceipt.receipt);
    }

    return transactionHash;
}

// Function to get the swap rate
async function getSwapRate(amountIn, path) {
    const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(customRpcUrl)
    });

    const amountsOut = await publicClient.readContract({
        address: ROUTER_ADDRESS,
        abi: routerArtifact.abi,
        functionName: 'getAmountsOut',
        args: [amountIn, path]
    });

    return amountsOut;
}

// Function to swap tokens on Uniswap
async function swapTokens(amountIn, amountOutMin, path, to, deadline, smartWallet) {
    const encodedCall = encodeFunctionData({
        abi: routerArtifact.abi,
        functionName: 'swapExactTokensForTokens',
        args: [amountIn, amountOutMin, path, to, deadline]
    });

    const transaction = {
        to: ROUTER_ADDRESS,
        data: encodedCall,
    };

    const userOpResponse = await smartWallet.sendTransaction(transaction, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });

    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log("Swap Transaction Hash:", transactionHash);

    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success == 'true') {
        console.log("UserOp receipt", userOpReceipt);
        console.log("Transaction receipt", userOpReceipt.receipt);
    }

    return transactionHash;
}

// Exporting functions for external use
module.exports = { getSmartWalletAddress, getEthBalance, getTokenBalance, approveToken, swapTokens, getSwapRate };

// Example usage
async function main() {
    const privateKey = process.env.PRIVATE_KEY;
    const smartWalletAddress = await getSmartWalletAddress(privateKey);

    const ethBalance = await getEthBalance(smartWalletAddress);
    const usdtBalance = await getTokenBalance(USDT_ADDRESS, smartWalletAddress);
    const usdcBalance = await getTokenBalance(USDC_ADDRESS, smartWalletAddress);

    console.log(`Smart Wallet Address: ${smartWalletAddress}`);
    console.log(`ETH Balance: ${ethBalance}`);
    console.log(`USDT Balance: ${usdtBalance}`);
    console.log(`USDC Balance: ${usdcBalance}`);

    const account = privateKeyToAccount(privateKey);
    const smartWallet = await createSmartAccountClient({
        signer: createWalletClient({
            account,
            chain: baseSepolia,
            transport: http(customRpcUrl),
        }),
        biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
        bundlerUrl: config.bundlerUrl,
    });

    const amountIn = parseUnits('1', 18); // Amount of USDT to swap
    const path = [USDT_ADDRESS, USDC_ADDRESS]; // Swap path

    // Get the swap rate
    const amountsOut = await getSwapRate(amountIn, path);
    const amountOutMin = amountsOut[1]; // Minimum amount of USDC to receive

    console.log(`Swap Rate: 1 USDT = ${formatEther(amountOutMin)} USDC`);

    const to = smartWalletAddress; // Recipient address
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // Transaction deadline

    await approveToken(USDT_ADDRESS, ROUTER_ADDRESS, amountIn, smartWallet);
    await swapTokens(amountIn, amountOutMin, path, to, deadline, smartWallet);

    const newUsdtBalance = await getTokenBalance(USDT_ADDRESS, smartWalletAddress);
    const newUsdcBalance = await getTokenBalance(USDC_ADDRESS, smartWalletAddress);

    console.log(`New USDT Balance: ${newUsdtBalance}`);
    console.log(`New USDC Balance: ${newUsdcBalance}`);
}

main().catch((error) => {
    console.error("Error:", error);
});
