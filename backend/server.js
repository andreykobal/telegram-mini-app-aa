const { privateKeyToAccount, generatePrivateKey } = require('viem/accounts')
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User'); // Import the User model
const { router: webhookRouter, setWebhook } = require('./webhook');

const app = express();
const port = 5001;

const BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const SECRET_KEY = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();

const uri = "YOUR_MONGODB_URL";

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
                    walletAddress: account.address,
                    privateKey
                });
                await user.save();
                console.log('New user created with wallet:', user);
            } else {
                console.log('User found:', user);
                if (!user.walletAddress || !user.privateKey) {
                    const privateKey = generatePrivateKey();
                    const account = privateKeyToAccount(privateKey);
                    user.walletAddress = account.address;
                    user.privateKey = privateKey;
                    await user.save();
                    console.log('Updated user with wallet:', user);
                }
            }

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