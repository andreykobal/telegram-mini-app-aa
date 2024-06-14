const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const YOUR_DOMAIN = process.env.WEB_APP_URL;

const endpointSecret = "whsec_CpbeHKYZfGFVpWI84jDh18lGashwnQx6";

router.post('/webhook', express.raw({ type: 'application/json' }), (request, response) => {
    const sig = request.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.async_payment_failed':
            const checkoutSessionAsyncPaymentFailed = event.data.object;
            console.log(checkoutSessionAsyncPaymentFailed);
            // Then define and call a function to handle the event checkout.session.async_payment_failed
            break;
        case 'checkout.session.async_payment_succeeded':
            const checkoutSessionAsyncPaymentSucceeded = event.data.object;
            console.log("✅✅✅ checkout session async payment succeeded");
            console.log(checkoutSessionAsyncPaymentSucceeded);
            // Then define and call a function to handle the event checkout.session.async_payment_succeeded
            break;
        case 'checkout.session.completed':
            const checkoutSessionCompleted = event.data.object;
            console.log("✅✅✅ checkout session completed");
            console.log(checkoutSessionCompleted);
            // Then define and call a function to handle the event checkout.session.completed
            break;
        case 'checkout.session.expired':
            const checkoutSessionExpired = event.data.object;
            console.log(checkoutSessionExpired);
            // Then define and call a function to handle the event checkout.session.expired
            break;
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    console.log('Webhook received' + response);
    response.send();
});

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

router.get('/session-status', async (req, res) => {
    try {
        console.log('Session ID:', req.query.session_id);

        const session = await stripe.checkout.sessions.retrieve(req.query.session_id);


        res.send({
            status: session.status,
            customer_email: session.customer_details.email
        });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;