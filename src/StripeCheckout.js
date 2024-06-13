// StripeCheckout.js
import React, { useCallback, useState, useEffect } from "react";
import { loadStripe } from '@stripe/stripe-js';
import {
    EmbeddedCheckoutProvider,
    EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { Navigate } from "react-router-dom";
import axios from 'axios';

// This is your test public API key.
const stripePromise = loadStripe("pk_test_51PQvlnDaHIamwdLarWLmauQm0XqEynnoKi8yA9HSM4DgptQ0DRF7jEuh6lqcIGapexScG9oI5RUtjsWHujApaich00imDV2PBS");

const CheckoutForm = () => {
    const fetchClientSecret = useCallback(() => {
        // Create a Checkout Session
        return fetch(`${process.env.REACT_APP_BACKEND_URL}/create-checkout-session`, {
            method: "POST",
        })
            .then((res) => res.json())
            .then((data) => data.clientSecret);
    }, []);

    const options = { fetchClientSecret };

    return (
        <div id="checkout">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
                <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
        </div>
    );
}

const Return = () => {
    const [status, setStatus] = useState(null);
    const [customerEmail, setCustomerEmail] = useState('');
    const [initData, setInitData] = useState('');

    const mint = useCallback(async () => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/mint`, { initData });
            console.log(response.data);
            const { transactionHash } = response.data;
            const txLink = `https://sepolia.basescan.org/tx/${transactionHash}`;
            alert(`Minted NFT! View transaction: ${txLink}`);
        } catch (error) {
            console.error('Error minting data:', error);
        }
    }, [initData]);

    useEffect(() => {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const sessionId = urlParams.get('session_id');

        const fetchSessionStatus = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/session-status?session_id=${sessionId}`);
                const data = await res.json();
                setStatus(data.status);
                setCustomerEmail(data.customer_email);
                if (data.status === 'complete' && window.Telegram.WebApp.initData) {
                    setInitData(window.Telegram.WebApp.initData);
                }
            } catch (error) {
                console.error('Error fetching session status:', error);
            }
        };

        fetchSessionStatus();
    }, []);

    useEffect(() => {
        if (status === 'complete' && initData) {
            mint();
        }
    }, [status, initData, mint]);

    if (status === 'open') {
        return <Navigate to="/checkout" />;
    }

    if (status === 'complete') {
        return (
            <section id="success">
                <p>
                    We appreciate your business! A confirmation email will be sent to {customerEmail}.
                    If you have any questions, please email <a href="mailto:orders@example.com">orders@example.com</a>.
                </p>
            </section>
        );
    }

    return null;
}

export { CheckoutForm, Return };
