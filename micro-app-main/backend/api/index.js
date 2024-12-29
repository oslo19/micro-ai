const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://frontend-two-nu-17.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// Connect to MongoDB with better error handling
let cachedDb = null;

async function connectToDatabase() {
  try {
    if (cachedDb) {
      console.log('Using cached database connection');
      return cachedDb;
    }
    
    console.log('Connecting to MongoDB...');
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000 // 10 seconds
    });
    
    console.log('MongoDB Connected Successfully');
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    throw error;
  }
}

// Initialize connection on startup
connectToDatabase().catch(console.error);

// Basic test route
app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    message: 'Pattern Generator API is running',
    endpoints: {
      users: '/users',
      patterns: '/patterns',
      ai: '/ai'
    },
    timestamp: new Date().toISOString()
  });
});

// Add a catch-all route for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: {
      users: '/users',
      patterns: '/patterns',
      ai: '/ai'
    }
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await connectToDatabase();
    res.json({ 
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Routes
const userRoutes = require('./routes/userRoutes');
const patternRoutes = require('./routes/patternRoutes');
const aiRoutes = require('./routes/aiRoutes');

app.use('/users', userRoutes);
app.use('/patterns', patternRoutes);
app.use('/ai', aiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app; 