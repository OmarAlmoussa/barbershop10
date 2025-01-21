const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
    staff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TeamMember',
        required: true
    },
    type: {
        type: String,
        enum: ['regular', 'overtime', 'holiday'],
        default: 'regular'
    },
    start: {
        type: Date,
        required: true
    },
    end: {
        type: Date,
        required: true
    },
    notes: {
        type: String
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Validate that end time is after start time
shiftSchema.pre('save', function(next) {
    if (this.end <= this.start) {
        next(new Error('End time must be after start time'));
    }
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Shift', shiftSchema);
