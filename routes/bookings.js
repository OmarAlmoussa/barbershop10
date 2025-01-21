const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// Get All Bookings
router.get('/', async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('service')
            .populate('barber')
            .sort({ date: 1, time: 1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add Booking
router.post('/', async (req, res) => {
    const { 
        service, 
        barber,
        customerName, 
        customerEmail,
        customerPhone,
        date, 
        time,
        notes 
    } = req.body;

    try {
        const newBooking = new Booking({ 
            service, 
            barber,
            customerName, 
            customerEmail,
            customerPhone,
            date, 
            time,
            notes 
        });
        
        await newBooking.save();
        
        const populatedBooking = await Booking.findById(newBooking._id)
            .populate('service')
            .populate('barber');
            
        res.status(201).json(populatedBooking);
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
