const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });

        const password = process.argv[3] || 'admin123'; // Default password if not provided
        const username = process.argv[2] || 'admin'; // Default username if not provided
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new User({
            username: username,
            password: hashedPassword
        });

        await admin.save();
        console.log('Admin user created successfully');
        mongoose.connection.close();
    } catch (error) {
        console.error('Error creating admin:', error);
        mongoose.connection.close();
    }
};

createAdmin();
