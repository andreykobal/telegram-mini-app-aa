const mongoose = require('mongoose');

const MetadataIndexSchema = new mongoose.Schema({
    currentIndex: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('MetadataIndex', MetadataIndexSchema);
