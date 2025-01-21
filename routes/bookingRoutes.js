const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// Get all bookings
router.get('/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('service')
            .populate('barber')
            .sort({ date: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new booking
router.post('/bookings', async (req, res) => {
    try {
        // Check for existing bookings at the same time
        const existingBooking = await Booking.findOne({
            barber: req.body.barber,
            date: req.body.date,
            time: req.body.time,
            status: { $in: ['PENDING', 'CONFIRMED'] }
        });

        if (existingBooking) {
            return res.status(400).json({ 
                message: 'This time slot is already booked for the selected barber. Please choose a different time or barber.' 
            });
        }

        const booking = new Booking({
            ...req.body,
            status: 'PENDING'
        });

        const newBooking = await booking.save();
        res.status(201).json(newBooking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update booking status
router.put('/bookings/:id/status', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.status = req.body.status;
        const updatedBooking = await booking.save();
        res.json(updatedBooking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
