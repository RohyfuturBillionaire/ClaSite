const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// Middleware

// Serve uploaded files — local dev only (production uses Vercel Blob URLs)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'CLA Site API' });
});

// API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/articles', require('./routes/articleRoutes'));
app.use('/api/collections', require('./routes/collectionRoutes'));
app.use('/api/boutiques', require('./routes/boutiqueRoutes'));
app.use('/api/commandes', require('./routes/commandeRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/site', require('./routes/siteRoutes'));

module.exports = app;
