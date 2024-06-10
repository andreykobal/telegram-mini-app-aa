import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import { ReactComponent as CloseIcon } from './icons/circle-xmark-regular.svg';


const Swap = () => {
    const [initData, setInitData] = useState('');
    const [balances, setBalances] = useState({ usdtBalance: '', usdcBalance: '', wethBalance: '' });
    const [fromCurrency, setFromCurrency] = useState('USDT');
    const [toCurrency, setToCurrency] = useState('USDC');
    const [amount, setAmount] = useState('');
    const [rate, setRate] = useState('');
    const [transactionHash, setTransactionHash] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [popupContent, setPopupContent] = useState({ message: '', showLoader: false });


    const swapEndpoints = {
        'USDT-USDC': { rate: '/getUsdtToUsdcRate', swap: '/swapUsdtToUsdc' },
        'USDC-USDT': { rate: '/getUsdcToUsdtRate', swap: '/swapUsdcToUsdt' },
        'ETH-USDC': { rate: '/getWethToUsdcRate', swap: '/swapWethToUsdc' },
        'USDC-ETH': { rate: '/getUsdcToWethRate', swap: '/swapUsdcToWeth' },
        'ETH-USDT': { rate: '/getWethToUsdtRate', swap: '/swapWethToUsdt' },
        'USDT-ETH': { rate: '/getUsdtToWethRate', swap: '/swapUsdtToWeth' },
    };

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
                    const key = `${fromCurrency}-${toCurrency}`;
                    if (swapEndpoints[key]) {
                        const endpoint = swapEndpoints[key].rate;
                        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}${endpoint}`, { amount });
                        setRate(response.data.rate);
                    }
                } catch (error) {
                    console.error('Error fetching rate:', error.response ? error.response.data : error.message);
                }
            }
        };

        const delayDebounceFn = setTimeout(() => {
            fetchRate();
        }, 1000);

        return () => clearTimeout(delayDebounceFn);
    }, [amount, fromCurrency, toCurrency]);

    const handleSwitch = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
        setRate('');
    };

    const handleSwap = async () => {
        try {
            setShowPopup(true);
            setPopupContent({ message: 'Swapping...', showLoader: true });
            const key = `${fromCurrency}-${toCurrency}`;
            if (swapEndpoints[key]) {
                const endpoint = swapEndpoints[key].swap;
                const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}${endpoint}`, { initData, amount });
                setTransactionHash(response.data.transactionHash);

                const txLink = `https://sepolia.basescan.org/tx/${response.data.transactionHash}`;
                setPopupContent({
                    message: `Swap success - transaction hash: <a href="${txLink}" class="orange" target="_blank" rel="noopener noreferrer">${response.data.transactionHash}</a>`,
                    showLoader: false
                });

                // Fetch updated balances after successful swap
                const balanceResponse = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/getBalances`, { initData });
                setBalances(balanceResponse.data.balances);
            }
        } catch (error) {
            setPopupContent({ message: 'Error executing swap. Please try again.', showLoader: false });
            console.error('Error executing swap:', error.response ? error.response.data : error.message);
        }
    };


    const formatBalance = (balance) => parseFloat(balance).toFixed(4);

    return (
        <div className='Swap'>
            <p className="glow-text">Swap</p>
            <div className="balance-info">
                <p>ETH: {balances.ethBalance ? formatBalance(balances.ethBalance) : 'Loading...'}</p>
                <p>USDT: {balances.usdtBalance ? formatBalance(balances.usdtBalance) : 'Loading...'}</p>
                <p>USDC: {balances.usdcBalance ? formatBalance(balances.usdcBalance) : 'Loading...'}</p>
            </div>
            <div className="swap-widget">
                <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)}>
                    <option value="USDT">USDT</option>
                    <option value="USDC">USDC</option>
                    <option value="ETH">ETH</option>
                </select>
                <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Enter amount in ${fromCurrency}`}
                />
                <br />
                <button onClick={handleSwitch}>Switch</button>
                <br />
                <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)}>
                    <option value="USDT">USDT</option>
                    <option value="USDC">USDC</option>
                    <option value="ETH">ETH</option>
                </select>
                <input
                    type="text"
                    value={rate ? parseFloat(rate).toFixed(4) : ''}
                    readOnly
                    placeholder={`Amount in ${toCurrency}`}
                />
            </div>
            <button onClick={handleSwap}>Swap</button>

            {showPopup && (
                <div className="popup">
                    <div className="popup-content">
                        {popupContent.showLoader ? (
                            <>
                                <p className="popup-content-message">{popupContent.message}</p>
                                <div className="lds-ripple"><div></div><div></div></div>
                            </>
                        ) : (
                            <>
                                <p className="popup-content-message" dangerouslySetInnerHTML={{ __html: popupContent.message }}></p>
                                <CloseIcon className='popup-close-icon' onClick={() => setShowPopup(false)} />
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Swap;
