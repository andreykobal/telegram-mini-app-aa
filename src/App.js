import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [initData, setInitData] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [toAddress, setToAddress] = useState('');


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
    </div>
  );
}

export default App;
