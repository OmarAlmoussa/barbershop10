const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'LOGIN',
            'LOGOUT',
            'CREATE_SERVICE',
            'UPDATE_SERVICE',
            'DELETE_SERVICE',
            'CREATE_TEAM_MEMBER',
            'UPDATE_TEAM_MEMBER',
            'DELETE_TEAM_MEMBER',
            'UPDATE_SETTINGS',
            'UPLOAD_PHOTOS',
            'DELETE_PHOTO',
            'UPDATE_REVIEW',
            'DELETE_REVIEW'
        ]
    },
    details: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Activity', activitySchema);
