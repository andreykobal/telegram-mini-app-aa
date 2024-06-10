//backend/index.js

const { generatePrivateKey } = require('viem/accounts');
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User'); // Import the User model
const { router: webhookRouter, setWebhook } = require('./webhook');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const { mint, transferNFT, getNFTs, getSmartWalletAddress, sendETH } = require("./nft");
const fs = require('fs');
const metadata = JSON.parse(fs.readFileSync('metadata.json', 'utf8'));
const MetadataIndex = require('./models/MetadataIndex');
const { getBalances, getUsdtToUsdcSwapRate, getUsdcToUsdtSwapRate, swapUsdtToUsdcAmount, swapUsdcToUsdtAmount } = require('./swap');
const { getUsdtToWethSwapRate, getWethToUsdtSwapRate, getUsdcToWethSwapRate, getWethToUsdcSwapRate, swapUsdtToWethAmount, swapWethToUsdtAmount, swapUsdcToWethAmount, swapWethToUsdcAmount } = require('./swap');


require('dotenv').config();

const app = express();
const port = process.env.PORT || 5001;

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_KEY = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
const uri = process.env.MONGODB_URI;

const keyVaultName = "aa-testnet";
const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;
const credential = new DefaultAzureCredential();
const secretClient = new SecretClient(keyVaultUrl, credential);

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Utility Functions
function validateTelegramData(initData) {
    console.log('Validating Telegram Data:', initData);
    const urlParams = new URLSearchParams(initData);

    const dataCheckString = Array.from(urlParams.entries())
        .filter(([key]) => key !== 'hash')
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    console.log('Data Check String:', dataCheckString);

    const receivedHash = urlParams.get('hash');
    console.log('Received Hash:', receivedHash);

    const computedHash = crypto.createHmac('sha256', SECRET_KEY).update(dataCheckString).digest('hex');
    console.log('Computed HMAC:', computedHash);

    return computedHash === receivedHash;
}

async function storePrivateKeyInKeyVault(telegramId, privateKey) {
    try {
        const secretName = String(telegramId);  // Ensure telegramId is a string
        await secretClient.setSecret(secretName, privateKey);
        console.log('Private key stored in Azure Key Vault:', telegramId);
    } catch (err) {
        console.error('Error storing private key in Azure Key Vault:', err);
        throw err;
    }
}

async function getPrivateKeyFromKeyVault(secretName) {
    try {
        const retrievedSecret = await secretClient.getSecret(secretName);
        console.log('Retrieved private key from Azure Key Vault:', retrievedSecret.value);
        return retrievedSecret.value;
    } catch (err) {
        console.error('Error retrieving private key from Azure Key Vault:', err);
        throw err;
    }
}

async function handleAuthentication(req, res, action) {
    const { initData } = req.body;

    if (!initData) {
        console.log('Init data is missing');
        return res.status(400).send('Init data is required');
    }

    if (validateTelegramData(initData)) {
        const urlParams = new URLSearchParams(initData);
        const userObj = urlParams.get('user') ? JSON.parse(urlParams.get('user')) : null;
        const telegramId = userObj ? userObj.id : null;

        if (!telegramId) {
            console.log('Telegram ID is missing');
            return res.status(400).send('Telegram ID is required');
        }

        try {
            let user = await User.findOne({ telegramId });
            if (!user) {
                const privateKey = generatePrivateKey();
                const smartWalletAddress = await getSmartWalletAddress(privateKey);
                user = new User({
                    telegramId,
                    walletAddress: smartWalletAddress
                });
                await user.save();
                await storePrivateKeyInKeyVault(telegramId, privateKey);
                console.log('New user created with wallet:', user);
            } else {
                console.log('User found:', user);
                if (!user.walletAddress) {
                    const privateKey = generatePrivateKey();
                    const smartWalletAddress = await getSmartWalletAddress(privateKey);
                    user.walletAddress = smartWalletAddress;
                    await user.save();
                    await storePrivateKeyInKeyVault(telegramId, privateKey);
                    console.log('Updated user with wallet:', user);
                }
            }

            console.log('User authenticated:', user);
            return action(user, res);
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).send('Internal server error');
        }
    } else {
        console.log('Validation failed. Invalid data.');
        return res.status(403).send('Invalid data');
    }
}

app.post('/authenticate', (req, res) => handleAuthentication(req, res, (user, res) => res.status(200).json({ user })));

async function handlePrivateKeyAction(req, res, action) {
    const { initData } = req.body;

    if (!initData) {
        console.log('Init data is missing');
        return res.status(400).send('Init data is required');
    }

    if (validateTelegramData(initData)) {
        const urlParams = new URLSearchParams(initData);
        const userObj = urlParams.get('user') ? JSON.parse(urlParams.get('user')) : null;
        const telegramId = userObj ? userObj.id : null;

        if (!telegramId) {
            console.log('Telegram ID is missing');
            return res.status(400).send('Telegram ID is required');
        }

        try {
            const privateKey = await getPrivateKeyFromKeyVault(String(telegramId));
            console.log('Private Key:', privateKey);
            return action(privateKey, res);
        } catch (error) {
            console.error('Error retrieving private key:', error);
            return res.status(500).send('Internal server error');
        }
    } else {
        console.log('Validation failed. Invalid data.');
        return res.status(403).send('Invalid data');
    }
}

async function getTokenURI() {
    const indexDoc = await MetadataIndex.findOneAndUpdate(
        {},
        { $inc: { currentIndex: 1 } },
        { new: true, upsert: true }
    );

    // Reset the index if it exceeds the length of the metadata URLs
    if (indexDoc.currentIndex >= metadata.urls.length) {
        indexDoc.currentIndex = 0;
        await indexDoc.save();
    }

    return metadata.urls[indexDoc.currentIndex];
}

app.post('/sendETH', (req, res) => handlePrivateKeyAction(req, res, async (privateKey, res) => {
    const { toAddress, amount } = req.body;
    console.log('Sending ETH...');
    const transactionHash = await sendETH(privateKey, toAddress, amount);
    return res.status(200).json({ transactionHash });
}));

app.post('/mint', (req, res) => handlePrivateKeyAction(req, res, async (privateKey, res) => {
    const tokenURI = await getTokenURI();  // Get the next token URI
    console.log('Minting NFT with Token URI:', tokenURI);
    const transactionHash = await mint(privateKey, tokenURI);
    return res.status(200).json({ transactionHash });
}));

app.post('/transfer', (req, res) => handlePrivateKeyAction(req, res, async (privateKey, res) => {
    const { tokenId, toAddress } = req.body;
    console.log('Transferring NFT...');
    const transactionHash = await transferNFT(privateKey, tokenId, toAddress);
    return res.status(200).json({ transactionHash });
}));

app.post('/getNFTs', (req, res) => handlePrivateKeyAction(req, res, async (privateKey, res) => {
    console.log('Retrieving NFTs...');
    const data = await getNFTs(privateKey);

    // Convert BigInt to string before sending JSON response
    const nfts = [
        data[0].map(id => id.toString()),
        data[1]
    ];

    return res.status(200).json({ nfts });
}));

app.post('/getBalances', (req, res) => handlePrivateKeyAction(req, res, async (privateKey, res) => {
    console.log('Retrieving balances...');
    const balances = await getBalances(privateKey);
    return res.status(200).json({ balances });
}));

// New endpoint for fetching USDT to USDC swap rate
app.post('/getUsdtToUsdcRate', async (req, res) => {
    console.log('Received request at /getUsdtToUsdcRate');
    console.log('Request body:', req.body);
    const { amount } = req.body;

    if (!amount) {
        console.log('Amount is missing');
        return res.status(400).send('Amount is required');
    }

    try {
        const usdtToUsdcRate = await getUsdtToUsdcSwapRate(amount);
        console.log('USDT to USDC Rate:', usdtToUsdcRate);
        return res.status(200).json({ rate: usdtToUsdcRate });
    } catch (error) {
        console.error('Error getting USDT to USDC rate:', error);
        return res.status(500).send('Internal server error');
    }
});

// New endpoint for fetching USDC to USDT swap rate
app.post('/getUsdcToUsdtRate', async (req, res) => {
    console.log('Received request at /getUsdcToUsdtRate');
    console.log('Request body:', req.body);
    const { amount } = req.body;

    if (!amount) {
        console.log('Amount is missing');
        return res.status(400).send('Amount is required');
    }

    try {
        const usdcToUsdtRate = await getUsdcToUsdtSwapRate(amount);
        console.log('USDC to USDT Rate:', usdcToUsdtRate);
        return res.status(200).json({ rate: usdcToUsdtRate });
    } catch (error) {
        console.error('Error getting USDC to USDT rate:', error);
        return res.status(500).send('Internal server error');
    }
});

// New endpoint for fetching USDT to WETH swap rate
app.post('/getUsdtToWethRate', async (req, res) => {
    console.log('Received request at /getUsdtToWethRate');
    console.log('Request body:', req.body);
    const { amount } = req.body;

    if (!amount) {
        console.log('Amount is missing');
        return res.status(400).send('Amount is required');
    }

    try {
        const usdtToWethRate = await getUsdtToWethSwapRate(amount);
        console.log('USDT to WETH Rate:', usdtToWethRate);
        return res.status(200).json({ rate: usdtToWethRate });
    } catch (error) {
        console.error('Error getting USDT to WETH rate:', error);
        return res.status(500).send('Internal server error');
    }
});

// New endpoint for fetching WETH to USDT swap rate
app.post('/getWethToUsdtRate', async (req, res) => {
    console.log('Received request at /getWethToUsdtRate');
    console.log('Request body:', req.body);
    const { amount } = req.body;

    if (!amount) {
        console.log('Amount is missing');
        return res.status(400).send('Amount is required');
    }

    try {
        const wethToUsdtRate = await getWethToUsdtSwapRate(amount);
        console.log('WETH to USDT Rate:', wethToUsdtRate);
        return res.status(200).json({ rate: wethToUsdtRate });
    } catch (error) {
        console.error('Error getting WETH to USDT rate:', error);
        return res.status(500).send('Internal server error');
    }
});

// New endpoint for fetching USDC to WETH swap rate
app.post('/getUsdcToWethRate', async (req, res) => {
    console.log('Received request at /getUsdcToWethRate');
    console.log('Request body:', req.body);
    const { amount } = req.body;

    if (!amount) {
        console.log('Amount is missing');
        return res.status(400).send('Amount is required');
    }

    try {
        const usdcToWethRate = await getUsdcToWethSwapRate(amount);
        console.log('USDC to WETH Rate:', usdcToWethRate);
        return res.status(200).json({ rate: usdcToWethRate });
    } catch (error) {
        console.error('Error getting USDC to WETH rate:', error);
        return res.status(500).send('Internal server error');
    }
});

// New endpoint for fetching WETH to USDC swap rate
app.post('/getWethToUsdcRate', async (req, res) => {
    console.log('Received request at /getWethToUsdcRate');
    console.log('Request body:', req.body);
    const { amount } = req.body;

    if (!amount) {
        console.log('Amount is missing');
        return res.status(400).send('Amount is required');
    }

    try {
        const wethToUsdcRate = await getWethToUsdcSwapRate(amount);
        console.log('WETH to USDC Rate:', wethToUsdcRate);
        return res.status(200).json({ rate: wethToUsdcRate });
    } catch (error) {
        console.error('Error getting WETH to USDC rate:', error);
        return res.status(500).send('Internal server error');
    }
});

// New endpoint for swapping USDT to USDC
app.post('/swapUsdtToUsdc', (req, res) => handlePrivateKeyAction(req, res, async (privateKey, res) => {
    const { amount } = req.body;
    console.log('Swapping USDT to USDC...');
    const transactionHash = await swapUsdtToUsdcAmount(privateKey, amount);
    return res.status(200).json({ transactionHash });
}));

// New endpoint for swapping USDC to USDT
app.post('/swapUsdcToUsdt', (req, res) => handlePrivateKeyAction(req, res, async (privateKey, res) => {
    const { amount } = req.body;
    console.log('Swapping USDC to USDT...');
    const transactionHash = await swapUsdcToUsdtAmount(privateKey, amount);
    return res.status(200).json({ transactionHash });
}));

// New endpoint for swapping USDT to WETH
app.post('/swapUsdtToWeth', (req, res) => handlePrivateKeyAction(req, res, async (privateKey, res) => {
    const { amount } = req.body;
    console.log('Swapping USDT to WETH...');
    const transactionHash = await swapUsdtToWethAmount(privateKey, amount);
    return res.status(200).json({ transactionHash });
}));

// New endpoint for swapping WETH to USDT
app.post('/swapWethToUsdt', (req, res) => handlePrivateKeyAction(req, res, async (privateKey, res) => {
    const { amount } = req.body;
    console.log('Swapping WETH to USDT...');
    const transactionHash = await swapWethToUsdtAmount(privateKey, amount);
    return res.status(200).json({ transactionHash });
}));

// New endpoint for swapping USDC to WETH
app.post('/swapUsdcToWeth', (req, res) => handlePrivateKeyAction(req, res, async (privateKey, res) => {
    const { amount } = req.body;
    console.log('Swapping USDC to WETH...');
    const transactionHash = await swapUsdcToWethAmount(privateKey, amount);
    return res.status(200).json({ transactionHash });
}));

// New endpoint for swapping WETH to USDC
app.post('/swapWethToUsdc', (req, res) => handlePrivateKeyAction(req, res, async (privateKey, res) => {
    const { amount } = req.body;
    console.log('Swapping WETH to USDC...');
    const transactionHash = await swapWethToUsdcAmount(privateKey, amount);
    return res.status(200).json({ transactionHash });
}));


app.use('/webhook', webhookRouter);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    setWebhook();
});
