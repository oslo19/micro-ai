const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://frontend-two-nu-17.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic test route
app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    message: 'Pattern Generator API is running',
    endpoints: {
      users: '/users',
      patterns: '/patterns',
      ai: '/ai'
    }
  });
});

// Routes
const userRoutes = require('./api/routes/userRoutes');
const patternRoutes = require('./api/routes/patternRoutes');
const aiRoutes = require('./api/routes/aiRoutes');

app.use('/users', userRoutes);
app.use('/patterns', patternRoutes);
app.use('/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
