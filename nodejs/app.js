const express = require('express');
const cors = require('cors');
const { PORT } = require('./config');
const { runStartupSync } = require('./controller/startupController');

const app = express();
// Additional Orgins allowed
const allowedOrigins = ['https://rentwisesg.netlify.app'];
// Enable CORS for local dev environments (update when deployed)
app.use(cors({
  origin: [...allowedOrigins, 'http://127.0.0.1:5500', 'http://localhost:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Parse JSON request bodies
app.use(express.json());

// Route mounting
app.use('/api/auth', require('./routes/auth'));
app.use('/api/listing', require('./routes/listing'));
app.use('/api/govlisting', require('./routes/govListing'));
app.use('/api/search', require('./routes/search'));
app.use('/api/enquiry', require('./routes/enquiry'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/adminlisting', require('./routes/adminListing'));
app.use('/api/apimanagement', require('./routes/apiManagement'));
app.use('/api/usermanagement', require('./routes/userManagement'));
app.use('/api/map', require('./routes/map'));

// Generic 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Default port fallback if not set in .env
const port = PORT || 3000;

// Server start
app.listen(port, async () => {
  console.log(`[APP] Server listening on port ${port}`);
  try {
    const res = await runStartupSync();
    console.log(`[APP] Startup sync completed: ${res.count} records processed.`);
  } catch (err) {
    console.error('[APP] Startup sync failed:', err);
  }
});

module.exports = app;
