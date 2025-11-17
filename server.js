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

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});