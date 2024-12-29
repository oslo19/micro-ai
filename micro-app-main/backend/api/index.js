const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Development CORS setup
const corsOptions = {
  origin: [
    'https://frontend-two-nu-17.vercel.app',
    'https://frontend-ltehs4ruz-oslo19s-projects.vercel.app',
    'https://bakend-ashen.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Optimized MongoDB connection for serverless
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
    
    cachedDb = db;
    console.log('MongoDB Connected');
    return db;
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    throw error;
  }
}

// Connect on startup
connectToDatabase();

// Basic test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pattern Generator API is running',
    endpoints: {
      generatePattern: 'POST /generate-pattern',
      getHint: 'POST /get-hint',
      testOpenAI: 'GET /test-openai'
    }
  });
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