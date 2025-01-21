const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    duration: {
        type: Number,
        required: true,
        default: 30,
        min: 15
    },
    category: {
        type: String,
        required: true,
        enum: ['Haircut', 'Beard', 'Hair Color', 'Special'],
        default: 'Haircut'
    },
    image: {
        type: String,
        default: '/images/default-service.jpg'
    },
    active: {
        type: Boolean,
        default: true
    },
    featured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Add index for better search performance
serviceSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Service', serviceSchema);
