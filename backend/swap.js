const { createPublicClient, createWalletClient, http, parseUnits, encodeFunctionData, formatEther } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { baseSepolia } = require("viem/chains");
const { createSmartAccountClient, PaymasterMode } = require("@biconomy/account");
const routerArtifact = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");
const WETH9 = require("./WETH9.json");
require('dotenv').config();


const config = {
    biconomyPaymasterApiKey: process.env.BICONOMY_PAYMASTER_API_KEY,
    bundlerUrl: process.env.BUNDLER_URL
};

const customRpcUrl = process.env.CUSTOM_RPC_URL;
const USDT_ADDRESS = '0xe7E35bfBD496DB4805f37920d37d3b1df9E0Ea7a';
const USDC_ADDRESS = '0x1EC536110df2b7cFc4fA7F262caCc404C6C4e8BF';
const ROUTER_ADDRESS = '0xf0a58211943f4a1F939d4f65e6A8A53f5aF6E875';
const WETH_ADDRESS = '0x43fFaE477617F83E6E0FF4E8Eca73Ac2B1605ce0';


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

// Modify the getTokenBalances function to include WETH balance
async function getTokenBalances(privateKey) {
    const smartWalletAddress = await getSmartWalletAddress(privateKey);

    const ethBalance = await getEthBalance(smartWalletAddress);
    const wethBalance = await getTokenBalance(WETH_ADDRESS, smartWalletAddress);
    const usdtBalance = await getTokenBalance(USDT_ADDRESS, smartWalletAddress);
    const usdcBalance = await getTokenBalance(USDC_ADDRESS, smartWalletAddress);

    return { ethBalance, wethBalance, usdtBalance, usdcBalance,  };
}

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

async function swapUsdtToUsdc(privateKey, amountIn) {
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

    const path = [USDT_ADDRESS, USDC_ADDRESS];
    const amountsOut = await getSwapRate(amountIn, path);
    const amountOutMin = amountsOut[1];
    const smartWalletAddress = await getSmartWalletAddress(privateKey);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    await approveToken(USDT_ADDRESS, ROUTER_ADDRESS, amountIn, smartWallet);
    const transactionHash = await swapTokens(amountIn, amountOutMin, path, smartWalletAddress, deadline, smartWallet);

    return transactionHash;
}

async function swapUsdcToUsdt(privateKey, amountIn) {
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

    const path = [USDC_ADDRESS, USDT_ADDRESS];
    const amountsOut = await getSwapRate(amountIn, path);
    const amountOutMin = amountsOut[1];
    const smartWalletAddress = await getSmartWalletAddress(privateKey);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    await approveToken(USDC_ADDRESS, ROUTER_ADDRESS, amountIn, smartWallet);
    const transactionHash = await swapTokens(amountIn, amountOutMin, path, smartWalletAddress, deadline, smartWallet);

    return transactionHash;
}

async function getSwapRateUsdtToUsdc(amountIn) {
    const path = [USDT_ADDRESS, USDC_ADDRESS];
    const amountsOut = await getSwapRate(amountIn, path);
    return { rate: amountsOut[1] };
}

async function getSwapRateUsdcToUsdt(amountIn) {
    const path = [USDC_ADDRESS, USDT_ADDRESS];
    const amountsOut = await getSwapRate(amountIn, path);
    return { rate: amountsOut[1] };
}

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

async function wrapEth(privateKey, amountInEth) {
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

    const amountInWei = parseUnits(amountInEth, 18);
    const encodedCall = encodeFunctionData({
        abi: WETH9.abi,
        functionName: 'deposit',
        args: [],
    });

    const transaction = {
        to: WETH_ADDRESS,
        data: encodedCall,
        value: amountInWei,
    };

    const userOpResponse = await smartWallet.sendTransaction(transaction, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });

    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log("Wrap ETH Transaction Hash:", transactionHash);

    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success == 'true') {
        console.log("UserOp receipt", userOpReceipt);
        console.log("Transaction receipt", userOpReceipt.receipt);
    }

    return transactionHash;
}

// New function to unwrap WETH to ETH
async function unwrapWeth(privateKey) {
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

    const smartWalletAddress = await getSmartWalletAddress(privateKey);  // Get the smart account address
    const wethBalance = await getTokenBalance(WETH_ADDRESS, smartWalletAddress);  // Check balance of the smart account address
    console.log("WETH Balance to unwrap:", wethBalance);
    const encodedCall = encodeFunctionData({
        abi: WETH9.abi,
        functionName: 'withdraw',
        args: [wethBalance],
    });

    const transaction = {
        to: WETH_ADDRESS,
        data: encodedCall,
    };

    const userOpResponse = await smartWallet.sendTransaction(transaction, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });

    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log("Unwrap WETH Transaction Hash:", transactionHash);

    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success == 'true') {
        console.log("UserOp receipt", userOpReceipt);
        console.log("Transaction receipt", userOpReceipt.receipt);
    }

    return transactionHash;
}


async function swapWethToUsdt(privateKey, amountInWeth) {
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

    const path = [WETH_ADDRESS, USDT_ADDRESS];
    const amountsOut = await getSwapRate(amountInWeth, path);
    const amountOutMin = amountsOut[1];
    const smartWalletAddress = await getSmartWalletAddress(privateKey);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    await approveToken(WETH_ADDRESS, ROUTER_ADDRESS, amountInWeth, smartWallet);
    const transactionHash = await swapTokens(amountInWeth, amountOutMin, path, smartWalletAddress, deadline, smartWallet);

    return transactionHash;
}

// New function to swap USDT to WETH
async function swapUsdtToWeth(privateKey, amountInUsdt) {
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

    const path = [USDT_ADDRESS, WETH_ADDRESS];
    const amountsOut = await getSwapRate(amountInUsdt, path);
    const amountOutMin = amountsOut[1];
    const smartWalletAddress = await getSmartWalletAddress(privateKey);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    await approveToken(USDT_ADDRESS, ROUTER_ADDRESS, amountInUsdt, smartWallet);
    const transactionHash = await swapTokens(amountInUsdt, amountOutMin, path, smartWalletAddress, deadline, smartWallet);

    return transactionHash;
}

async function swapWethToUsdc(privateKey, amountInWeth) {
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

    const path = [WETH_ADDRESS, USDC_ADDRESS];
    const amountsOut = await getSwapRate(amountInWeth, path);
    const amountOutMin = amountsOut[1];
    const smartWalletAddress = await getSmartWalletAddress(privateKey);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    await approveToken(WETH_ADDRESS, ROUTER_ADDRESS, amountInWeth, smartWallet);
    const transactionHash = await swapTokens(amountInWeth, amountOutMin, path, smartWalletAddress, deadline, smartWallet);

    return transactionHash;
}

async function swapUsdcToWeth(privateKey, amountInUsdt) {
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

    const path = [USDC_ADDRESS, WETH_ADDRESS];
    const amountsOut = await getSwapRate(amountInUsdt, path);
    const amountOutMin = amountsOut[1];
    const smartWalletAddress = await getSmartWalletAddress(privateKey);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    await approveToken(USDC_ADDRESS, ROUTER_ADDRESS, amountInUsdt, smartWallet);
    const transactionHash = await swapTokens(amountInUsdt, amountOutMin, path, smartWalletAddress, deadline, smartWallet);

    return transactionHash;
}

// New function to get ETH balance
async function getEthBalance(walletAddress) {
    const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(customRpcUrl),
    });

    const balance = await publicClient.getBalance({
        address: walletAddress,
    });

    return balance;
}


// Function to get balances
// Modify the getBalances function to include WETH and ETH balances
async function getBalances(privateKey) {
    const balances = await getTokenBalances(privateKey);
    return {
        ethBalance: formatEther(balances.ethBalance),
        wethBalance: formatEther(balances.wethBalance),
        usdtBalance: formatEther(balances.usdtBalance),
        usdcBalance: formatEther(balances.usdcBalance),
    };
}

// Function to get USDT to USDC swap rate
async function getUsdtToUsdcSwapRate(amount) {
    const swapRateUsdtToUsdc = await getSwapRateUsdtToUsdc(parseUnits(amount, 18));
    return formatEther(swapRateUsdtToUsdc.rate);
}

// Function to get USDC to USDT swap rate
async function getUsdcToUsdtSwapRate(amount) {
    const swapRateUsdcToUsdt = await getSwapRateUsdcToUsdt(parseUnits(amount, 18));
    return formatEther(swapRateUsdcToUsdt.rate);
}

// Function to swap USDT to USDC
async function swapUsdtToUsdcAmount(privateKey, amount) {
    const usdtToUsdcTxHash = await swapUsdtToUsdc(privateKey, parseUnits(amount, 18));
    return usdtToUsdcTxHash;
}

// Function to swap USDC to USDT
async function swapUsdcToUsdtAmount(privateKey, amount) {
    const usdcToUsdtTxHash = await swapUsdcToUsdt(privateKey, parseUnits(amount, 18));
    return usdcToUsdtTxHash;
}

// Function to wrap ETH to WETH and swap WETH to USDT
async function wrapEthAndSwapToUsdt(privateKey, amountInEth) {
    await wrapEth(privateKey, amountInEth);
    await swapWethToUsdt(privateKey, parseUnits(amountInEth, 18));
}

// Function to swap USDT to WETH and unwrap WETH to ETH
async function swapUsdtToWethAndUnwrap(privateKey, amountInUsdt) {
    await swapUsdtToWeth(privateKey, parseUnits(amountInUsdt, 18));
    await unwrapWeth(privateKey);
}

async function wrapEthAndSwapToUsdc(privateKey, amountInEth) {
    await wrapEth(privateKey, amountInEth);
    await swapWethToUsdc(privateKey, parseUnits(amountInEth, 18));
}

async function swapUsdcToWethAndUnwrap(privateKey, amountInUsdt) {
    await swapUsdcToWeth(privateKey, parseUnits(amountInUsdt, 18));
    await unwrapWeth(privateKey);
}



// Export the new functions
module.exports = {
    getBalances,
    getUsdtToUsdcSwapRate,
    getUsdcToUsdtSwapRate,
    swapUsdtToUsdcAmount,
    swapUsdcToUsdtAmount,
    wrapEthAndSwapToUsdt,
    swapUsdtToWethAndUnwrap
};


// Example usage of the new function
async function test() {
    const privateKey = process.env.PRIVATE_KEY;

    // Test the function swapWethToUsdcAndUnwrap
    console.log(await getBalances(privateKey));
    await swapUsdcToWethAndUnwrap(privateKey, '17');
    console.log(await getBalances(privateKey));
    
}

test().catch((error) => {
    console.error("Error:", error);
});