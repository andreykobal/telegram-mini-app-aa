const { createWalletClient, http } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { sepolia } = require("viem/chains");
const { createSmartAccountClient, PaymasterMode } = require("@biconomy/account");
const { parseAbi, encodeFunctionData } = require("viem");


// Configuration with private key and Biconomy API key
const config = {
    privateKey: "38bd0f4c37fdc15fb4de2edecce6900bdd429c316a3034edb71db95580277e86",
    biconomyPaymasterApiKey: "s2GjnlFeb.de9978aa-3c41-4912-a3cd-accd4c02a767",
    bundlerUrl: "https://bundler.biconomy.io/api/v2/11155111/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
};

// Main function to perform the minting
async function main() {
    // Generate EOA from private key
    const account = privateKeyToAccount("0x" + config.privateKey);
    const client = createWalletClient({
        account,
        chain: sepolia,
        transport: http(),
    });

    // Create Biconomy Smart Account instance
    const smartWallet = await createSmartAccountClient({
        signer: client,
        biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
        bundlerUrl: config.bundlerUrl,
    });

    // Get the smart account address
    const saAddress = await smartWallet.getAccountAddress();
    console.log("Smart Account Address:", saAddress);

    // Encode the function call to create a token
    const nftAddress = "0xd68B7C666b269B3FC9daAc7a3a446bE32999920E";
    const tokenURI = "https://gateway.pinata.cloud/ipfs/QmdCqyMLHYpPJopQDzN2twi7gSVXaAXLpobG6ZVbMCiXVc"; // Replace with actual token URI

    const encodedCall = encodeFunctionData({
        abi: parseAbi(["function createToken(string memory tokenURI) public returns (uint)"]),
        functionName: "createToken",
        args: [tokenURI],
    });

    // Build the transaction
    const transaction = {
        to: nftAddress,
        data: encodedCall,
    };

    // Send the transaction using Biconomy Smart Account
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

// Run the main function
main().catch(console.error);