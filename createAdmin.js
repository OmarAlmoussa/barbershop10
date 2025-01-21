const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        console.log('MongoDB URI:', process.env.MONGODB_URI);
        console.log('Attempting to connect to MongoDB...');
        
        mongoose.connection.on('error', (err) => {
            console.log('Mongoose connection error:', err);
        });

        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected successfully');
        });

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const password = process.argv[3] || 'admin123';
        const username = process.argv[2] || 'admin';
        
        console.log('Creating admin user:', username);
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // First try to find if admin exists
        let admin = await User.findOne({ username: username });
        
        if (admin) {
            console.log('Admin user exists, updating password');
            admin.password = hashedPassword;
            await admin.save();
            console.log('Admin password updated successfully');
        } else {
            console.log('Admin user does not exist, creating new admin');
            admin = new User({
                username: username,
                password: hashedPassword
            });
            await admin.save();
            console.log('Admin user created successfully');
        }
        
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    } catch (error) {
        console.error('Error creating admin:', error);
        if (error.name === 'MongoServerError') {
            console.log('MongoDB Server Error Details:');
            console.log('Code:', error.code);
            console.log('CodeName:', error.codeName);
            console.log('Error Message:', error.errmsg);
        }
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('MongoDB connection closed after error');
        }
    }
};

createAdmin();
