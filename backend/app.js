const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware to clean URLs
app.use((req, res, next) => {
  req.url = req.url.replace(/[\s%0A]+$/, '');
  next();
});

app.use(helmet());

// FRONTEND_URL is a comma-separated allowlist of origins allowed to call this
// API. Set it to your deployed frontend's origin in production — without it,
// only localhost:3000 (the CRA dev server default) is allowed.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('API Running');
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authLimiter, authRoutes);

const expenseRoutes = require('./routes/expense');
app.use('/api/expense', expenseRoutes);

const groupRoutes = require('./routes/group');
app.use('/api/group', groupRoutes);

app.use('/api/friends', require('./routes/friends'));

// 404 for anything unmatched
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Centralized error handler — replaces the repeated try/catch { res.status(500)... }
// that used to be duplicated in every controller.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server Error' });
});

module.exports = app;
