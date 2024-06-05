import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [initData, setInitData] = useState('');

  useEffect(() => {
    if (window.Telegram.WebApp.initData) {
      setInitData(window.Telegram.WebApp.initData);
    }
  }, []);

  const validateData = async () => {
    try {
      const response = await axios.post('https://f1a07255bfc6.ngrok.app/validate', { initData });
      console.log(response.data);
    } catch (error) {
      console.error('Error validating data:', error);
    }
  };

  return (
    <div className="App">
      <h1>Telegram Init Data Validator</h1>
      <button onClick={validateData}>Validate Init Data</button>
    </div>
  );
}

export default App;
