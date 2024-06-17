import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EthToUsdConverter = ({ ethValue }) => {
    const [usdValue, setUsdValue] = useState(null);

    useEffect(() => {
        const fetchExchangeRate = async () => {
            try {
                const apiKey = '9Q4RKP5SSNYQ6ZWYSF13R948NY15335VTR'; // Replace with your Etherscan API key
                const response = await axios.get(`https://api.etherscan.io/api?module=stats&action=ethprice&apikey=${apiKey}`);
                const rate = response.data.result.ethusd;
                setUsdValue(ethValue * rate);
            } catch (error) {
                console.error('Error fetching the exchange rate:', error);
            }
        };

        fetchExchangeRate();
    }, [ethValue]);

    return (
        <div>
            {usdValue !== null ? (
                <p>${usdValue.toFixed(2)} USD</p>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default EthToUsdConverter;
