# 🪄 Welcome to Telegram Mini App Account Abstraction Magic! 🪄

A seamless experience for Telegram users!

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

- **💼 Custodial Wallet**: Created at first use, securely stored in Azure Key Vault.
- **🔑 Smart Accounts**: Auto-creation using Biconomy's AA.
- **⚡️ Mint NFTs**: Tap the mint button to use your smart account.
- **💸 No Gas Fees**: Biconomy Paymaster covers them!
- **🔄 Transfer NFTs**: Withdraw and transfer your NFTs easily.
- **🌐 View on OpenSea**: Check out your NFTs on OpenSea.
- **⚡️ Deployed on Base**: Fast, cheap transactions.
- **📲 Your NFTs**: Displayed directly in the app.
- 👉 **Click the button below to open the app!**

## Screenshots

<img src="https://github.com/andreykobal/telegram-mini-app-aa/assets/19206978/011d5df4-f328-47b0-98aa-bd7b9fdd7d8a" width="256">
<img src="https://github.com/andreykobal/telegram-mini-app-aa/assets/19206978/733b1364-fd62-4089-b856-e28979dbbf9d" width="256">
<img src="https://github.com/andreykobal/telegram-mini-app-aa/assets/19206978/8c46c8fa-4311-4d90-8822-3f31ea52bdb5" width="256">
<img src="https://github.com/andreykobal/telegram-mini-app-aa/assets/19206978/71d2f2c2-dbdf-4516-a5de-d147f5131205" width="256">



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

## Folder Structure

```plaintext
.
├── .gitignore
├── backend
│   ├── .gitignore
│   ├── create-wallet.js
│   ├── index.js
│   ├── metadata.json
│   ├── models
│   │   ├── MetadataIndex.js
│   │   └── User.js
│   ├── nft.js
│   ├── package-lock.json
│   ├── package.json
│   ├── utils
│   │   └── delete-user.js
│   └── webhook.js
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
    ├── icons
    │   ├── circle-xmark-regular.svg
    │   └── Logomark-Blue.svg
    ├── index.css
    ├── index.js
    ├── logo.svg
    ├── reportWebVitals.js
    └── setupTests.js
```

## Technologies Used

- **Frontend**: React
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Blockchain**: Viem, Biconomy
- **Hosting**: Azure

## Contributing

Contributions are welcome! Please read the [contributing guidelines](CONTRIBUTING.md) first.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
