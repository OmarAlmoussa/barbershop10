const mongoose = require('mongoose');

const businessHourSchema = new mongoose.Schema({
    open: String,
    close: String,
    closed: Boolean
}, { _id: false });

const settingsSchema = new mongoose.Schema({
    businessHours: {
        monday: businessHourSchema,
        tuesday: businessHourSchema,
        wednesday: businessHourSchema,
        thursday: businessHourSchema,
        friday: businessHourSchema,
        saturday: businessHourSchema,
        sunday: businessHourSchema
    },
    notifications: {
        email: {
            type: Boolean,
            default: true
        },
        sms: {
            type: Boolean,
            default: false
        }
    },
    socialMedia: {
        facebook: String,
        instagram: String,
        twitter: String
    },
    contact: {
        phone: String,
        email: String,
        address: String
    },
    seo: {
        title: {
            type: String,
            default: 'Moon Barbershop - Professional Haircuts & Grooming'
        },
        description: {
            type: String,
            default: 'Premium barbershop services including haircuts, beard trimming, and styling.'
        },
        keywords: [String]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
