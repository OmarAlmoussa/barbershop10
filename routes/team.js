const express = require('express');
const router = express.Router();
const TeamMember = require('../models/TeamMember');

// Get All Team Members
router.get('/', async (req, res) => {
    try {
        const team = await TeamMember.find();
        res.json(team);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add Team Member
router.post('/', async (req, res) => {
    const { name, role, bio, photo } = req.body;
    try {
        const newMember = new TeamMember({ name, role, bio, photo });
        await newMember.save();
        res.status(201).json(newMember);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete Team Member
router.delete('/:id', async (req, res) => {
    try {
        const member = await TeamMember.findByIdAndDelete(req.params.id);
        if (!member) {
            return res.status(404).json({ message: 'Team member not found' });
        }
        res.json({ message: 'Team member deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
