import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [initData, setInitData] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [nfts, setNfts] = useState([]);

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
    const pinataGatewayToken = "YOUR_PINATA_GATEWAY_TOKEN";
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
        const response = await axios.post('https://f1a07255bfc6.ngrok.app/authenticate', { initData });
        console.log(response.data);
        getNFTs(); // Call getNFTs after successful authentication
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
      const nftPromises = response.data.nfts[0].map(async (tokenId, index) => {
        const tokenUri = response.data.nfts[1][index];
        const metadata = await fetchMetadata(updatePinataUrl(tokenUri));
        return { tokenId, metadata };
      });
      const nftData = await Promise.all(nftPromises);
      setNfts(nftData);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
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

  return (
    <div className="App">
      <div className="nft-page">
        <p className='glow-text'>Account Abstraction Magic</p>
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
                      <p>{name}</p>
                    </div>
                    <div className='nft-card-body'>
                      <div className="nft-info">
                        <p>❤️+{multiplier}</p>
                        <p>{color}{label}</p>
                        <p>🪙{bonus.toLocaleString()}</p>
                      </div>
                      <div className="nft-button-use">Transfer</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
