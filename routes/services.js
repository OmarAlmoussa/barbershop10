const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const auth = require('../middleware/auth');

// Get All Services
router.get('/', async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add Service
router.post('/', auth, async (req, res) => {
    const { name, description, price } = req.body;
    try {
        const newService = new Service({ name, description, price });
        await newService.save();
        res.status(201).json(newService);
    } catch (error) {
        console.error('Add service error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete Service
router.delete('/:id', auth, async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
