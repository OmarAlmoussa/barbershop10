const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

// Get All Services
router.get('/', async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add Service
router.post('/', async (req, res) => {
    const { name, description, price } = req.body;
    try {
        const newService = new Service({ name, description, price });
        await newService.save();
        res.status(201).json(newService);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete Service
router.delete('/:id', async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
