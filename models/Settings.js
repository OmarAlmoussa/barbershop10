const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    language: {
        type: String,
        enum: ['en', 'no'],
        default: 'en'
    },
    emailNotifications: {
        type: Boolean,
        default: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Settings', settingsSchema);
