# 🪄 Welcome to Account Abstraction Magic! 🪄

A seamless experience for Telegram users!

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



## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/yourrepository.git
   ```

2. Navigate to the project directory:
   ```sh
   cd yourrepository
   ```

3. Install dependencies for the frontend:
   ```sh
   cd frontend
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
   cd ../frontend
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
