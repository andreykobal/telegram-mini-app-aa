import React, { useEffect, useState } from 'react';
import { MoonPayProvider } from '@moonpay/moonpay-react';
import { MoonPayBuyWidget } from '@moonpay/moonpay-react';
import axios from 'axios';

const Buy = () => {
    const [signedUrl, setSignedUrl] = useState('');

    useEffect(() => {
        const fetchSignedUrl = async () => {
            try {
                const response = await axios.post(`/api/generate-signed-url`, {
                    walletAddress: '0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae', // replace with actual wallet address
                    currencyCode: 'eth',
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                console.log('Fetched signed URL:', response.data.signedUrl); // Debug log
                setSignedUrl(response.data.signedUrl);
            } catch (error) {
                console.error('Error fetching signed URL:', error.message);
            }
        };

        fetchSignedUrl();
    }, []);

    return (
        <MoonPayProvider apiKey="pk_test_loke4jjtbByc64dGCPcxsmF3pGA" debug>
            <div className='moonpay-widget-container'>
                {signedUrl && (
                    <MoonPayBuyWidget
                        className='moonpay-widget'
                        variant="embedded"
                        url={signedUrl}
                        visible
                    />
                )}
            </div>
        </MoonPayProvider>
    );
}

export default Buy;
