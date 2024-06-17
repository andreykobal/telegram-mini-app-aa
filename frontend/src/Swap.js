import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import { ReactComponent as CloseIcon } from './icons/circle-xmark-regular.svg';
import { ReactComponent as SwitchIcon } from './icons/right-left-solid.svg';
import { ReactComponent as InfoIcon } from './icons/circle-info-solid.svg';
import { BackButton } from '@vkruglikov/react-telegram-web-app';
import CustomSelect from './CustomSelect';

const EthIcon = require('./icons/eth.png');
const UsdtIcon = require('./icons/usdt.png');
const UsdcIcon = require('./icons/usdc.png');



const Swap = () => {
    const [initData, setInitData] = useState('');
    const [balances, setBalances] = useState({ usdtBalance: '', usdcBalance: '', wethBalance: '' });
    const [fromCurrency, setFromCurrency] = useState('ETH'); // Change default to 'ETH'
    const [toCurrency, setToCurrency] = useState('USDT'); // Change default to 'USDT'
    const [amount, setAmount] = useState('');
    const [rate, setRate] = useState('');
    const [transactionHash, setTransactionHash] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [popupContent, setPopupContent] = useState({ message: '', showLoader: false });

    const navigate = useNavigate();


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
                const response = await axios.post(`/authenticate`, { initData });
                const balanceResponse = await axios.post(`/getBalances`, { initData });
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
                        const response = await axios.post(`${endpoint}`, { amount });
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
                const response = await axios.post(`${endpoint}`, { initData, amount });
                setTransactionHash(response.data.transactionHash);

                const txLink = `https://sepolia.basescan.org/tx/${response.data.transactionHash}`;
                setPopupContent({
                    message: `Swap success - transaction hash: <a href="${txLink}" class="orange" target="_blank" rel="noopener noreferrer">${response.data.transactionHash}</a>`,
                    showLoader: false
                });

                // Fetch updated balances after successful swap
                const balanceResponse = await axios.post(`/getBalances`, { initData });
                setBalances(balanceResponse.data.balances);
            }
        } catch (error) {
            setPopupContent({ message: 'Error executing swap. Please try again.', showLoader: false });
            console.error('Error executing swap:', error.response ? error.response.data : error.message);
        }
    };

    const [exchangeRate, setExchangeRate] = useState('');

    useEffect(() => {
        const fetchExchangeRate = async () => {
            try {
                const key = `${fromCurrency}-${toCurrency}`;
                if (swapEndpoints[key]) {
                    const endpoint = swapEndpoints[key].rate;
                    const response = await axios.post(`${endpoint}`, { amount: "1" });
                    setExchangeRate(response.data.rate);
                }
            } catch (error) {
                console.error('Error fetching exchange rate:', error.response ? error.response.data : error.message);
            }
        };

        fetchExchangeRate();
    }, [fromCurrency, toCurrency]);



    const formatBalance = (balance) => parseFloat(balance).toFixed(4);


    return (
        <div className='Swap'>
            <div className="balance-info">
                <div className="balance-info-item">
                    <p>{balances.ethBalance ? formatBalance(balances.ethBalance) : 'Loading...'}</p> 
                    <img src={EthIcon} alt="ETH" className='currency-icon' />
                    <p>ETH</p>
                </div>
                <div className="balance-info-item">
                    <p>{balances.usdtBalance ? formatBalance(balances.usdtBalance) : 'Loading...'}</p>
                    <img src={UsdtIcon} alt="USDT" className='currency-icon' />
                    <p>USDT</p>
                </div>
                <div className="balance-info-item">
                    <p>{balances.usdcBalance ? formatBalance(balances.usdcBalance) : 'Loading...'}</p>
                    <img src={UsdcIcon} alt="USDC" className='currency-icon' />
                    <p>USDC</p>
                </div>    




            </div>
            <div className="swap-widget">
                <div className="swap-widget-header">
                    <p className="swap-widget-label glow-text">Swap</p>
                    <div className="swap-input">
                        <input
                            className='swap-input-field'
                            type="text"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`0.00 ${fromCurrency}`}
                        />
                        <CustomSelect
                            value={fromCurrency}
                            label={fromCurrency}
                            onChange={(option) => setFromCurrency(option.label)}
                            initialOption="ETH" // Update this line
                        />
                    </div>
                </div>

                <div className='switch-button' onClick={handleSwitch}>
                    <SwitchIcon className="switch-button-icon" />
                </div>

                <div className="swap-widget-footer">
                    <p className="swap-widget-label glow-text">For</p>
                    <div className="swap-input">
                        <input
                            className='swap-input-field'
                            type="text"
                            value={rate ? parseFloat(rate).toFixed(4) : ''}
                            readOnly
                            placeholder={`0.00 ${toCurrency}`}
                        />
                        <CustomSelect
                            value={toCurrency}
                            label={toCurrency}
                            onChange={(option) => setToCurrency(option.label)}
                            initialOption="USDT" // Update this line
                        />
                    </div>
                    <div className="swap-rate">
                        <InfoIcon className='info-icon' />
                        <p>1 {fromCurrency} = {exchangeRate ? parseFloat(exchangeRate).toFixed(4) : 'Loading...'} {toCurrency}</p>
                    </div>
                    <button className="swap-button" onClick={handleSwap}>Swap</button>
                </div>

            </div>
            <div style={{ height: '73px' }}></div>

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
            <BackButton onClick={() => navigate(-1)} />
        </div>
    );
};

export default Swap;
