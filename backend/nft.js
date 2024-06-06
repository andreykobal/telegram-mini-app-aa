// nft.js

const {createPublicClient, createWalletClient, http } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { sepolia } = require("viem/chains");
const { createSmartAccountClient, PaymasterMode } = require("@biconomy/account");
const { parseAbi, encodeFunctionData } = require("viem");


const config = {
    biconomyPaymasterApiKey: "s2GjnlFeb.de9978aa-3c41-4912-a3cd-accd4c02a767",
    bundlerUrl: "https://bundler.biconomy.io/api/v2/11155111/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
    nftAddress: "0x5dA076A7a10560E0d597E131489fDd0Dc28c7951",
    tokenURI: "https://gateway.pinata.cloud/ipfs/QmRDS7eWPQv27RrCh5fKrjModK6GYTDCyL6qVf6615V7Hs" // Replace with actual token URI
};

const customRpcUrl = "https://eth-sepolia.g.alchemy.com/v2/3L47M5JRG9bMrBq90jM7LroN_m_99Dnw"; // Replace with your actual RPC URL


async function mint(privateKey) {
    const account = privateKeyToAccount(privateKey);
    const client = createWalletClient({
        account,
        chain: sepolia,
        transport: http(customRpcUrl),
    });

    const smartWallet = await createSmartAccountClient({
        signer: client,
        biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
        bundlerUrl: config.bundlerUrl,
    });

    const saAddress = await smartWallet.getAccountAddress();
    console.log("Smart Account Address:", saAddress);

    const encodedCall = encodeFunctionData({
        abi: parseAbi(["function createToken(string memory tokenURI) public returns (uint)"]),
        functionName: "createToken",
        args: [config.tokenURI],
    });

    const transaction = {
        to: config.nftAddress,
        data: encodedCall,
    };

    const userOpResponse = await smartWallet.sendTransaction(transaction, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });

    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log("Transaction Hash:", transactionHash);

    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success == 'true') {
        console.log("UserOp receipt", userOpReceipt);
        console.log("Transaction receipt", userOpReceipt.receipt);
    }

    return transactionHash;  // Return the transaction hash
}

async function transferNFT(privateKey, tokenId, toAddress) {
    const account = privateKeyToAccount(privateKey);
    const client = createWalletClient({
        account,
        chain: sepolia,
        transport: http(customRpcUrl),
    });

    const smartWallet = await createSmartAccountClient({
        signer: client,
        biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
        bundlerUrl: config.bundlerUrl,
    });

    const saAddress = await smartWallet.getAccountAddress();
    console.log("Smart Account Address:", saAddress);

    const encodedCall = encodeFunctionData({
        abi: parseAbi(["function transferNFT(uint256 tokenId, address to) public"]),
        functionName: "transferNFT",
        args: [tokenId, toAddress],
    });

    const transaction = {
        to: config.nftAddress,
        data: encodedCall,
    };

    const userOpResponse = await smartWallet.sendTransaction(transaction, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });

    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log("Transaction Hash:", transactionHash);

    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success == 'true') {
        console.log("UserOp receipt", userOpReceipt);
        console.log("Transaction receipt", userOpReceipt.receipt);
    }
}

async function getNFTs(privateKey) {
    const account = privateKeyToAccount(privateKey);
    const client = createWalletClient({
        account,
        chain: sepolia,
        transport: http(customRpcUrl),
    });

    const smartWallet = await createSmartAccountClient({
        signer: client,
        biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
        bundlerUrl: config.bundlerUrl,
    });

    const saAddress = await smartWallet.getAccountAddress();
    console.log("Smart Account Address:", saAddress);

    const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(customRpcUrl)
    });

    const data = await publicClient.readContract({
        address: config.nftAddress,
        abi: parseAbi([
            "function getOwnedNFTsByWallet(address wallet) public view returns (uint256[] memory, string[] memory)"
        ]),
        functionName: 'getOwnedNFTsByWallet',
        args: [saAddress],
    });

    return data;
}


module.exports = { mint, transferNFT, getNFTs};

