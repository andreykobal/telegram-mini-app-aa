// scripts/deleteAllUsers.js

const mongoose = require('mongoose');
const User = require('../models/User'); // Ensure this path is correct

require('dotenv').config({ path: '../.env' });

const uri = process.env.MONGODB_URI;

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});

const deleteAllUsers = async () => {
    try {
        const result = await User.deleteMany({});
        console.log('All users deleted:', result);
    } catch (err) {
        console.error('Error deleting users:', err);
    } finally {
        mongoose.connection.close();
    }
};

deleteAllUsers();
