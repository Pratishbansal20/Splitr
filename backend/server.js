const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware to clean URLs
app.use((req, res, next) => {
  req.url = req.url.replace(/[\s%0A]+$/, '');
  next();
});

// Standard middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('API Running');
});

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const expenseRoutes = require('./routes/expense');
app.use('/api/expense', expenseRoutes);

const groupRoutes = require('./routes/group');
app.use('/api/group', groupRoutes);



// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Connected'))
.catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

