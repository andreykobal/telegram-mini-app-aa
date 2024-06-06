//frontend

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [initData, setInitData] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [nfts, setNfts] = useState([]);

  useEffect(() => {
    if (window.Telegram.WebApp.initData) {
      setInitData(window.Telegram.WebApp.initData);
    }

    const authenticateData = async () => {
      try {
        const response = await axios.post('https://f1a07255bfc6.ngrok.app/authenticate', { initData });
        console.log(response.data);
      } catch (error) {
        console.error('Error validating data:', error);
      }
    };

    authenticateData();
  }, [initData]);

  const mint = async () => {
    try {
      const response = await axios.post('https://f1a07255bfc6.ngrok.app/mint', { initData });
      console.log(response.data);
    } catch (error) {
      console.error('Error minting data:', error);
    }
  };

  const transfer = async () => {
    try {
      const response = await axios.post('https://f1a07255bfc6.ngrok.app/transfer', { initData, tokenId, toAddress });
      console.log(response.data);
    } catch (error) {
      console.error('Error transferring NFT:', error);
    }
  };

  const getNFTs = async () => {
    try {
      const response = await axios.post('https://f1a07255bfc6.ngrok.app/getNFTs', { initData });
      console.log(response.data);
      setNfts(response.data.nfts);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    }
  };
  

  return (
    <div className="App">
      <h1>Telegram Init Data Validator</h1>
      <button onClick={mint}>Mint</button>
      <div>
        <input
          type="text"
          placeholder="Token ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
        />
        <input
          type="text"
          placeholder="Address"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
        />
        <button onClick={transfer}>Transfer</button>
      </div>
      <button onClick={getNFTs}>Get NFTs</button>
      <div>
        {nfts[0]?.map((tokenId, index) => (
          <div key={index}>
            <p>Token ID: {tokenId.toString()}</p>
            <p>Token URI: {nfts[1][index]}</p>
          </div>
        ))}
      </div>

      <div className="nft-page">
        <div className="nft-container">
          <div className="nft-card flip-card mythical no-overflow">
            <div className="flip-card-inner mythical">
              <div className="flip-card-front" style={{ backgroundImage: 'url("https://bot.ethernity.game/nft-demo-new.jpg")' }}>
                <div className='nft-card-header'>
                  <p>AVA #4</p>
                </div>
                <div className='nft-card-body'>
                  <div className="nft-info">
                    <p>❤️+5</p>
                    <p>🔴Mythical</p>
                    <p>🪙500,000</p>
                  </div>
                  <div className="nft-button-use">Transfer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
