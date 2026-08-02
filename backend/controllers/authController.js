const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Kept at the historical 100h default so existing sessions/UX don't silently
// change; override via JWT_EXPIRES_IN (seconds) when you're ready to shorten it.
const JWT_EXPIRES_IN = Number(process.env.JWT_EXPIRES_IN) || 360000;

async function register(req, res, next) {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
      (err, token) => {
        if (err) return next(err);
        res.status(201).json({
          message: 'User registered successfully!',
          token,
          user: { id: user._id, name: user.name, email: user.email }
        });
      }
    );
  } catch (error) {
    next(error);
  }
}

async function listUsers(req, res, next) {
  try {
    const users = await User.find({}, '_id name email');
    res.json(users);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
      (err, token) => {
        if (err) return next(err);
        res.json({
          message: "Login successful",
          token,
          user: { id: user._id, name: user.name, email: user.email }
        });
      }
    );
  } catch (error) {
    next(error);
  }
}

module.exports = { register, listUsers, login };
