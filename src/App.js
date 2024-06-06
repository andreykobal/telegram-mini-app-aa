import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import { ReactComponent as CloseIcon } from './icons/circle-xmark-regular.svg';
import { ReactComponent as LogoMark } from './icons/Logomark-Blue.svg';



function App() {
  const [initData, setInitData] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false); // Add loading state
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState({ message: '', showLoader: false });



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
        const response = await axios.post('https://telegram-mini-app-aa-backend.azurewebsites.net/authenticate', { initData });
        console.log(response.data);
        getNFTs(); // Call getNFTs after successful authentication
      } catch (error) {
        console.error('Error validating data:', error);
      }
    };

    authenticateData();
  }, [initData]);

  const getNFTs = async () => {
    try {
      setLoading(true); // Set loading to true before starting the fetch
      const response = await axios.post('https://telegram-mini-app-aa-backend.azurewebsites.net/getNFTs', { initData });
      console.log(response.data);
      const nftPromises = response.data.nfts[0].map(async (tokenId, index) => {
        const tokenUri = response.data.nfts[1][index];
        const metadata = await fetchMetadata(updatePinataUrl(tokenUri));
        return { tokenId, metadata };
      });
      let nftData = await Promise.all(nftPromises);
      nftData = nftData.sort((a, b) => b.tokenId - a.tokenId); // Sort NFTs in descending order by tokenId
      setNfts(nftData);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    } finally {
      setLoading(false); // Set loading to false after fetch is complete
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
      const response = await axios.post('https://telegram-mini-app-aa-backend.azurewebsites.net/mint', { initData });
      console.log(response.data);
      const { transactionHash } = response.data;
      const txLink = `https://sepolia.basescan.org/tx/${transactionHash}`;
      setPopupContent({
        message: `Minting success - transaction hash: <a href="${txLink}" class="orange" target="_blank" rel="noopener noreferrer">${transactionHash}</a>`,
        showLoader: false
      });
      getNFTs();
    } catch (error) {
      setPopupContent({ message: 'Error minting NFT. Please try again.', showLoader: false }); // Display error message
      console.error('Error minting data:', error);
    }
  };

  const transfer = async () => {
    try {
      setPopupContent({ message: 'Transferring NFT...', showLoader: true }); // Show transferring message with loader
      const response = await axios.post('https://telegram-mini-app-aa-backend.azurewebsites.net/transfer', { initData, tokenId, toAddress });
      console.log(response.data);
      const { transactionHash } = response.data;
      const txLink = `https://sepolia.basescan.org/tx/${transactionHash}`;
      setPopupContent({
        message: `Transfer success - transaction hash: <a href="${txLink}" class="orange" target="_blank" rel="noopener noreferrer">${transactionHash}</a>`,
        showLoader: false
      });
      getNFTs();
    } catch (error) {
      setPopupContent({ message: 'Error transferring NFT. Please try again.', showLoader: false }); // Display error message
      console.error('Error transferring NFT:', error);
    }
  };


  const openTransferPopup = (tokenId) => {
    setTokenId(tokenId);
    setPopupContent({ message: '', showLoader: false });
    setShowPopup(true);
  };

  useEffect(() => {
    if (showPopup) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [showPopup]);

  return (
    <div className="App">
      <div className="nft-page">
        <div className="mint-header">
          <p className='glow-text'>✨ Account Abstraction Magic ✨</p>
          <button className='pulse-orange-button' onClick={mint}>Mint</button>
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
                      <div className="sell-opensea" onClick={() => window.open(`https://testnets.opensea.io/assets/base-sepolia/YOUR_CONTRACT_ADDRESS/${nft.tokenId}/`, '_blank')}>
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
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
