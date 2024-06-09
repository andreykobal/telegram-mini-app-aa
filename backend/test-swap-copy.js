const { getBalances, getUsdtToUsdcSwapRate, getUsdcToUsdtSwapRate, swapUsdtToUsdcAmount, swapUsdcToUsdtAmount } = require('./swap');

const privateKey = process.env.PRIVATE_KEY; // Replace with your actual private key
const amount = '1'; // Example amount

async function testFunctions() {
    try {
        // Test getUsdtToUsdcSwapRate function
        const usdtToUsdcRate = await getUsdtToUsdcSwapRate(amount);
        console.log('USDT to USDC Rate:', usdtToUsdcRate);

        // Test getUsdcToUsdtSwapRate function
        const usdcToUsdtRate = await getUsdcToUsdtSwapRate(amount);
        console.log('USDC to USDT Rate:', usdcToUsdtRate);

    } catch (error) {
        console.error('An error occurred:', error);
    }
}

testFunctions();
