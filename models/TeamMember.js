const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        required: true 
    },
    bio: { 
        type: String 
    },
    imageUrl: {
        type: String
    },
    specialties: [{
        type: String
    }],
    available: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('TeamMember', TeamMemberSchema);
