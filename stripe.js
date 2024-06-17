//stripe.js
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { mintWithInitData } = require('./nftOwner');
const Session = require('./models/Session');
const YOUR_DOMAIN = process.env.WEB_APP_URL;


router.post('/create-checkout-session', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            line_items: [
                {
                    // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                    price: 'price_1PRHjFDaHIamwdLa78ewjrco',
                    quantity: 1,
                },
            ],
            mode: 'payment',
            return_url: `${YOUR_DOMAIN}/return?session_id={CHECKOUT_SESSION_ID}`,
            automatic_tax: { enabled: true },
        });

        console.log('Session created:', session.id);

        res.send({ clientSecret: session.client_secret });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.post('/session-status-mint', async (req, res) => {
    try {
        const { sessionId, initData } = req.body;

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Check if sessionId already exists in the database
        const existingSession = await Session.findOne({ sessionId });

        if (existingSession) {
            console.log('Existing Session:', existingSession);
            return res.send({
                status: 'complete',
                customer_email: existingSession.email,
                transaction_hash: existingSession.transactionHash
            });
        }

        if (session.status === 'complete') {
            const transactionHash = await mintWithInitData(initData);

            // Save the session data to the database
            const newSession = new Session({
                sessionId,
                email: session.customer_details.email,
                transactionHash
            });

            await newSession.save();

            res.send({
                status: session.status,
                customer_email: session.customer_details.email,
                transaction_hash: transactionHash
            });
        } else {
            res.send({
                status: session.status,
                customer_email: session.customer_details.email,
                transaction_hash: 'EMPTY'
            });
        }
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});



module.exports = router;