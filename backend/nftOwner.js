//nftOwner.js

const { createPublicClient, createWalletClient, http } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { baseSepolia } = require("viem/chains");
const { createSmartAccountClient, PaymasterMode } = require("@biconomy/account");
const { parseAbi, encodeFunctionData } = require("viem");
const MetadataIndex = require('./models/MetadataIndex');
const mongoose = require('mongoose');
const fs = require('fs');
const crypto = require('crypto');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error('MongoDB connection error:', err));

const config = {
    biconomyPaymasterApiKey: process.env.BICONOMY_PAYMASTER_API_KEY,
    bundlerUrl: process.env.BUNDLER_URL,
    nftAddress: "0x5592FDe6113a554E56cBA18766c9d9549A3870A0"
};

const customRpcUrl = process.env.CUSTOM_RPC_URL;
const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_KEY = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();

const keyVaultName = "aa-testnet";
const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;
const credential = new DefaultAzureCredential();
const secretClient = new SecretClient(keyVaultUrl, credential);

const abiItem = {
    inputs: [
        {
            internalType: 'string',
            name: 'tokenURI',
            type: 'string'
        },
        {
            internalType: 'address',
            name: 'to',
            type: 'address'
        }
    ],
    name: 'createToken',
    outputs: [
        {
            internalType: 'uint256',
            name: '',
            type: 'uint256'
        }
    ],
    stateMutability: 'nonpayable',
    type: 'function',
}

async function getSmartWalletAddress(privateKey) {
    const account = privateKeyToAccount(privateKey);
    const client = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http(customRpcUrl),
    });

    const smartWallet = await createSmartAccountClient({
        signer: client,
        biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
        bundlerUrl: config.bundlerUrl,
    });

    const saAddress = await smartWallet.getAccountAddress();
    return saAddress;
}

async function getTokenURI() {
    const metadata = JSON.parse(fs.readFileSync('metadata.json', 'utf8'));
    const indexDoc = await MetadataIndex.findOneAndUpdate(
        {},
        { $inc: { currentIndex: 1 } },
        { new: true, upsert: true }
    );

    if (indexDoc.currentIndex >= metadata.urls.length) {
        indexDoc.currentIndex = 0;
        await indexDoc.save();
    }

    return metadata.urls[indexDoc.currentIndex];
}

async function getPrivateKeyFromKeyVault(secretName) {
    try {
        const retrievedSecret = await secretClient.getSecret(secretName);
        console.log('Retrieved private key from Azure Key Vault:', retrievedSecret.value);
        return retrievedSecret.value;
    } catch (err) {
        console.error('Error retrieving private key from Azure Key Vault:', err);
        throw err;
    }
}

function validateTelegramData(initData) {
    console.log('Validating Telegram Data:', initData);
    const urlParams = new URLSearchParams(initData);

    const dataCheckString = Array.from(urlParams.entries())
        .filter(([key]) => key !== 'hash')
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    console.log('Data Check String:', dataCheckString);

    const receivedHash = urlParams.get('hash');
    console.log('Received Hash:', receivedHash);

    const computedHash = crypto.createHmac('sha256', SECRET_KEY).update(dataCheckString).digest('hex');
    console.log('Computed HMAC:', computedHash);

    return computedHash === receivedHash;
}

async function mintWithInitData(initData) {
    if (!validateTelegramData(initData)) {
        throw new Error('Invalid init data');
    }

    const urlParams = new URLSearchParams(initData);
    const userObj = urlParams.get('user') ? JSON.parse(urlParams.get('user')) : null;
    const telegramId = userObj ? userObj.id : null;

    if (!telegramId) {
        throw new Error('Telegram ID is required');
    }

    const callerPrivateKey = await getPrivateKeyFromKeyVault(String(telegramId));
    const ownerAccount = privateKeyToAccount(ownerPrivateKey);
    const ownerClient = createWalletClient({
        account: ownerAccount,
        chain: baseSepolia,
        transport: http(customRpcUrl),
    });

    const ownerSmartWallet = await createSmartAccountClient({
        signer: ownerClient,
        biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
        bundlerUrl: config.bundlerUrl,
    });

    const callerSmartWalletAddress = await getSmartWalletAddress(callerPrivateKey);
    const tokenURI = await getTokenURI();

    const encodedCall = encodeFunctionData({
        abi: [abiItem],
        functionName: 'createToken',
        args: [tokenURI, callerSmartWalletAddress],
    });

    const transaction = {
        to: config.nftAddress,
        data: encodedCall,
    };

    const userOpResponse = await ownerSmartWallet.sendTransaction(transaction, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });

    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log("Transaction Hash:", transactionHash);

    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success === 'true') {
        console.log("UserOp receipt", userOpReceipt);
        console.log("Transaction receipt", userOpReceipt.receipt);
    }

    return transactionHash;
}

module.exports = { mintWithInitData };

