const { createPublicClient, createWalletClient, http } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { baseSepolia } = require("viem/chains");
const { createSmartAccountClient, PaymasterMode } = require("@biconomy/account");
const { parseAbi, encodeFunctionData } = require("viem");

require('dotenv').config();

const config = {
    biconomyPaymasterApiKey: process.env.BICONOMY_PAYMASTER_API_KEY,
    bundlerUrl: process.env.BUNDLER_URL,
    nftAddress: "0x5592FDe6113a554E56cBA18766c9d9549A3870A0"
};

const customRpcUrl = process.env.CUSTOM_RPC_URL;
const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;

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

async function mintOnlyOwner(callerPrivateKey, tokenURI) {
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

module.exports = { mintOnlyOwner };

// async function testMint(callerPrivateKey, tokenURI) {
//     try {
//         const transactionHash = await mintOnlyOwner(callerPrivateKey, tokenURI);
//         console.log(`Mint successful, transaction hash: ${transactionHash}`);
//     } catch (error) {
//         console.error("Mint failed:", error);
//     }
// }

// testMint("0x2cae22cabf1d13aaf1629f385357d63d2050a29a9b7c3ccbb7a30a7105d33ea9", "https://gateway.pinata.cloud/ipfs/QmdCqyMLHYpPJopQDzN2twi7gSVXaAXLpobG6ZVbMCiXVc");
