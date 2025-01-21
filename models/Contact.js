const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    sandnes: {
        address: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        }
    },
    klepp: {
        address: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        }
    },
    social: {
        instagram: String,
        facebook: String
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Contact', contactSchema);
