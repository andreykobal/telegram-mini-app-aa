# Account Abstraction Magic

🪄 Welcome to Account Abstraction Magic! 🪄

A seamless experience for Telegram users to interact with NFTs.

## Table of Contents

- [Account Abstraction Magic](#account-abstraction-magic)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Screenshots](#screenshots)
  - [Installation](#installation)
    - [Prerequisites](#prerequisites)
    - [Backend (Express.js)](#backend-expressjs)
    - [Frontend (React)](#frontend-react)
  - [Usage](#usage)
  - [API Endpoints](#api-endpoints)
  - [Folder Structure](#folder-structure)
  - [Technologies Used](#technologies-used)
  - [Contributing](#contributing)
  - [License](#license)
  - [Contact](#contact)

## Features

- **Custodial Wallet**: Created at first use, securely stored in Azure Key Vault.
- **Smart Accounts**: Auto-creation using Biconomy's AA.
- **Mint NFTs**: Tap the mint button to use your smart account.
- **No Gas Fees**: Biconomy Paymaster covers them!
- **Transfer NFTs**: Withdraw and transfer your NFTs easily.
- **View on OpenSea**: Check out your NFTs on OpenSea.
- **Deployed on Base**: Fast, cheap transactions.
- **Your NFTs**: Displayed directly in the app.

## Screenshots

Include some screenshots or a gif of your app in action.

## Installation

### Prerequisites

- Node.js (version)
- npm or yarn (version)

### Backend (Express.js)

1. Clone the repo
   ```sh
   git clone https://github.com/your-username/your-repo.git
   ```
2. Navigate to the backend directory
   ```sh
   cd your-repo/backend
   ```
3. Install NPM packages
   ```sh
   npm install
   ```
4. Create a `.env` file and add the required environment variables
   ```plaintext
   PORT=5001
   DB_CONNECTION_STRING=your_db_connection_string
   BOT_TOKEN=your_telegram_bot_token
   ```
5. Start the server
   ```sh
   npm start
   ```

### Frontend (React)

1. Navigate to the frontend directory
   ```sh
   cd your-repo/frontend
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Create a `.env` file and add the required environment variables
   ```plaintext
   REACT_APP_API_URL=http://localhost:5001
   REACT_APP_PINATA_TOKEN=your_pinata_token
   ```
4. Start the React app
   ```sh
   npm start
   ```

## Usage

1. Open the Telegram app and navigate to the bot.
2. Click the button below to open the app.
3. Use the app to mint, view, and transfer your NFTs.

## API Endpoints

List of API endpoints and their descriptions.

### Auth

- `POST /api/authenticate` - Authenticate a user.

### NFTs

- `POST /api/mint` - Mint a new NFT.
- `POST /api/transfer` - Transfer an NFT.
- `POST /api/getNFTs` - Get user's NFTs.

## Folder Structure

```plaintext
your-repo/
│
├── backend/                # Express.js backend
│   ├── models/             # Database models
│   ├── nft.js              # NFT related functions
│   ├── create-wallet.js    # Create wallet utility
│   ├── index.js            # Server entry point
│   └── package.json        # NPM dependencies and scripts
│
├── frontend/               # React frontend
│   ├── public/             # Public assets
│   ├── src/                # Source files
│   │   ├── App.js          # Main App component
│   │   └── index.js        # Entry point
│   ├── .env                # Environment variables
│   └── package.json        # NPM dependencies and scripts
│
└── README.md               # Project documentation
```

## Technologies Used

- **Frontend**: React, Axios
- **Backend**: Express.js, MongoDB, Mongoose, Azure Key Vault
- **Blockchain**: Biconomy, Viem, Base Sepolia

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Your Name - [@your-twitter-handle](https://twitter.com/your-twitter-handle) - email@example.com

Project Link: [https://github.com/your-username/your-repo](https://github.com/your-username/your-repo)
