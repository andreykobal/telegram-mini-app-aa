// Import required modules from viem and other libraries
const { createPublicClient, createWalletClient, http } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { baseSepolia } = require("viem/chains");
const { createSmartAccountClient, PaymasterMode } = require("@biconomy/account");
const { parseAbi, encodeFunctionData } = require("viem");

require('dotenv').config();

// Configuration for Biconomy Paymaster, Bundler, and RPC URL
const config = {
    biconomyPaymasterApiKey: process.env.BICONOMY_PAYMASTER_API_KEY,
    bundlerUrl: process.env.BUNDLER_URL,
    routerAddress: process.env.ROUTER_ADDRESS,
    usdtAddress: process.env.USDT_ADDRESS,
    usdcAddress: process.env.USDC_ADDRESS
};

const customRpcUrl = process.env.CUSTOM_RPC_URL;

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
    console.log("Retrieved Smart Wallet Address:", saAddress);  // Logging the address
    return saAddress;
}

// Function to approve the router to spend USDT
async function approveRouter(privateKey, amount) {
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
    console.log("Smart Account Address for Approval:", saAddress);

    const encodedCall = encodeFunctionData({
        abi: parseAbi(["function approve(address spender, uint256 value) public returns (bool)"]),
        functionName: "approve",
        args: [config.routerAddress, BigInt(amount * 10 ** 18)],
    });

    const transaction = {
        to: config.usdtAddress,
        data: encodedCall,
    };

    const userOpResponse = await smartWallet.sendTransaction(transaction, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });

    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log("Approval Transaction Hash:", transactionHash);

    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success === 'true') {
        console.log("UserOp receipt", userOpReceipt);
        console.log("Transaction receipt", userOpReceipt.receipt);
    }

    return transactionHash;
}

// Function to perform a token swap
async function swapTokens(privateKey, amount) {
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
    console.log("Smart Account Address for Swap:", saAddress);

    const encodedCall = encodeFunctionData({
        abi: parseAbi([
            "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)"
        ]),
        functionName: "swapExactTokensForTokens",
        args: [
            BigInt(amount * 10 ** 18),
            0,
            [config.usdtAddress, config.usdcAddress],
            saAddress,
            Math.floor(Date.now() / 1000) + 60 * 10
        ],
    });

    const transaction = {
        to: config.routerAddress,
        data: encodedCall,
    };

    const userOpResponse = await smartWallet.sendTransaction(transaction, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });

    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log("Swap Transaction Hash:", transactionHash);

    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success === 'true') {
        console.log("UserOp receipt", userOpReceipt);
        console.log("Transaction receipt", userOpReceipt.receipt);
    }

    return transactionHash;
}

// Function to log the balance of ETH, USDT, and USDC for a given address
async function logBalance(address) {
    const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(customRpcUrl)
    });

    if (!address) {
        console.error("Address is null or undefined");
        return;
    }

    try {
        const ethBalance = await publicClient.getBalance(String(address));
        const usdtBalance = await publicClient.readContract({
            address: config.usdtAddress,
            abi: parseAbi(["function balanceOf(address owner) view returns (uint256)"]),
            functionName: "balanceOf",
            args: [String(address)],
        });

        const usdcBalance = await publicClient.readContract({
            address: config.usdcAddress,
            abi: parseAbi(["function balanceOf(address owner) view returns (uint256)"]),
            functionName: "balanceOf",
            args: [String(address)],
        });

        const balances = {
            ethBalance: ethBalance.toString(),
            usdtBalance: usdtBalance.toString(),
            usdcBalance: usdcBalance.toString(),
        };

        console.log(balances);
        return balances;
    } catch (error) {
        console.error("Error logging balance:", error);
    }
}

// Main function to execute the swap process
async function main(privateKey) {
    if (!privateKey) {
        console.error("Private key is null or undefined");
        return;
    }

    // Get the smart wallet address
    const saAddress = await getSmartWalletAddress(privateKey);
    console.log("Smart Wallet Address:", saAddress);

    if (!saAddress) {
        console.error("Failed to retrieve Smart Wallet Address");
        return;
    }

    // Log initial balances
    await logBalance(saAddress);

    // Approve the router to spend USDT
    await approveRouter(privateKey, 1);

    // Perform the token swap
    await swapTokens(privateKey, 1);

    // Log final balances after the swap
    await logBalance(saAddress);
}

// Exporting functions for external use
module.exports = { main, getSmartWalletAddress, logBalance, approveRouter, swapTokens };

// Test the execution
main(process.env.PRIVATE_KEY).then(() => {
    console.log("Swap completed successfully");
}).catch((error) => {
    console.error("Error executing swap:", error);
});
