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
    const [transactionHash, setTransactionHash] = useState('');

    useEffect(() => {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const sessionId = urlParams.get('session_id');
        const initData = window.Telegram.WebApp.initData || '';

        const fetchSessionStatusAndMint = async () => {
            try {
                const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/session-status-mint`, { sessionId, initData });
                const data = res.data;
                setStatus(data.status);
                setCustomerEmail(data.customer_email);
                setTransactionHash(data.transaction_hash);
            } catch (error) {
                console.error('Error fetching session status and minting:', error);
            }
        };

        fetchSessionStatusAndMint();
    }, []);

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
                {transactionHash && transactionHash !== 'EMPTY' && (
                    <p>
                        Your transaction hash: <a href={`https://sepolia.basescan.org/tx/${transactionHash}`} target="_blank" rel="noopener noreferrer">{transactionHash}</a>
                    </p>
                )}
            </section>
        );
    }

    return null;
}

export { CheckoutForm, Return };
