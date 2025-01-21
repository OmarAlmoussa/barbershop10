const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const json2csv = require('json2csv').Parser;
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
const Review = require('./models/Review');
const EmailCampaign = require('./models/EmailCampaign');
const SmsCampaign = require('./models/SmsCampaign');
const Product = require('./models/Product');
const Shift = require('./models/Shift');

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

// Public API Routes (Homepage)
app.get('/api/services', async (req, res) => {
    try {
        const services = await Service.find().sort('name');
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching services' });
    }
});

app.get('/api/team', async (req, res) => {
    try {
        const team = await TeamMember.find({ isAvailable: true }).sort('name');
        res.json(team);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching team members' });
    }
});

app.get('/api/gallery', async (req, res) => {
    try {
        const gallery = await Gallery.find().sort('-createdAt');
        res.json(gallery);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching gallery' });
    }
});

app.get('/api/contact', async (req, res) => {
    try {
        const contact = await Contact.findOne();
        res.json(contact);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching contact info' });
    }
});

app.get('/api/available-times', async (req, res) => {
    try {
        const { date, barber } = req.query;
        const existingBookings = await Booking.find({
            barber,
            date,
            status: { $ne: 'cancelled' }
        });
        
        // Generate available time slots (9:00 to 19:00)
        const timeSlots = [];
        for (let hour = 9; hour < 19; hour++) {
            const time = `${hour.toString().padStart(2, '0')}:00`;
            if (!existingBookings.some(booking => booking.time === time)) {
                timeSlots.push(time);
            }
        }
        
        res.json(timeSlots);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching available times' });
    }
});

// Protected Admin API Routes
app.post('/api/admin/services', auth, async (req, res) => {
    try {
        const service = new Service(req.body);
        await service.save();
        
        // Log activity
        const activity = new Activity({
            description: `Added new service: ${service.name}`,
            timestamp: new Date()
        });
        await activity.save();
        
        res.status(201).json(service);
    } catch (error) {
        res.status(500).json({ message: 'Error creating service' });
    }
});

app.post('/api/admin/team', auth, upload.single('image'), async (req, res) => {
    try {
        const teamMember = new TeamMember({
            ...req.body,
            image: req.file ? `/uploads/${req.file.filename}` : null
        });
        await teamMember.save();
        
        // Log activity
        const activity = new Activity({
            description: `Added new team member: ${teamMember.name}`,
            timestamp: new Date()
        });
        await activity.save();
        
        res.status(201).json(teamMember);
    } catch (error) {
        res.status(500).json({ message: 'Error creating team member' });
    }
});

app.post('/api/admin/gallery', auth, upload.single('image'), async (req, res) => {
    try {
        const gallery = new Gallery({
            title: req.body.title,
            url: `/uploads/${req.file.filename}`
        });
        await gallery.save();
        
        // Log activity
        const activity = new Activity({
            description: `Added new gallery image: ${gallery.title}`,
            timestamp: new Date()
        });
        await activity.save();
        
        res.status(201).json(gallery);
    } catch (error) {
        res.status(500).json({ message: 'Error uploading image' });
    }
});

app.put('/api/admin/contact', auth, async (req, res) => {
    try {
        const contact = await Contact.findOneAndUpdate({}, req.body, { 
            new: true,
            upsert: true
        });
        
        // Log activity
        const activity = new Activity({
            description: 'Updated contact information',
            timestamp: new Date()
        });
        await activity.save();
        
        res.json(contact);
    } catch (error) {
        res.status(500).json({ message: 'Error updating contact info' });
    }
});

app.get('/api/admin/bookings', auth, async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('service')
            .populate('barber')
            .sort('-date');
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings' });
    }
});

app.put('/api/admin/bookings/:id', auth, async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        
        // Log activity
        const activity = new Activity({
            description: `Updated booking for ${booking.customerName}`,
            timestamp: new Date()
        });
        await activity.save();
        
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Error updating booking' });
    }
});

// Admin Dashboard API
app.get('/api/dashboard', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            todayBookings,
            totalRevenue,
            activeServices,
            teamMembers
        ] = await Promise.all([
            Booking.countDocuments({ date: { $gte: today } }),
            Booking.aggregate([
                { $match: { status: 'completed' } },
                { $lookup: { from: 'services', localField: 'service', foreignField: '_id', as: 'service' } },
                { $unwind: '$service' },
                { $group: { _id: null, total: { $sum: '$service.price' } } }
            ]),
            Service.countDocuments(),
            TeamMember.countDocuments()
        ]);

        res.json({
            todayBookings,
            totalRevenue: totalRevenue[0]?.total || 0,
            activeServices,
            teamMembers
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});

// Enhanced Services API
app.post('/api/services', auth, async (req, res) => {
    try {
        const { name, description, price } = req.body;
        const service = new Service({ name, description, price });
        await service.save();
        res.status(201).json(service);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/api/services/:id', auth, async (req, res) => {
    try {
        const service = await Service.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.json(service);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/services/:id', auth, async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Enhanced Team Members API
app.get('/api/team', auth, async (req, res) => {
    try {
        const team = await TeamMember.find();
        res.json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/team', auth, async (req, res) => {
    try {
        const { name, role, email } = req.body;
        const teamMember = new TeamMember({ name, role, email });
        await teamMember.save();
        res.status(201).json(teamMember);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/api/team/:id', auth, async (req, res) => {
    try {
        const teamMember = await TeamMember.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!teamMember) {
            return res.status(404).json({ message: 'Team member not found' });
        }
        res.json(teamMember);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/team/:id', auth, async (req, res) => {
    try {
        const teamMember = await TeamMember.findByIdAndDelete(req.params.id);
        if (!teamMember) {
            return res.status(404).json({ message: 'Team member not found' });
        }
        res.json({ message: 'Team member deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin Authentication
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/logout', auth, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

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
        const { name, email, role, bio, photo } = req.body;
        
        // Validate required fields
        if (!name || !email || !role || !bio) {
            return res.status(400).json({ 
                message: 'Name, email, role, and bio are required fields' 
            });
        }

        // Create new team member
        const teamMember = new TeamMember({
            name,
            email,
            role,
            bio,
            photo: photo || null
        });

        await teamMember.save();

        // Log activity
        const activity = new Activity({
            user: req.user.email,
            action: 'CREATE_TEAM_MEMBER',
            details: `Created team member: ${name}`
        });
        await activity.save();

        res.status(201).json(teamMember);
    } catch (error) {
        console.error('Error creating team member:', error);
        res.status(500).json({ 
            message: 'Error creating team member',
            error: error.message 
        });
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

// Analytics API Routes
app.get('/api/analytics/revenue', auth, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const revenues = await Booking.aggregate([
            {
                $match: {
                    status: 'completed',
                    date: { $gte: thirtyDaysAgo }
                }
            },
            {
                $lookup: {
                    from: 'services',
                    localField: 'service',
                    foreignField: '_id',
                    as: 'service'
                }
            },
            { $unwind: '$service' },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    total: { $sum: '$service.price' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        const labels = revenues.map(r => r._id);
        const values = revenues.map(r => r.total);

        res.json({ labels, values });
    } catch (error) {
        console.error('Error fetching revenue analytics:', error);
        res.status(500).json({ message: 'Error fetching revenue analytics' });
    }
});

app.get('/api/analytics/services', auth, async (req, res) => {
    try {
        const popularServices = await Booking.aggregate([
            {
                $match: {
                    status: 'completed'
                }
            },
            {
                $lookup: {
                    from: 'services',
                    localField: 'service',
                    foreignField: '_id',
                    as: 'service'
                }
            },
            { $unwind: '$service' },
            {
                $group: {
                    _id: '$service.name',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const labels = popularServices.map(s => s._id);
        const values = popularServices.map(s => s.count);

        res.json({ labels, values });
    } catch (error) {
        console.error('Error fetching service analytics:', error);
        res.status(500).json({ message: 'Error fetching service analytics' });
    }
});

// Settings API Routes
app.post('/api/settings/hours', auth, async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
        }
        settings.businessHours = req.body;
        await settings.save();
        res.json({ message: 'Business hours updated successfully' });
    } catch (error) {
        console.error('Error updating business hours:', error);
        res.status(500).json({ message: 'Error updating business hours' });
    }
});

app.get('/api/settings/notifications', auth, async (req, res) => {
    try {
        const settings = await Settings.findOne();
        res.json({
            email: settings?.notifications?.email ?? true,
            sms: settings?.notifications?.sms ?? false
        });
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        res.status(500).json({ message: 'Error fetching notification settings' });
    }
});

app.post('/api/settings/notifications', auth, async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
        }
        settings.notifications = req.body;
        await settings.save();
        res.json({ message: 'Notification settings updated successfully' });
    } catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({ message: 'Error updating notification settings' });
    }
});

// Export Bookings
app.get('/api/bookings/export', auth, async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('service')
            .populate('employee')
            .sort({ date: -1 });

        const csvData = bookings.map(booking => ({
            Date: new Date(booking.date).toLocaleDateString(),
            Time: new Date(booking.date).toLocaleTimeString(),
            Service: booking.service.name,
            Price: booking.service.price,
            Customer: booking.customerName,
            Email: booking.customerEmail,
            Phone: booking.customerPhone,
            Barber: booking.employee.name,
            Status: booking.status
        }));

        const csv = await json2csv(csvData);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=bookings-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting bookings:', error);
        res.status(500).json({ message: 'Error exporting bookings' });
    }
});

// Gallery Routes
app.post('/api/gallery/upload', auth, upload.array('photos', 10), async (req, res) => {
    try {
        const uploadedPhotos = [];
        for (const file of req.files) {
            const photo = new Gallery({
                url: `/uploads/${file.filename}`,
                title: file.originalname,
                uploadedBy: req.user._id
            });
            await photo.save();
            uploadedPhotos.push(photo);
        }
        
        // Log activity
        const activity = new Activity({
            user: req.user.email,
            action: 'UPLOAD_PHOTOS',
            details: `Uploaded ${req.files.length} photos`
        });
        await activity.save();

        res.status(201).json(uploadedPhotos);
    } catch (error) {
        console.error('Error uploading photos:', error);
        res.status(500).json({ message: 'Error uploading photos' });
    }
});

app.get('/api/gallery', auth, async (req, res) => {
    try {
        const photos = await Gallery.find().sort({ createdAt: -1 });
        res.json(photos);
    } catch (error) {
        console.error('Error fetching gallery:', error);
        res.status(500).json({ message: 'Error fetching gallery' });
    }
});

app.delete('/api/gallery/:id', auth, async (req, res) => {
    try {
        const photo = await Gallery.findById(req.params.id);
        if (!photo) {
            return res.status(404).json({ message: 'Photo not found' });
        }

        // Delete file from uploads directory
        const filePath = path.join(__dirname, 'public', photo.url);
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
        });

        await photo.deleteOne();

        // Log activity
        const activity = new Activity({
            user: req.user.email,
            action: 'DELETE_PHOTO',
            details: `Deleted photo: ${photo.title}`
        });
        await activity.save();

        res.json({ message: 'Photo deleted successfully' });
    } catch (error) {
        console.error('Error deleting photo:', error);
        res.status(500).json({ message: 'Error deleting photo' });
    }
});

// Reviews Routes
app.get('/api/reviews', auth, async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Error fetching reviews' });
    }
});

app.patch('/api/reviews/:id', auth, async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { approved: req.body.approved },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Log activity
        const activity = new Activity({
            user: req.user.email,
            action: 'UPDATE_REVIEW',
            details: `${req.body.approved ? 'Approved' : 'Unpublished'} review from ${review.customerName}`
        });
        await activity.save();

        res.json(review);
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ message: 'Error updating review' });
    }
});

app.delete('/api/reviews/:id', auth, async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Log activity
        const activity = new Activity({
            user: req.user.email,
            action: 'DELETE_REVIEW',
            details: `Deleted review from ${review.customerName}`
        });
        await activity.save();

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Error deleting review' });
    }
});

// Activity Log Routes
app.get('/api/activity-log', auth, async (req, res) => {
    try {
        const activities = await Activity.find()
            .sort({ timestamp: -1 })
            .limit(100);
        res.json(activities);
    } catch (error) {
        console.error('Error fetching activity log:', error);
        res.status(500).json({ message: 'Error fetching activity log' });
    }
});

// Analytics API Routes
app.get('/api/analytics', auth, async (req, res) => {
    try {
        const range = req.query.range || 'week';
        const now = new Date();
        let startDate;

        switch (range) {
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                startDate = new Date(now.setDate(now.getDate() - 7));
        }

        // Get revenue data
        const bookings = await Booking.find({
            date: { $gte: startDate }
        }).populate('service');

        const revenue = bookings.reduce((acc, booking) => {
            const date = booking.date.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + booking.service.price;
            return acc;
        }, {});

        // Get popular time slots
        const timeSlots = bookings.reduce((acc, booking) => {
            const hour = booking.date.getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {});

        // Get service performance
        const services = await Service.aggregate([
            {
                $lookup: {
                    from: 'bookings',
                    localField: '_id',
                    foreignField: 'service',
                    as: 'bookings'
                }
            },
            {
                $project: {
                    name: 1,
                    bookingCount: { $size: '$bookings' }
                }
            }
        ]);

        // Calculate metrics
        const totalCustomers = await Customer.countDocuments();
        const newCustomers = await Customer.countDocuments({
            createdAt: { $gte: startDate }
        });
        const repeatCustomers = await Booking.distinct('customer', {
            date: { $gte: startDate }
        });
        const avgBookingValue = bookings.length > 0 
            ? bookings.reduce((acc, b) => acc + b.service.price, 0) / bookings.length 
            : 0;

        res.json({
            revenue: Object.entries(revenue).map(([date, value]) => ({ date, value })),
            timeSlots: Object.entries(timeSlots).map(([hour, count]) => ({ hour, count })),
            services: services.map(s => ({ name: s.name, count: s.bookingCount })),
            demographics: [], // To be implemented based on customer data
            metrics: {
                retentionRate: Math.round((repeatCustomers.length / totalCustomers) * 100),
                avgBookingValue: Math.round(avgBookingValue * 100) / 100,
                newCustomers,
                satisfactionRate: 95 // Placeholder - implement based on reviews
            }
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Error fetching analytics' });
    }
});

// Marketing Routes
app.post('/api/marketing/email', auth, async (req, res) => {
    try {
        const campaign = new EmailCampaign({
            name: req.body.name,
            targetAudience: req.body.targetAudience,
            template: req.body.template,
            createdBy: req.user._id
        });
        await campaign.save();

        // Log activity
        const activity = new Activity({
            user: req.user.email,
            action: 'CREATE_EMAIL_CAMPAIGN',
            details: `Created email campaign: ${campaign.name}`
        });
        await activity.save();

        res.status(201).json(campaign);
    } catch (error) {
        console.error('Error creating email campaign:', error);
        res.status(500).json({ message: 'Error creating email campaign' });
    }
});

app.post('/api/marketing/sms', auth, async (req, res) => {
    try {
        const campaign = new SmsCampaign({
            type: req.body.type,
            message: req.body.message,
            createdBy: req.user._id
        });
        await campaign.save();

        // Log activity
        const activity = new Activity({
            user: req.user.email,
            action: 'CREATE_SMS_CAMPAIGN',
            details: `Created SMS campaign of type: ${campaign.type}`
        });
        await activity.save();

        res.status(201).json(campaign);
    } catch (error) {
        console.error('Error creating SMS campaign:', error);
        res.status(500).json({ message: 'Error creating SMS campaign' });
    }
});

// Inventory Routes
app.get('/api/inventory', auth, async (req, res) => {
    try {
        const products = await Product.find().sort('name');
        res.json(products);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ message: 'Error fetching inventory' });
    }
});

app.post('/api/inventory', auth, async (req, res) => {
    try {
        const product = new Product({
            name: req.body.name,
            category: req.body.category,
            stock: req.body.stock,
            price: req.body.price,
            status: req.body.status
        });
        await product.save();

        // Log activity
        const activity = new Activity({
            user: req.user.email,
            action: 'CREATE_PRODUCT',
            details: `Added product: ${product.name}`
        });
        await activity.save();

        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error creating product' });
    }
});

app.put('/api/inventory/:id', auth, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                category: req.body.category,
                stock: req.body.stock,
                price: req.body.price,
                status: req.body.status
            },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Log activity
        const activity = new Activity({
            user: req.user.email,
            action: 'UPDATE_PRODUCT',
            details: `Updated product: ${product.name}`
        });
        await activity.save();

        res.json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product' });
    }
});

// Staff Schedule Routes
app.get('/api/schedule', auth, async (req, res) => {
    try {
        const shifts = await Shift.find()
            .populate('staff')
            .sort('start');
        
        const events = shifts.map(shift => ({
            id: shift._id,
            title: `${shift.staff.name} - ${shift.type}`,
            start: shift.start,
            end: shift.end,
            backgroundColor: shift.type === 'regular' ? '#4CAF50' : '#FFC107'
        }));

        res.json(events);
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ message: 'Error fetching schedule' });
    }
});

app.post('/api/schedule', auth, async (req, res) => {
    try {
        const shift = new Shift({
            staff: req.body.staffId,
            type: req.body.type,
            start: req.body.start,
            end: req.body.end
        });
        await shift.save();

        // Log activity
        const activity = new Activity({
            user: req.user.email,
            action: 'CREATE_SHIFT',
            details: `Created shift for staff ID: ${shift.staff}`
        });
        await activity.save();

        res.status(201).json(shift);
    } catch (error) {
        console.error('Error creating shift:', error);
        res.status(500).json({ message: 'Error creating shift' });
    }
});

// Business Hours API
app.get('/api/business-hours', auth, async (req, res) => {
    try {
        const settings = await Settings.findOne();
        res.json(settings?.businessHours || {});
    } catch (error) {
        res.status(500).json({ message: 'Error fetching business hours' });
    }
});

app.put('/api/business-hours', auth, async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
        }
        settings.businessHours = req.body;
        await settings.save();
        res.json(settings.businessHours);
    } catch (error) {
        res.status(500).json({ message: 'Error updating business hours' });
    }
});

// Team Members API
app.post('/api/team', auth, async (req, res) => {
    try {
        const { name, email, role, bio, photo } = req.body;
        
        // Validate required fields
        if (!name || !email || !role || !bio) {
            return res.status(400).json({ 
                message: 'Name, email, role, and bio are required fields' 
            });
        }

        // Create new team member
        const teamMember = new TeamMember({
            name,
            email,
            role,
            bio,
            photo: photo || null
        });

        await teamMember.save();

        // Log activity
        const activity = new Activity({
            user: req.user.email,
            action: 'CREATE_TEAM_MEMBER',
            details: `Created team member: ${name}`
        });
        await activity.save();

        res.status(201).json(teamMember);
    } catch (error) {
        console.error('Error creating team member:', error);
        res.status(500).json({ 
            message: 'Error creating team member',
            error: error.message 
        });
    }
});

// Enhanced Booking API
app.post('/api/bookings', auth, async (req, res) => {
    try {
        const { customerName, customerEmail, customerPhone, service, barber, date, time, notes } = req.body;
        
        const booking = new Booking({
            customerName,
            customerEmail,
            customerPhone,
            service,
            barber,
            date,
            time,
            notes,
            status: 'pending'
        });
        
        await booking.save();
        
        // Log activity
        const activity = new Activity({
            description: `New booking created for ${customerName}`,
            timestamp: new Date()
        });
        await activity.save();
        
        res.status(201).json(booking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/api/bookings/:id', auth, async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate('service').populate('barber');
        
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        
        // Log activity
        const activity = new Activity({
            description: `Updated booking for ${booking.customerName}`,
            timestamp: new Date()
        });
        await activity.save();
        
        res.json(booking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Serve admin pages
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'admin.html'));
});

app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
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

// Create default admin user if none exists
async function createDefaultAdmin() {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = new User({
                username: 'admin',
                email: 'admin@moonbarbershop.com',
                password: hashedPassword,
                role: 'admin',
                firstName: 'Admin',
                lastName: 'User',
                active: true
            });
            await admin.save();
            console.log('Default admin user created successfully');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
}

// Start Server
console.log('Starting server with configuration:', {
    port: PORT,
    mongoUri: process.env.MONGODB_URI,
    env: process.env.NODE_ENV
});

const server = app.listen(PORT, async () => {
    const address = server.address();
    console.log(`Server is running on port ${address.port}`);
    console.log('Server address:', address);
    
    // Create default admin user
    await createDefaultAdmin();
});
