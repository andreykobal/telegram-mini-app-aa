// Import necessary functions from the viem library
const { privateKeyToAccount, generatePrivateKey } = require('viem/accounts')

// Generate a random private key
const privateKey = generatePrivateKey()

// Create an account using the generated private key
const account = privateKeyToAccount(privateKey)

// Console log the private key and the account address
console.log('Private Key:', privateKey)
console.log('Account Address:', account.address)
