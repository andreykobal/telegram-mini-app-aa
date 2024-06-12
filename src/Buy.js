import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Updated import
import { transakSDK } from '@transak/transak-sdk';
import { TransakConfig, Transak } from '@transak/transak-sdk';

const Buy = () => {
    const location = useLocation();
    const navigate = useNavigate(); // Add useNavigate hook
    const walletAddress = location.state?.walletAddress || ''; // Default if no address passed

    useEffect(() => {
        const transakConfig = {
            apiKey: process.env.REACT_APP_TRANSAK_API_KEY, // (Required)
            environment: Transak.ENVIRONMENTS.STAGING, // (Required)
            walletAddress, // Pass the wallet address here
            defaultNetwork: 'base', // Set the default network to Base
            cryptoCurrencyCode: 'ETH', // Set the default cryptocurrency to Ethereum
            productsAvailed: 'BUY', // Ensure the widget is for buying only
        };

        const transak = new Transak(transakConfig);

        transak.init();

        // To get all the events
        Transak.on('*', (data) => {
            console.log(data);
        });

        // This will trigger when the user closed the widget
        Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
            console.log('Transak SDK closed!');
            navigate('/'); // Navigate to home
        });

        /*
        * This will trigger when the user has confirmed the order
        * This doesn't guarantee that payment has completed in all scenarios
        * If you want to close/navigate away, use the TRANSAK_ORDER_SUCCESSFUL event
        */
        Transak.on(Transak.EVENTS.TRANSAK_ORDER_CREATED, (orderData) => {
            console.log(orderData);
        });

        /*
        * This will trigger when the user marks payment is made
        * You can close/navigate away at this event
        */
        Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData) => {
            console.log(orderData);
            transak.close();
            navigate('/'); // Navigate to home
        });
    }, [walletAddress, navigate]); // Added navigate to dependency array

    return <div>Buy Component</div>;
};

export default Buy;
