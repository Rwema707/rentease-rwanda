require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { dbReady } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Accept requests from Vercel frontend (and localhost for dev)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Vercel edge proxy)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o)) || origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    callback(null, true); // Allow all for now — tighten in production
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
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

  // Root route — confirms server is alive
  app.get('/', (req, res) => res.json({ service: 'RentEase Rwanda API', status: 'running', docs: '/api/health' }));
  app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'RentEase Rwanda API', time: new Date().toISOString() }));

  // Public status endpoint — shows DB health without auth
  app.get('/api/status', (req, res) => {
    try {
      const db = require('./database/db').getDb();
      const users = db.prepare('SELECT COUNT(*) as c FROM users').get();
      const props = db.prepare('SELECT COUNT(*) as c FROM properties').get();
      const admin = db.prepare("SELECT email FROM users WHERE role='admin'").get();
      res.json({
        status: 'ok',
        database: 'connected',
        users: users.c,
        properties: props.c,
        admin_seeded: !!admin,
        admin_email: admin?.email || null,
        env_frontend_url: process.env.FRONTEND_URL || '(not set — defaulting to localhost)',
      });
    } catch(e) {
      res.status(500).json({ status: 'error', message: e.message });
    }
  });

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