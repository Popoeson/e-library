// backend/server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const searchRoutes = require('./controllers/searchController');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/search', searchRoutes);

// Serve frontend (static) — assumes parent folder contains `frontend` dir
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});