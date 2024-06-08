//backend/index.js

const { generatePrivateKey } = require('viem/accounts')
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User'); // Import the User model
const { router: webhookRouter, setWebhook } = require('./webhook');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const { mint, transferNFT, getNFTs, getSmartWalletAddress, sendETH} = require("./nft"); 
const fs = require('fs');
const metadata = JSON.parse(fs.readFileSync('metadata.json', 'utf8'));
const MetadataIndex = require('./models/MetadataIndex'); 

require('dotenv').config();




const app = express();
const port = process.env.PORT || 5001;

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_KEY = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();

const uri = process.env.MONGODB_URI;

// Azure Key Vault configuration
const keyVaultName = "aa-testnet";
const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;
const credential = new DefaultAzureCredential();
const secretClient = new SecretClient(keyVaultUrl, credential);

// Connect to MongoDB
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

app.post('/authenticate', async (req, res) => {
    console.log('Received request at /authenticate');
    console.log('Request body:', req.body);
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
            return res.status(200).json({ user });
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).send('Internal server error');
        }
    } else {
        console.log('Validation failed. Invalid data.');
        return res.status(403).send('Invalid data');
    }
});

app.post('/sendETH', async (req, res) => {
    console.log('Received request at /sendETH');
    console.log('Request body:', req.body);
    const { initData, toAddress, amount } = req.body;

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
            console.log('Sending ETH...');
            const transactionHash = await sendETH(privateKey, toAddress, amount);  // Capture the returned transaction hash

            return res.status(200).json({ transactionHash });  // Respond with the transaction hash
        } catch (error) {
            console.error('Error retrieving private key or sending ETH:', error);
            return res.status(500).send('Internal server error');
        }
    } else {
        console.log('Validation failed. Invalid data.');
        return res.status(403).send('Invalid data');
    }
});


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



app.post('/mint', async (req, res) => {
    console.log('Received request at /mint');
    console.log('Request body:', req.body);
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
            const tokenURI = await getTokenURI();  // Get the next token URI
            console.log('Private Key:', privateKey);
            console.log('Minting NFT with Token URI:', tokenURI);
            const transactionHash = await mint(privateKey, tokenURI);  // Pass the token URI to the mint function

            return res.status(200).json({ transactionHash });
        } catch (error) {
            console.error('Error retrieving private key or minting NFT:', error);
            return res.status(500).send('Internal server error');
        }
    } else {
        console.log('Validation failed. Invalid data.');
        return res.status(403).send('Invalid data');
    }
});



app.post('/transfer', async (req, res) => {
    console.log('Received request at /transfer');
    console.log('Request body:', req.body);
    const { initData, tokenId, toAddress } = req.body;

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
            console.log('Transferring NFT...');
            const transactionHash = await transferNFT(privateKey, tokenId, toAddress);  // Capture the returned transaction hash

            return res.status(200).json({ transactionHash });  // Respond with the transaction hash
        } catch (error) {
            console.error('Error retrieving private key or transferring NFT:', error);
            return res.status(500).send('Internal server error');
        }
    } else {
        console.log('Validation failed. Invalid data.');
        return res.status(403).send('Invalid data');
    }
});


app.post('/getNFTs', async (req, res) => {
    console.log('Received request at /getNFTs');
    console.log('Request body:', req.body);
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
            console.log('Retrieving NFTs...');
            const data = await getNFTs(privateKey);

            // Convert BigInt to string before sending JSON response
            const nfts = [
                data[0].map(id => id.toString()),
                data[1]
            ];

            return res.status(200).json({ nfts });
        } catch (error) {
            console.error('Error retrieving private key or NFTs:', error);
            return res.status(500).send('Internal server error');
        }
    } else {
        console.log('Validation failed. Invalid data.');
        return res.status(403).send('Invalid data');
    }
});


app.use('/webhook', webhookRouter);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    setWebhook();
});
