const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
    try {
        console.log('Environment variables:', process.env);
        console.log('\nTrying to connect with URI:', process.env.MONGODB_URI);
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully to MongoDB');
        
        await mongoose.connection.close();
        console.log('Connection closed');
    } catch (error) {
        console.error('Connection error:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
    }
}

testConnection();
