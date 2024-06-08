// scripts/getAllUsers.js

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

const getAllUsers = async () => {
    try {
        const users = await User.find({});
        console.log('All Users:', users);
    } catch (err) {
        console.error('Error fetching users:', err);
    } finally {
        mongoose.connection.close();
    }
};

getAllUsers();
