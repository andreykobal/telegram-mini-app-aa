//models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    telegramId: {
        type: String,
        unique: true,
        required: true,
    },
    walletAddress: {
        type: String,
        default: null,
    }
});

module.exports = mongoose.model('User', userSchema);
