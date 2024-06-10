//backend/swap.js

const {
    createPublicClient,
    createWalletClient,
    http,
    parseUnits,
    encodeFunctionData,
    formatEther
} = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { baseSepolia } = require("viem/chains");
const {
    createSmartAccountClient,
    PaymasterMode
} = require("@biconomy/account");
const routerArtifact = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");
const WETH9 = require("./WETH9.json");
require("dotenv").config();

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

async function initializeWalletClient(privateKey) {
    const account = privateKeyToAccount(privateKey);
    return createWalletClient({
        account,
        chain: baseSepolia,
        transport: http(customRpcUrl)
    });
}

async function createSmartWallet(privateKey) {
    const walletClient = await initializeWalletClient(privateKey);
    return createSmartAccountClient({
        signer: walletClient,
        biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
        bundlerUrl: config.bundlerUrl
    });
}

async function getSmartWalletAddress(privateKey) {
    const smartWallet = await createSmartWallet(privateKey);
    return smartWallet.getAccountAddress();
}

async function getTokenBalance(tokenAddress, walletAddress) {
    const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(customRpcUrl)
    });
    return publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [walletAddress]
    });
}

async function getBalances(privateKey) {
    const smartWalletAddress = await getSmartWalletAddress(privateKey);
    const [ethBalance, wethBalance, usdtBalance, usdcBalance] = await Promise.all([
        getEthBalance(smartWalletAddress),
        getTokenBalance(WETH_ADDRESS, smartWalletAddress),
        getTokenBalance(USDT_ADDRESS, smartWalletAddress),
        getTokenBalance(USDC_ADDRESS, smartWalletAddress)
    ]);
    return {
        ethBalance: formatEther(ethBalance),
        wethBalance: formatEther(wethBalance),
        usdtBalance: formatEther(usdtBalance),
        usdcBalance: formatEther(usdcBalance)
    };
}

async function approveToken(tokenAddress, spenderAddress, amount, smartWallet) {
    const encodedCall = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress, amount]
    });
    const transaction = {
        to: tokenAddress,
        data: encodedCall
    };
    const userOpResponse = await smartWallet.sendTransaction(transaction, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
    });
    const { transactionHash } = await userOpResponse.waitForTxHash();
    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success === 'true') {
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
    return publicClient.readContract({
        address: ROUTER_ADDRESS,
        abi: routerArtifact.abi,
        functionName: 'getAmountsOut',
        args: [amountIn, path]
    });
}

async function swapTokens(amountIn, amountOutMin, path, to, deadline, smartWallet) {
    const encodedCall = encodeFunctionData({
        abi: routerArtifact.abi,
        functionName: 'swapExactTokensForTokens',
        args: [amountIn, amountOutMin, path, to, deadline]
    });
    const transaction = {
        to: ROUTER_ADDRESS,
        data: encodedCall
    };
    const userOpResponse = await smartWallet.sendTransaction(transaction, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
    });
    const { transactionHash } = await userOpResponse.waitForTxHash();
    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success === 'true') {
        console.log("UserOp receipt", userOpReceipt);
        console.log("Transaction receipt", userOpReceipt.receipt);
    }
    return transactionHash;
}

async function wrapEth(privateKey, amountInEth) {
    const smartWallet = await createSmartWallet(privateKey);
    const amountInWei = parseUnits(amountInEth, 18);
    const encodedCall = encodeFunctionData({
        abi: WETH9.abi,
        functionName: 'deposit',
        args: []
    });
    const transaction = {
        to: WETH_ADDRESS,
        data: encodedCall,
        value: amountInWei
    };
    const userOpResponse = await smartWallet.sendTransaction(transaction, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
    });
    const { transactionHash } = await userOpResponse.waitForTxHash();
    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success === 'true') {
        console.log("UserOp receipt", userOpReceipt);
        console.log("Transaction receipt", userOpReceipt.receipt);
    }
    return transactionHash;
}

async function unwrapWeth(privateKey) {
    const smartWallet = await createSmartWallet(privateKey);
    const smartWalletAddress = await getSmartWalletAddress(privateKey);
    const wethBalance = await getTokenBalance(WETH_ADDRESS, smartWalletAddress);
    const encodedCall = encodeFunctionData({
        abi: WETH9.abi,
        functionName: 'withdraw',
        args: [wethBalance]
    });
    const transaction = {
        to: WETH_ADDRESS,
        data: encodedCall
    };
    const userOpResponse = await smartWallet.sendTransaction(transaction, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED }
    });
    const { transactionHash } = await userOpResponse.waitForTxHash();
    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success === 'true') {
        console.log("UserOp receipt", userOpReceipt);
        console.log("Transaction receipt", userOpReceipt.receipt);
    }
    return transactionHash;
}


async function swapTokensHelper(privateKey, amount, path) {
    const smartWallet = await createSmartWallet(privateKey);
    const amountsOut = await getSwapRate(amount, path);
    const amountOutMin = amountsOut[1];
    const smartWalletAddress = await getSmartWalletAddress(privateKey);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
    await approveToken(path[0], ROUTER_ADDRESS, amount, smartWallet);
    return swapTokens(amount, amountOutMin, path, smartWalletAddress, deadline, smartWallet);
}

async function getEthBalance(walletAddress) {
    const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(customRpcUrl)
    });
    return publicClient.getBalance({ address: walletAddress });
}

async function getUsdtToUsdcSwapRate(amount) {
    return getSwapRateHelper(amount, [USDT_ADDRESS, USDC_ADDRESS]);
}

async function getUsdcToUsdtSwapRate(amount) {
    return getSwapRateHelper(amount, [USDC_ADDRESS, USDT_ADDRESS]);
}

async function getUsdtToWethSwapRate(amount) {
    return getSwapRateHelper(amount, [USDT_ADDRESS, WETH_ADDRESS]);
}

async function getWethToUsdtSwapRate(amount) {
    return getSwapRateHelper(amount, [WETH_ADDRESS, USDT_ADDRESS]);
}

async function getUsdcToWethSwapRate(amount) {
    return getSwapRateHelper(amount, [USDC_ADDRESS, WETH_ADDRESS]);
}

async function getWethToUsdcSwapRate(amount) {
    return getSwapRateHelper(amount, [WETH_ADDRESS, USDC_ADDRESS]);
}


async function getSwapRateHelper(amount, path) {
    const amountsOut = await getSwapRate(parseUnits(amount, 18), path);
    return formatEther(amountsOut[1]);
}

async function swapUsdtToUsdcAmount(privateKey, amount) {
    return swapTokensHelper(privateKey, parseUnits(amount, 18), [USDT_ADDRESS, USDC_ADDRESS]);
}

async function swapUsdcToUsdtAmount(privateKey, amount) {
    return swapTokensHelper(privateKey, parseUnits(amount, 18), [USDC_ADDRESS, USDT_ADDRESS]);
}

async function swapWethToUsdtAmount(privateKey, amountInEth) {
    await wrapEth(privateKey, amountInEth);
    await swapTokensHelper(privateKey, parseUnits(amountInEth, 18), [WETH_ADDRESS, USDT_ADDRESS]);
}

async function swapUsdtToWethAmount(privateKey, amountInUsdt) {
    await swapTokensHelper(privateKey, parseUnits(amountInUsdt, 18), [USDT_ADDRESS, WETH_ADDRESS]);
    await unwrapWeth(privateKey);
}

async function swapWethToUsdcAmount(privateKey, amountInEth) {
    await wrapEth(privateKey, amountInEth);
    await swapTokensHelper(privateKey, parseUnits(amountInEth, 18), [WETH_ADDRESS, USDC_ADDRESS]);
}

async function swapUsdcToWethAmount(privateKey, amountInUsdt) {
    await swapTokensHelper(privateKey, parseUnits(amountInUsdt, 18), [USDC_ADDRESS, WETH_ADDRESS]);
    await unwrapWeth(privateKey);
}


module.exports = {
    getBalances,
    getUsdtToUsdcSwapRate,
    getUsdcToUsdtSwapRate,
    getUsdtToWethSwapRate,
    getWethToUsdtSwapRate,
    getUsdcToWethSwapRate,
    getWethToUsdcSwapRate,
    swapUsdtToUsdcAmount,
    swapUsdcToUsdtAmount,
    swapUsdtToWethAmount,
    swapWethToUsdtAmount,
    swapUsdcToWethAmount,
    swapWethToUsdcAmount
};



//TEST
// async function testAllSwaps(privateKey) {
//     try {
//         // Get initial balances
//         const initialBalances = await getBalances(privateKey);
//         console.log('Initial Balances:', initialBalances);

//         // Define small amounts
//         const smallEthAmount = '0.0001';
//         const smallTokenAmount = '1';

//         // Get Swap Rates
//         const usdtToUsdcRate = await getUsdtToUsdcSwapRate(smallTokenAmount);
//         console.log('USDT to USDC Rate:', usdtToUsdcRate);

//         const usdcToUsdtRate = await getUsdcToUsdtSwapRate(smallTokenAmount);
//         console.log('USDC to USDT Rate:', usdcToUsdtRate);

//         const usdtToWethRate = await getUsdtToWethSwapRate(smallTokenAmount);
//         console.log('USDT to WETH Rate:', usdtToWethRate);

//         const wethToUsdtRate = await getWethToUsdtSwapRate(smallEthAmount);
//         console.log('WETH to USDT Rate:', wethToUsdtRate);

//         const usdcToWethRate = await getUsdcToWethSwapRate(smallTokenAmount);
//         console.log('USDC to WETH Rate:', usdcToWethRate);

//         const wethToUsdcRate = await getWethToUsdcSwapRate(smallEthAmount);
//         console.log('WETH to USDC Rate:', wethToUsdcRate);

//         // Perform Swaps
//         await swapUsdtToUsdcAmount(privateKey, smallTokenAmount);
//         console.log('Swapped USDT to USDC');

//         await swapUsdcToUsdtAmount(privateKey, smallTokenAmount);
//         console.log('Swapped USDC to USDT');

//         await swapWethToUsdtAmount(privateKey, smallEthAmount);
//         console.log('Swapped WETH to USDT');

//         await swapUsdtToWethAmount(privateKey, smallTokenAmount);
//         console.log('Swapped USDT to WETH');

//         await swapWethToUsdcAmount(privateKey, smallEthAmount);
//         console.log('Swapped WETH to USDC');

//         await swapUsdcToWethAmount(privateKey, smallTokenAmount);
//         console.log('Swapped USDC to WETH');

//         // Get final balances
//         const finalBalances = await getBalances(privateKey);
//         console.log('Final Balances:', finalBalances);
//     } catch (error) {
//         console.error('Error testing swaps:', error);
//     }
// }

// testAllSwaps(process.env.PRIVATE_KEY);