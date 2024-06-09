// Swap.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const Swap = () => {
    const [initData, setInitData] = useState('');
    const [balances, setBalances] = useState({ usdtBalance: '', usdcBalance: '' });

    useEffect(() => {
        if (window.Telegram.WebApp.initData) {
            setInitData(window.Telegram.WebApp.initData);
        }

        const authenticateData = async () => {
            try {
                const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/authenticate`, { initData });
                const balanceResponse = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/getBalances`, { initData });
                setBalances(balanceResponse.data.balances);
            } catch (error) {
                console.error('Error validating data:', error);
            }
        };

        authenticateData();
    }, [initData]);

    const formatBalance = (balance) => {
        return parseFloat(balance).toFixed(4);
    };

    return (
        <div className='Swap'>
            <p className="glow-text">Swap</p>
            <div className="balance-info">
                <p>USDT balance: {balances.usdtBalance ? formatBalance(balances.usdtBalance) : 'Loading...'}</p>
                <p>USDC balance: {balances.usdcBalance ? formatBalance(balances.usdcBalance) : 'Loading...'}</p>
            </div>
        </div>
    );
};

export default Swap;