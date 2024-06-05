const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 5001;

const BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const WEBHOOK_URL = `https://f1a07255bfc6.ngrok.app/webhook`; // Replace with your actual webhook URL
// Compute the secret key using the bot token
const SECRET_KEY = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function validateTelegramData(initData) {
    console.log('Validating Telegram Data:', initData);
    const urlParams = new URLSearchParams(initData);

    // Generate the data check string
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

app.post('/webhook', async (req, res) => {
    console.log('Received webhook');
    const { message } = req.body;

    if (message && message.text && message.text === '/start') {
        const chatId = message.chat.id;

        const replyMarkup = {
            inline_keyboard: [[
                {
                    text: 'Play',
                    web_app: {
                        url: 'https://dc26e00cbe0c.ngrok.app'
                    }
                }
            ]]
        };

        try {
            const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
                chat_id: chatId,
                text: 'Click the button below to play!',
                reply_markup: replyMarkup
            });

            if (response.data.ok) {
                console.log('Message sent successfully');
                res.status(200).send('Message sent');
            } else {
                console.log('Failed to send message:', response.data);
                res.status(500).send('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send('Error sending message');
        }
    } else {
        res.status(200).send('Not a /start command');
    }
});

async function setWebhook() {
    try {
        const response = await axios.post(`${TELEGRAM_API_URL}/setWebhook`, {
            url: WEBHOOK_URL
        });

        if (response.data.ok) {
            console.log('Webhook set successfully');
        } else {
            console.log('Failed to set webhook:', response.data);
        }
    } catch (error) {
        console.error('Error setting webhook:', error);
    }
}

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    setWebhook();
});