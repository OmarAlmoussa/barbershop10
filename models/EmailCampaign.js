const mongoose = require('mongoose');

const emailCampaignSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    targetAudience: {
        type: String,
        enum: ['all', 'new', 'regular', 'inactive'],
        required: true
    },
    template: {
        type: String,
        enum: ['promotion', 'newsletter', 'event'],
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'sent', 'cancelled'],
        default: 'draft'
    },
    scheduledFor: {
        type: Date
    },
    sentAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('EmailCampaign', emailCampaignSchema);
