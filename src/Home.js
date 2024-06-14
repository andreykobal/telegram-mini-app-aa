//Home.js

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ReactComponent as CloseIcon } from './icons/circle-xmark-regular.svg';
import { ReactComponent as LogoMark } from './icons/Logomark-Blue.svg';
import { ReactComponent as CardIcon } from './icons/credit-card-regular.svg';
import { ReactComponent as SendIcon } from './icons/arrow-up-solid.svg';
import { ReactComponent as SwapIcon } from './icons/right-left-solid.svg';
import { ReactComponent as NftIcon } from './icons/gem-regular.svg';
import { ReactComponent as CopyIcon } from './icons/copy-solid.svg';
import BaseIcon from './icons/base-logo-in-blue.png';  // Adjust the path based on your file structure


import { getWalletBalance } from './balance'; // Import the balance fetching function
import './App.css';
import EthToUsdConverter from './EthToUsdConverter';



const Home = () => {
    const [initData, setInitData] = useState('');
    const [tokenId, setTokenId] = useState('');
    const [toAddress, setToAddress] = useState('');
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [popupContent, setPopupContent] = useState({ message: '', showLoader: false });
    const [walletAddress, setWalletAddress] = useState('');
    const [walletBalance, setWalletBalance] = useState('');
    const [amount, setAmount] = useState('');
    const [transferType, setTransferType] = useState('');
    const [showCopyPopup, setShowCopyPopup] = useState(false);


    const navigate = useNavigate();


    const getRarityDetails = (rarity) => {
        switch (rarity) {
            case 100: return { label: 'Uncommon', className: 'uncommon', color: '🟢' };
            case 200: return { label: 'Rare', className: 'rare', color: '🔵' };
            case 300: return { label: 'Epic', className: 'epic', color: '🟣' };
            case 400: return { label: 'Legendary', className: 'legendary', color: '🟠' };
            case 500: return { label: 'Mythical', className: 'mythical', color: '🔴' };
            default: return { label: 'Common', className: 'unknown', color: '⚪' };
        }
    };

    const updatePinataUrl = (url) => {
        const pinataGatewayToken = process.env.REACT_APP_PINATA_TOKEN;
        const pinataGatewayPrefix = "https://gateway.pinata.cloud/ipfs/";
        const newPrefix = "https://myethernity.mypinata.cloud/ipfs/";

        if (url.startsWith(pinataGatewayPrefix)) {
            const cid = url.split(pinataGatewayPrefix)[1];
            return `${newPrefix}${cid}?pinataGatewayToken=${pinataGatewayToken}`;
        }

        return url;
    };

    useEffect(() => {
        if (window.Telegram.WebApp.initData) {
            setInitData(window.Telegram.WebApp.initData);
        }

        const authenticateData = async () => {
            try {
                const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/authenticate`, { initData });
                console.log(response.data);
                setWalletAddress(response.data.user.walletAddress);
                getNFTs();
                const balance = await getWalletBalance(response.data.user.walletAddress); // Fetch wallet balance
                setWalletBalance(balance); // Set the fetched balance
            } catch (error) {
                console.error('Error validating data:', error);
            }
        };

        authenticateData();
    }, [initData]);

    const getNFTs = async () => {
        try {
            setLoading(true);
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/getNFTs`, { initData });
            console.log(response.data);
            const nftPromises = response.data.nfts[0].map(async (tokenId, index) => {
                const tokenUri = response.data.nfts[1][index];
                const metadata = await fetchMetadata(updatePinataUrl(tokenUri));
                return { tokenId, metadata };
            });
            let nftData = await Promise.all(nftPromises);
            nftData = nftData.sort((a, b) => b.tokenId - a.tokenId);
            setNfts(nftData);
        } catch (error) {
            console.error('Error fetching NFTs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMetadata = async (url) => {
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching metadata:', error);
        }
    };

    const mint = async () => {
        try {
            setShowPopup(true);
            setPopupContent({ message: 'Minting NFT...', showLoader: true });
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/mint`, { initData });
            console.log(response.data);
            const { transactionHash } = response.data;
            const txLink = `https://sepolia.basescan.org/tx/${transactionHash}`;
            setPopupContent({
                message: `Minting success - transaction hash: <a href="${txLink}" class="orange" target="_blank" rel="noopener noreferrer">${transactionHash}</a>`,
                showLoader: false
            });
            getNFTs();
        } catch (error) {
            setPopupContent({ message: 'Error minting NFT. Please try again.', showLoader: false });
            console.error('Error minting data:', error);
        }
    };

    const transfer = async () => {
        try {
            setPopupContent({ message: 'Transferring NFT...', showLoader: true });
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/transfer`, { initData, tokenId, toAddress });
            console.log(response.data);
            const { transactionHash } = response.data;
            const txLink = `https://sepolia.basescan.org/tx/${transactionHash}`;
            setPopupContent({
                message: `Transfer success - transaction hash: <a href="${txLink}" class="orange" target="_blank" rel="noopener noreferrer">${transactionHash}</a>`,
                showLoader: false
            });
            getNFTs();
        } catch (error) {
            setPopupContent({ message: 'Error transferring NFT. Please try again.', showLoader: false });
            console.error('Error transferring NFT:', error);
        }
    };

    useEffect(() => {
        if (walletAddress) {
            const interval = setInterval(async () => {
                const balance = await getWalletBalance(walletAddress);
                setWalletBalance(balance);
            }, 1500); // 1500 milliseconds = 1.5 seconds

            return () => clearInterval(interval); // Cleanup interval on component unmount
        }
    }, [walletAddress]);

    const openTransferPopup = (tokenId) => {
        setTokenId(tokenId);
        setPopupContent({ message: '', showLoader: false });
        setTransferType('NFT');
        setShowPopup(true);
    };

    const sendEth = async (amount, toAddress) => {
        try {
            setPopupContent({ message: 'Sending ETH...', showLoader: true });
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/sendETH`, { initData, toAddress, amount });
            const { transactionHash } = response.data;
            const txLink = `https://sepolia.basescan.org/tx/${transactionHash}`;
            setPopupContent({
                message: `Transaction successful - transaction hash: <a href="${txLink}" class="orange" target="_blank" rel="noopener noreferrer">${transactionHash}</a>`,
                showLoader: false
            });
            const balance = await getWalletBalance(walletAddress); // Fetch wallet balance after sending ETH
            setWalletBalance(balance); // Update the wallet balance
        } catch (error) {
            setPopupContent({ message: 'Error sending ETH. Please try again.', showLoader: false });
            console.error('Error sending ETH:', error);
        }
    };

    const openSendEthPopup = () => {
        setPopupContent({ message: '', showLoader: false });
        setTransferType('ETH');
        setShowPopup(true);
    };

    useEffect(() => {
        if (showPopup) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [showPopup]);

    function formatWalletAddress(walletAddress) {
        if (walletAddress.length <= 12) {
            return walletAddress; // If the address is too short, just return it as is
        }
        
        const firstPart = walletAddress.substring(0, 7);
        const lastPart = walletAddress.substring(walletAddress.length - 5);
        
        return `${firstPart}...${lastPart}`;
    }


    const handleCopyClick = () => {
        navigator.clipboard.writeText(walletAddress);
        setShowCopyPopup(true);
        setTimeout(() => {
            setShowCopyPopup(false);
        }, 2000);
    };


    return (
        <div className="Home">
            <div className="nft-page">
                {/* button navigate /checkout */}
                {/* <button onClick={() => navigate('/checkout')}>Stripe</button> */}
                <div className="mint-header">
                    {/* <p className='glow-text'>✨ Account Abstraction Magic ✨</p> */}
                    <div className="mint-header-wallet-address" onClick={handleCopyClick}>
                    <p>{formatWalletAddress(walletAddress)}</p>
                    <CopyIcon className='copy-icon'/>
                    </div>
                    <div className='header-network'>
                        <img src={BaseIcon} alt="Base Sepolia" className="base-icon" />
                        <p>Base Sepolia</p>
                    </div>

                    <h2>{parseFloat(walletBalance).toFixed(4)} ETH</h2> {/* Display wallet balance */}
                    <EthToUsdConverter ethValue={walletBalance} />
                    <div className="mint-header-icons">
                        <div className="mint-header-icon" onClick={() => navigate('/buy', { state: { walletAddress } })}>
                        {/* <div className="mint-header-icon inactive"> */}
                            <div className="mint-header-icon-svg-wrapper">
                                <CardIcon className="mint-header-icon-svg" />
                            </div>
                            <p>Buy</p>
                        </div>
                        <div className="mint-header-icon" onClick={openSendEthPopup}>
                            <div className="mint-header-icon-svg-wrapper">
                                <SendIcon className="mint-header-icon-svg" />
                            </div>
                            <p>Send</p>
                        </div>
                        <div className="mint-header-icon" onClick={() => navigate('/swap')}>
                            <div className="mint-header-icon-svg-wrapper">
                            <SwapIcon className="mint-header-icon-svg" />
                            </div>
                            <p>Swap</p>
                        </div>
                        <div className="mint-header-icon" onClick={mint}>
                            <div className="mint-header-icon-svg-wrapper">
                            <NftIcon className="mint-header-icon-svg" />
                            </div>
                            <p>Mint</p>
                        </div>
                    </div>
                </div>
                {loading && (
                    <div className="loading-overlay">
                        <p>Loading NFTs...</p>
                        <div className="lds-ripple"><div></div><div></div></div>
                    </div>
                )}
                <div className="nft-container">
                    {nfts.map((nft, index) => {
                        const { name, image, attributes } = nft.metadata;
                        const { className, color, label } = getRarityDetails(attributes.find(attr => attr.trait_type === 'rarity').value);
                        const multiplier = attributes.find(attr => attr.trait_type === 'multiplier').value;
                        const bonus = attributes.find(attr => attr.trait_type === 'bonus').value;

                        return (
                            <div className={`nft-card flip-card no-overflow`} key={index}>
                                <div className={`flip-card-inner ${className}`}>
                                    <div className="flip-card-front" style={{ backgroundImage: `url(${updatePinataUrl(image)})` }}>
                                        <div className='nft-card-header'>
                                            <div className="sell-opensea-blank">
                                            </div>
                                            <p>{name}</p>
                                            <div className="sell-opensea" onClick={() => window.open(`https://testnets.opensea.io/assets/base-sepolia/0xa4aae0C5C5B86A5d388d50377ccf0060A6bFbf1f/${nft.tokenId}/`, '_blank')}>
                                                <LogoMark className='logo-opensea' />
                                            </div>
                                        </div>
                                        <div className='nft-card-body'>
                                            <div className="nft-info">
                                                <p>❤️+{multiplier}</p>
                                                <p>{color}{label}</p>
                                                <p>🪙{bonus.toLocaleString()}</p>
                                            </div>
                                            <div className="nft-button-use" onClick={() => openTransferPopup(nft.tokenId)}>Transfer</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {showCopyPopup && (
                        <div className="copy-popup">
                            <p>Copied to clipboard!</p>
                        </div>
                    )}

                </div>
            </div>

            {showPopup && (
                <div className="popup">
                    <div className="popup-content">
                        {popupContent.showLoader ? (
                            <>
                                <p className="popup-content-message">{popupContent.message}</p>
                                <div className="lds-ripple"><div></div><div></div></div>
                            </>
                        ) : popupContent.message.includes('transaction hash') ? (
                            <>
                                <p className="popup-content-message" dangerouslySetInnerHTML={{ __html: popupContent.message }}></p>
                                <CloseIcon className='popup-close-icon' onClick={() => setShowPopup(false)} />
                            </>
                        ) : (
                            transferType === 'NFT' ? (
                                <>
                                    <p>Transfer NFT with id: {tokenId}</p>
                                    <input
                                        type="text"
                                        placeholder="Enter wallet address"
                                        value={toAddress}
                                        onChange={(e) => setToAddress(e.target.value)}
                                    />
                                    <div>
                                        <button className='pulse-orange-button' onClick={transfer}>Send</button>
                                        <CloseIcon className='popup-close-icon' onClick={() => setShowPopup(false)} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p>Send ETH</p>
                                    <input
                                        type="text"
                                        placeholder="Enter amount in ETH"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Enter recipient address"
                                        value={toAddress}
                                        onChange={(e) => setToAddress(e.target.value)}
                                    />
                                    <div>
                                        <button className='pulse-orange-button' onClick={() => sendEth(amount, toAddress)}>Send</button>
                                        <CloseIcon className='popup-close-icon' onClick={() => setShowPopup(false)} />
                                    </div>
                                </>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
