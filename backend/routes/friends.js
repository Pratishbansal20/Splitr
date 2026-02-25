const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

// Get my friends
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('friends', 'name email');
        res.json(user.friends);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add friend by email
router.post('/add', auth, async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    try {
        const friend = await User.findOne({ email });
        if (!friend) {
            return res.status(404).json({ error: "User not found" });
        }

        if (friend._id.toString() === req.user.id) {
            return res.status(400).json({ error: "You cannot add yourself" });
        }

        const user = await User.findById(req.user.id);

        // Check if already friends
        if (user.friends.includes(friend._id)) {
            return res.status(400).json({ error: "User is already your friend" });
        }

        // Add friend (Mutual? For now, one-way or auto-mutual?)
        // User requested "add only its friends". Usually friendship is mutual.
        // I will implementation Mutual Addition for simplicity.

        user.friends.push(friend._id);
        await user.save();

        // Auto-add me to their friends too? 
        // Usually requires acceptance, but for MVP, I will do mutual auto-add so B sees A too.
        if (!friend.friends.includes(user._id)) {
            friend.friends.push(user._id);
            await friend.save();
        }

        res.json({ message: "Friend added successfully", friend: { id: friend._id, name: friend.name, email: friend.email } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
