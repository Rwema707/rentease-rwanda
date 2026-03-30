require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { dbReady } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Wait for DB to be ready, then mount routes & start server
dbReady.then(() => {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/properties', require('./routes/properties'));
  app.use('/api/rentals', require('./routes/rentals'));
  app.use('/api/payments', require('./routes/payments'));
  app.use('/api/maintenance', require('./routes/maintenance'));
  app.use('/api/admin', require('./routes/admin'));

  const { router: notifRouter, scheduleRentReminders } = require('./routes/notifications');
  app.use('/api/notifications', notifRouter);

  app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'RentEase Rwanda API', time: new Date().toISOString() }));

  app.use('/api/*', (req, res) => res.status(404).json({ error: 'Route not found' }));
  app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: err.message || 'Server error' }); });

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════╗
║    🏠  RentEase Rwanda API           ║
║    http://localhost:${PORT}            ║
║                                      ║
║  Demo accounts:                      ║
║  admin@rentease.rw   / admin123      ║
║  landlord@rentease.rw/ landlord123   ║
║  tenant@rentease.rw  / tenant123     ║
╚══════════════════════════════════════╝`);
    scheduleRentReminders();
  });
}).catch(err => { console.error('Failed to init database:', err); process.exit(1); });
