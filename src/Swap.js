import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const Swap = () => {
    const [initData, setInitData] = useState('');
    const [balances, setBalances] = useState({ usdtBalance: '', usdcBalance: '' });
    const [fromCurrency, setFromCurrency] = useState('USDT');
    const [toCurrency, setToCurrency] = useState('USDC');
    const [amount, setAmount] = useState('');
    const [rate, setRate] = useState('');
    const [transactionHash, setTransactionHash] = useState('');

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
                console.error('Error validating data:', error.response ? error.response.data : error.message);
            }
        };

        authenticateData();
    }, [initData]);

    useEffect(() => {
        const fetchRate = async () => {
            if (amount) {
                try {
                    const endpoint = fromCurrency === 'USDT' ? '/getUsdtToUsdcRate' : '/getUsdcToUsdtRate';
                    const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}${endpoint}`, { amount });
                    setRate(response.data.rate);
                } catch (error) {
                    console.error('Error fetching rate:', error.response ? error.response.data : error.message);
                }
            }
        };

        const delayDebounceFn = setTimeout(() => {
            fetchRate();
        }, 1000);

        return () => clearTimeout(delayDebounceFn);
    }, [amount, fromCurrency]);

    const handleSwitch = () => {
        setFromCurrency(fromCurrency === 'USDT' ? 'USDC' : 'USDT');
        setToCurrency(toCurrency === 'USDT' ? 'USDC' : 'USDT');
        setRate('');
    };

    const handleSwap = async () => {
        try {
            const endpoint = fromCurrency === 'USDT' ? '/swapUsdtToUsdc' : '/swapUsdcToUsdt';
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}${endpoint}`, { initData, amount });
            setTransactionHash(response.data.transactionHash);
            alert(`Swap successful! Transaction hash: ${response.data.transactionHash}`);

            // Fetch updated balances after successful swap
            const balanceResponse = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/getBalances`, { initData });
            setBalances(balanceResponse.data.balances);
        } catch (error) {
            console.error('Error executing swap:', error.response ? error.response.data : error.message);
            alert('Swap failed!');
        }
    };

    const formatBalance = (balance) => parseFloat(balance).toFixed(4);

    return (
        <div className='Swap'>
            <p className="glow-text">Swap</p>
            <div className="balance-info">
                <p>USDT balance: {balances.usdtBalance ? formatBalance(balances.usdtBalance) : 'Loading...'}</p>
                <p>USDC balance: {balances.usdcBalance ? formatBalance(balances.usdcBalance) : 'Loading...'}</p>
            </div>
            <div className="swap-widget">
                <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Enter amount in ${fromCurrency}`}
                />
                <br />
                <button onClick={handleSwitch}>Switch</button>
                <br />
                <input
                    type="text"
                    value={rate ? parseFloat(rate).toFixed(4) : ''}
                    readOnly
                    placeholder={`Amount in ${toCurrency}`}
                />
            </div>
            <button onClick={handleSwap}>Swap</button>
        </div>
    );
};

export default Swap;
