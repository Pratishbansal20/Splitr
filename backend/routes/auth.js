const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');


router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields (name, email, password) are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword  // Store hashed password
    });

    await user.save();
    res.status(201).json({
      message: 'User registered successfully!',
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '_id name email');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Successful login
    res.json({
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email }
      // Optionally, add a token here if you implement JWT
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
