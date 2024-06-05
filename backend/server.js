const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');
const { router: webhookRouter, setWebhook } = require('./webhook');

const app = express();
const port = 5001;

const BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const SECRET_KEY = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();

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

app.post('/validate', (req, res) => {
    console.log('Received request at /validate');
    console.log('Request body:', req.body);
    const { initData } = req.body;

    if (!initData) {
        console.log('Init data is missing');
        return res.status(400).send('Init data is required');
    }

    if (validateTelegramData(initData)) {
        const urlParams = new URLSearchParams(initData);
        const userId = urlParams.get('user') ? JSON.parse(urlParams.get('user')).id : null;
        console.log('Validation successful. Telegram ID:', userId);
        return res.status(200).send('Data is valid');
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
