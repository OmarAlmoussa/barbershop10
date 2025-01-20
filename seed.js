require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./models/Service');
const TeamMember = require('./models/TeamMember');

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const seedData = async () => {
    try {
        await Service.deleteMany();
        await Service.insertMany([
            { name: 'Haircut', description: 'A professional haircut.', price: 150 },
            { name: 'Beard Trim', description: 'A clean beard trim.', price: 100 }
        ]);

        await TeamMember.deleteMany();
        await TeamMember.insertMany([
            { name: 'John Doe', role: 'Barber', bio: 'Expert in classic cuts.', photo: '' },
            { name: 'Jane Smith', role: 'Stylist', bio: 'Specialist in modern styles.', photo: '' }
        ]);

        console.log('Seed data added');
        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding data:', error);
        mongoose.connection.close();
    }
};

seedData();
