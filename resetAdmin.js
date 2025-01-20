require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });

        // Delete existing admin
        await User.deleteOne({ username: 'admin' });

        // Create new admin with password: admin123
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = new User({
            username: 'admin',
            password: hashedPassword
        });

        await admin.save();
        console.log('Admin user reset successfully. Username: admin, Password: admin123');
        mongoose.connection.close();
    } catch (error) {
        console.error('Error resetting admin:', error);
        mongoose.connection.close();
    }
};

resetAdmin();
