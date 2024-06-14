const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    transactionHash: { type: String, required: true }
});

const Session = mongoose.model('Session', SessionSchema);

module.exports = Session;
