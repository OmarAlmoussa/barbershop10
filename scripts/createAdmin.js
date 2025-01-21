const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
require('dotenv').config();

async function createAdminUser() {
    try {
        console.log('MongoDB URI:', process.env.MONGODB_URI);
        console.log('Attempting to connect to MongoDB...');
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin user exists
        const adminExists = await User.findOne({ username: 'admin' });
        
        if (adminExists) {
            console.log('Admin user exists, updating password');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.findOneAndUpdate(
                { username: 'admin' },
                { password: hashedPassword }
            );
            console.log('Admin password updated successfully');
        } else {
            console.log('Creating admin user: admin');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const adminUser = new User({
                username: 'admin',
                password: hashedPassword
            });
            await adminUser.save();
            console.log('Admin user created successfully');
        }

        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    } catch (error) {
        console.error('Error:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
}

createAdminUser();
