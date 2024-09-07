const mongoose = require('mongoose');
const User = require('../models/User'); // Ensure this path is correct

require('dotenv').config({ path: '../.env' });


const uri = 'mongodb+srv://aa-db-user:1wYUIF2UOdAOfhBd@aa-testnet.gxqrawz.mongodb.net/?retryWrites=true&w=majority&appName=aa-testnet';

// Connect to MongoDB
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error('MongoDB connection error:', err));

// Function to delete a user by Telegram ID
async function deleteUserByTelegramId(telegramId) {
    try {
        const result = await User.findOneAndDelete({ telegramId });
        if (result) {
            console.log(`User with Telegram ID ${telegramId} deleted successfully.`);
        } else {
            console.log(`No user found with Telegram ID ${telegramId}.`);
        }
    } catch (error) {
        console.error('Error deleting user:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Replace 'YOUR_TELEGRAM_ID' with the actual Telegram ID
const telegramId = '879289341';

// Call the function to delete the user
deleteUserByTelegramId(telegramId);
