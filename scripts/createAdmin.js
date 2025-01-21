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
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        if (adminExists) {
            console.log('Admin user exists, updating credentials');
            await User.findOneAndUpdate(
                { username: 'admin' },
                { 
                    password: hashedPassword,
                    role: 'admin',
                    email: 'admin@moonbarbershop.com',
                    firstName: 'Admin',
                    lastName: 'User'
                },
                { new: true }
            );
            console.log('Admin user updated successfully');
        } else {
            console.log('Creating admin user');
            const adminUser = new User({
                username: 'admin',
                password: hashedPassword,
                role: 'admin',
                email: 'admin@moonbarbershop.com',
                firstName: 'Admin',
                lastName: 'User'
            });
            await adminUser.save();
            console.log('Admin user created successfully');
        }

        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error creating/updating admin user:', error.message);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('MongoDB connection closed');
        }
        // Don't exit with error code as this might be a duplicate key error
        // which is actually handled above
        process.exit(0);
    }
}

createAdminUser();
