const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();



const app = express();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const userRoutes = require('./api/routes/userRoutes');
const patternRoutes = require('./api/routes/patternRoutes');
const aiRoutes = require('./api/routes/aiRoutes');
// Routes
app.use('/users', userRoutes);
app.use('/patterns', patternRoutes);
app.use('/ai', aiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Server error:', err);
});
