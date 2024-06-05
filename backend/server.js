const { privateKeyToAccount, generatePrivateKey } = require('viem/accounts')
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User'); // Import the User model
const { router: webhookRouter, setWebhook } = require('./webhook');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

const app = express();
const port = 5001;

const BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const SECRET_KEY = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();

const uri = "YOUR_MONGODB_URL";

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

app.post('/validate', async (req, res) => {
    console.log('Received request at /validate');
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
                const account = privateKeyToAccount(privateKey);
                user = new User({
                    telegramId,
                    walletAddress: account.address
                });
                await user.save();
                await storePrivateKeyInKeyVault(telegramId, privateKey);
                console.log('New user created with wallet:', user);
            } else {
                console.log('User found:', user);
                if (!user.walletAddress) {
                    const privateKey = generatePrivateKey();
                    const account = privateKeyToAccount(privateKey);
                    user.walletAddress = account.address;
                    await user.save();
                    await storePrivateKeyInKeyVault(telegramId, privateKey);
                    console.log('Updated user with wallet:', user);
                }
            }

            const privateKey = await getPrivateKeyFromKeyVault(String(telegramId));
            console.log('Private Key:', privateKey);

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

app.use('/webhook', webhookRouter);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    setWebhook();
});
