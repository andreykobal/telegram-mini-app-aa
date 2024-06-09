const { getBalances, getUsdtToUsdcSwapRate, getUsdcToUsdtSwapRate, swapUsdtToUsdcAmount, swapUsdcToUsdtAmount } = require('./swap');

const privateKey = process.env.PRIVATE_KEY; // Replace with your actual private key
const amount = '1'; // Example amount

async function testFunctions() {
    try {
        // Test getBalances function
        const balances = await getBalances(privateKey);
        console.log('Balances:', balances);

    } catch (error) {
        console.error('An error occurred:', error);
    }
}

testFunctions();
