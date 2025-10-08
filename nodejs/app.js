const express = require('express');
const app = express();
const { runStartupSync } = require('./controller/startupController');

// parse JSON bodies
app.use(express.json());

// Route mounting
app.use('/api/auth', require('./routes/auth'));
app.use('/api/listing', require('./routes/listing'));
app.use('/api/search', require('./routes/search'));
app.use('/api/enquiry', require('./routes/enquiry'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/adminlisting', require('./routes/adminListing'));
app.use('/api/apimanagement', require('./routes/apiManagement'));
app.use('/api/map', require('./routes/map'));

// Generic 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
  try {
    const res = await runStartupSync();
    console.log(`Startup sync completed: ${res.count} records processed.`);
  } catch (err) {
    console.error('Startup sync failed:', err);
  }
});

module.exports = app;
