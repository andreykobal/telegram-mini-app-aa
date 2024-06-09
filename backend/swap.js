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
const USDT_ADDRESS = '0x5934F0856ed563760D3087d2a99ad7b3D8cd42c5';
const USDC_ADDRESS = '0xA8fDAad0d4B52232cf9A676064EAbFB088F5003B';
const ROUTER_ADDRESS = '0x88aD494054E8EB1916D47a346baBeb2f776e859e';
const WETH_ADDRESS = '0xe47684cE984A390e9eb3138b8486996CF820fBc8';


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

async function getTokenBalances(privateKey) {
    const smartWalletAddress = await getSmartWalletAddress(privateKey);

    const usdtBalance = await getTokenBalance(USDT_ADDRESS, smartWalletAddress);
    const usdcBalance = await getTokenBalance(USDC_ADDRESS, smartWalletAddress);

    return { usdtBalance, usdcBalance };
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


// Function to get balances
async function getBalances(privateKey) {
    const balances = await getTokenBalances(privateKey);
    return {
        usdtBalance: formatEther(balances.usdtBalance),
        usdcBalance: formatEther(balances.usdcBalance)
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




module.exports = { getBalances, getUsdtToUsdcSwapRate, getUsdcToUsdtSwapRate, swapUsdtToUsdcAmount, swapUsdcToUsdtAmount, wrapEth, swapWethToUsdt };

async function test() {
    const privateKey = process.env.PRIVATE_KEY;

    await getBalances(privateKey);
    await wrapEth(privateKey, '0.0005');
    await swapWethToUsdt(privateKey, parseUnits('0.0005', 18));
    await getBalances(privateKey);
}

test().catch((error) => {
    console.error("Error:", error);
});