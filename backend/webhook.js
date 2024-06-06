const express = require('express');
const axios = require('axios');

const router = express.Router();

const BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const WEBHOOK_URL = `https://f1a07255bfc6.ngrok.app/webhook`; // Replace with your actual webhook URL

router.post('/', async (req, res) => {
    console.log('Received webhook');
    const { message } = req.body;

    if (message && message.text && message.text === '/start') {
        const chatId = message.chat.id;

        const replyMarkup = {
            inline_keyboard: [[
                {
                    text: 'OPEN APP 🚀',
                    web_app: {
                        url: 'https://dc26e00cbe0c.ngrok.app'
                    }
                }
            ]]
        };

        try {
            const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
                chat_id: chatId,
                text: `
🪄 *Welcome to Account Abstraction Magic!* 🪄

✨ *A seamless experience for Telegram users!*

💼 *Custodial Wallet:* 
Created at first use, securely stored in Azure Key Vault.
🔑 *Smart Accounts:* 
Auto-creation using Biconomy's AA.
⚡️ *Mint NFTs:* 
Tap the mint button to use your smart account.
💸 *No Gas Fees:* 
Biconomy Paymaster covers them!
🔄 *Transfer NFTs:* 
Withdraw and transfer your NFTs easily.
🌐 *View on OpenSea:* 
Check out your NFTs on OpenSea.
⚡️ *Deployed on Base:* 
Fast, cheap transactions.
📲 *Your NFTs:* 
Displayed directly in the app.

👉 Click the button below to open app!
`,
                reply_markup: replyMarkup,
                parse_mode: "Markdown"
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

module.exports = { router, setWebhook };
