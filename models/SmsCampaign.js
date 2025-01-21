const mongoose = require('mongoose');

const smsCampaignSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['promotion', 'reminder', 'followup'],
        required: true
    },
    message: {
        type: String,
        required: true,
        maxlength: 160
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
    },
    sentAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SmsCampaign', smsCampaignSchema);
