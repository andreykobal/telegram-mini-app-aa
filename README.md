# 🪄 Welcome to Telegram Super dApp Account Abstraction Magic! 🪄

Transforming Telegram into a seamless blockchain hub with our Account Abstraction Magic SDK — making crypto asset management effortless, secure, and gas-free for everyone

<img src="https://github.com/andreykobal/telegram-mini-app-aa/assets/19206978/53708f8e-4006-44e0-8f80-025cfecb9c67" width="512">

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Folder Structure](#folder-structure)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features

- **💼 Custodial Wallet**: Created and securely stored in Azure Key Vault.
- **🔑 Smart Accounts**: Auto-creation using ERC-4337 account abstraction.
- **⚡️ Mint NFTs**: Easily mint NFTs with a single tap.
- **💸 No Gas Fees**: Gasless transactions facilitated by advanced transaction management.
- **🏦 Token and NFT Management**: Simple and secure transfers and swaps of tokens and NFTs.
- **🌐 View NFTs**: NFTs displayed directly in the app wallet.
- **🔄 Built-in Token Swap**: Powered by Uniswap for seamless token exchanges.
- **📲 Developer Friendly SDK**: Facilitates further integration and development.

## Screenshots

![photo_2024-06-10 21 11 07-imageonline co-merged](https://github.com/andreykobal/telegram-mini-app-aa/assets/19206978/1801653a-32a6-46f8-9548-220fa4b6eb6e)
![photo_2024-06-10 21 11 16-imageonline co-merged](https://github.com/andreykobal/telegram-mini-app-aa/assets/19206978/3ee6e48a-f02b-4f03-975a-e374340ea45a)



## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/andreykobal/telegram-mini-app-aa.git
   ```

2. Navigate to the project directory:
   ```sh
   cd telegram-mini-app-aa
   ```

3. Install dependencies for the frontend:
   ```sh
   npm install
   ```

4. Install dependencies for the backend:
   ```sh
   cd ../backend
   npm install
   ```

## Usage

1. Start the backend server:
   ```sh
   cd backend
   npm start
   ```

2. Start the frontend application:
   ```sh
   cd ..
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`


## API Endpoints

### POST /authenticate
- **Description**: Authenticate a user using Telegram init data.
- **Request Body**:
  ```json
  {
    "initData": "string"
  }
  ```

### POST /mint
- **Description**: Mint a new NFT.
- **Request Body**:
  ```json
  {
    "initData": "string"
  }
  ```

### POST /transfer
- **Description**: Transfer an NFT to another address.
- **Request Body**:
  ```json
  {
    "initData": "string",
    "tokenId": "string",
    "toAddress": "string"
  }
  ```

### POST /getNFTs
- **Description**: Retrieve NFTs owned by the authenticated user.
- **Request Body**:
  ```json
  {
    "initData": "string"
  }
  ```

### POST /sendETH
- **Description**: Send ETH to another address.
- **Request Body**:
  ```json
  {
    "initData": "string",
    "toAddress": "string",
    "amount": "string"
  }
  ```

### POST /getBalances
- **Description**: Retrieve balances of the authenticated user's wallet.
- **Request Body**:
  ```json
  {
    "initData": "string"
  }
  ```

### POST /getUsdtToUsdcRate
- **Description**: Fetch the swap rate from USDT to USDC.
- **Request Body**:
  ```json
  {
    "amount": "string"
  }
  ```

### POST /getUsdcToUsdtRate
- **Description**: Fetch the swap rate from USDC to USDT.
- **Request Body**:
  ```json
  {
    "amount": "string"
  }
  ```

### POST /getUsdtToWethRate
- **Description**: Fetch the swap rate from USDT to WETH.
- **Request Body**:
  ```json
  {
    "amount": "string"
  }
  ```

### POST /getWethToUsdtRate
- **Description**: Fetch the swap rate from WETH to USDT.
- **Request Body**:
  ```json
  {
    "amount": "string"
  }
  ```

### POST /getUsdcToWethRate
- **Description**: Fetch the swap rate from USDC to WETH.
- **Request Body**:
  ```json
  {
    "amount": "string"
  }
  ```

### POST /getWethToUsdcRate
- **Description**: Fetch the swap rate from WETH to USDC.
- **Request Body**:
  ```json
  {
    "amount": "string"
  }
  ```

### POST /swapUsdtToUsdc
- **Description**: Swap USDT to USDC.
- **Request Body**:
  ```json
  {
    "initData": "string",
    "amount": "string"
  }
  ```

### POST /swapUsdcToUsdt
- **Description**: Swap USDC to USDT.
- **Request Body**:
  ```json
  {
    "initData": "string",
    "amount": "string"
  }
  ```

### POST /swapUsdtToWeth
- **Description**: Swap USDT to WETH.
- **Request Body**:
  ```json
  {
    "initData": "string",
    "amount": "string"
  }
  ```

### POST /swapWethToUsdt
- **Description**: Swap WETH to USDT.
- **Request Body**:
  ```json
  {
    "initData": "string",
    "amount": "string"
  }
  ```

### POST /swapUsdcToWeth
- **Description**: Swap USDC to WETH.
- **Request Body**:
  ```json
  {
    "initData": "string",
    "amount": "string"
  }
  ```

### POST /swapWethToUsdc
- **Description**: Swap WETH to USDC.
- **Request Body**:
  ```json
  {
    "initData": "string",
    "amount": "string"
  }
  ```

### POST /webhook
- **Description**: Handle webhook events.
- **Request Body**:
  ```json
  {
    // Depends on the specific webhook implementation
  }
  ```

## Folder Structure

```plaintext
.
├── .gitignore
├── backend
│   ├── .gitignore
│   ├── index.js
│   ├── metadata.json
│   ├── models
│   │   ├── MetadataIndex.js
│   │   └── User.js
│   ├── nft.js
│   ├── package-lock.json
│   ├── package.json
│   ├── swap.js
│   ├── test-swap-copy.js
│   ├── test-swap.js
│   ├── utils
│   │   ├── delete-all-users.js
│   │   ├── delete-user.js
│   │   └── get-all-users.js
│   ├── webhook.js
│   └── WETH9.json
├── package-lock.json
├── package.json
├── public
│   ├── favicon.ico
│   ├── index.html
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   └── robots.txt
├── README.md
└── src
    ├── App.css
    ├── App.js
    ├── App.test.js
    ├── balance.js
    ├── Buy.js
    ├── client.js
    ├── CustomSelect.css
    ├── CustomSelect.js
    ├── EthToUsdConverter.js
    ├── Home.js
    ├── icons
    ├── index.css
    ├── index.js
    ├── logo.svg
    ├── reportWebVitals.js
    ├── setupTests.js
    └── Swap.js
```

## Technologies Used

- **Frontend**: React
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Blockchain**: Hardhat, Viem, Biconomy, Base
- **Hosting**: Azure, Vercel

## Contributing

Contributions are welcome! Please read the [contributing guidelines](CONTRIBUTING.md) first.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
