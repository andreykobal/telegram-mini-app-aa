// nft.js

const {createPublicClient, createWalletClient, http } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { baseSepolia } = require("viem/chains");
const { createSmartAccountClient, PaymasterMode } = require("@biconomy/account");
const { parseAbi, encodeFunctionData } = require("viem");


const config = {
    biconomyPaymasterApiKey: "YOUR_PAYMASTER_API_KEY",
    bundlerUrl: "YOUR_BUNDLER_URL",
    nftAddress: "YOUR_CONTRACT_ADDRESS",
    tokenURI: "https://gateway.pinata.cloud/ipfs/QmRDS7eWPQv27RrCh5fKrjModK6GYTDCyL6qVf6615V7Hs" // Replace with actual token URI
};

const customRpcUrl = "https://base-sepolia.g.alchemy.com/v2/KxQa-WOPTgk_XOZXstj9MaOVs1BxXQVh"; // Replace with your actual RPC URL


async function mint(privateKey) {
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
        chain: baseSepolia,
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
        chain: baseSepolia,
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
        chain: baseSepolia,
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

