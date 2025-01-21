const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Auth middleware
const auth = require('./middleware/auth');

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Models
const Service = require('./models/Service');
const TeamMember = require('./models/TeamMember');
const User = require('./models/User');
const Booking = require('./models/Booking');
const Activity = require('./models/Activity');
const Gallery = require('./models/Gallery');
const Contact = require('./models/Contact');
const Settings = require('./models/Settings');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// User Routes
app.get('/api/users', auth, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/users', auth, async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, role });
        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Service Routes
app.get('/api/services', async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/services', auth, async (req, res) => {
    try {
        const service = new Service(req.body);
        await service.save();
        
        // Log activity
        const activity = new Activity({
            description: `New service added: ${service.name}`,
            timestamp: new Date()
        });
        await activity.save();
        
        res.status(201).json(service);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/services/:id', auth, async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        
        // Log activity
        const activity = new Activity({
            description: `Service deleted: ${service.name}`,
            timestamp: new Date()
        });
        await activity.save();
        
        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Team Routes
app.get('/api/team', async (req, res) => {
    try {
        const team = await TeamMember.find();
        res.json(team);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/team', auth, async (req, res) => {
    try {
        const member = new TeamMember(req.body);
        await member.save();
        
        // Log activity
        const activity = new Activity({
            description: `New team member added: ${member.name}`,
            timestamp: new Date()
        });
        await activity.save();
        
        res.status(201).json(member);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/team/:id', auth, async (req, res) => {
    try {
        const member = await TeamMember.findByIdAndDelete(req.params.id);
        if (!member) {
            return res.status(404).json({ message: 'Team member not found' });
        }
        
        // Log activity
        const activity = new Activity({
            description: `Team member deleted: ${member.name}`,
            timestamp: new Date()
        });
        await activity.save();
        
        res.json({ message: 'Team member deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Booking Routes
app.get('/api/bookings', auth, async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('service')
            .populate('employee');
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const booking = new Booking(req.body);
        await booking.save();
        
        // Log activity
        const activity = new Activity({
            description: `New booking: ${booking.customerName} for ${booking.service}`,
            timestamp: new Date()
        });
        await activity.save();
        
        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Gallery Routes
app.get('/api/gallery', async (req, res) => {
    try {
        const images = await Gallery.find();
        res.json(images);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/gallery', auth, upload.single('image'), async (req, res) => {
    try {
        const { title } = req.body;
        const imageUrl = `/uploads/${req.file.filename}`;
        
        const image = new Gallery({
            title,
            url: imageUrl
        });
        await image.save();
        
        // Log activity
        const activity = new Activity({
            description: `New gallery image added: ${title}`,
            timestamp: new Date()
        });
        await activity.save();
        
        res.status(201).json(image);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Contact Info Routes
app.get('/api/contact', async (req, res) => {
    try {
        const contact = await Contact.findOne();
        res.json(contact || {});
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/contact', auth, async (req, res) => {
    try {
        const contact = await Contact.findOneAndUpdate({}, req.body, {
            new: true,
            upsert: true
        });
        
        // Log activity
        const activity = new Activity({
            description: 'Contact information updated',
            timestamp: new Date()
        });
        await activity.save();
        
        res.json(contact);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Settings Routes
app.get('/api/settings', auth, async (req, res) => {
    try {
        const settings = await Settings.findOne();
        res.json(settings || {});
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/settings', auth, async (req, res) => {
    try {
        const settings = await Settings.findOneAndUpdate({}, req.body, {
            new: true,
            upsert: true
        });
        
        // Log activity
        const activity = new Activity({
            description: 'Settings updated',
            timestamp: new Date()
        });
        await activity.save();
        
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Activity Routes
app.get('/api/activity', auth, async (req, res) => {
    try {
        const activities = await Activity.find()
            .sort({ timestamp: -1 })
            .limit(10);
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start Server
console.log('Starting server with configuration:', {
    port: PORT,
    env: process.env.NODE_ENV
});

const server = app.listen(PORT, () => {
    const address = server.address();
    console.log(`Server is running on port ${address.port}`);
    console.log('Server address:', address);
});
