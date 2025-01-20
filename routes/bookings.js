const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// Get All Bookings
router.get('/', async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add Booking
router.post('/', async (req, res) => {
    const { service, customerName, date, time } = req.body;
    try {
        const newBooking = new Booking({ service, customerName, date, time });
        await newBooking.save();
        res.status(201).json(newBooking);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
