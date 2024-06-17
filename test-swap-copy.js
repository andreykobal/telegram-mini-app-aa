//test-swap-copy.js

const { getBalances, getUsdtToUsdcSwapRate, getUsdcToUsdtSwapRate, swapUsdtToUsdcAmount, swapUsdcToUsdtAmount } = require('./swap');

const privateKey = process.env.PRIVATE_KEY; // Replace with your actual private key
const amount = '1'; // Example amount

async function testFunctions() {
    try {
        // Test getBalances function
        const balances = await getBalances(privateKey);
        console.log('Balances:', balances);

        // Test getUsdtToUsdcSwapRate function
        const usdtToUsdcRate = await getUsdtToUsdcSwapRate(amount);
        console.log('USDT to USDC Rate:', usdtToUsdcRate);

        // Test getUsdcToUsdtSwapRate function
        const usdcToUsdtRate = await getUsdcToUsdtSwapRate(amount);
        console.log('USDC to USDT Rate:', usdcToUsdtRate);

        // Test swapUsdtToUsdcAmount function
        const usdtToUsdcTxHash = await swapUsdtToUsdcAmount(privateKey, amount);
        console.log('USDT to USDC Transaction Hash:', usdtToUsdcTxHash);

        // Test swapUsdcToUsdtAmount function
        const usdcToUsdtTxHash = await swapUsdcToUsdtAmount(privateKey, amount);
        console.log('USDC to USDT Transaction Hash:', usdcToUsdtTxHash);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

testFunctions();
