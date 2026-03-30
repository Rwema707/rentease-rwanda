const express = require('express');
const router = express.Router();
const { getDb } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/stats', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDb();
  res.json({
    users: {
      total: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
      landlords: db.prepare("SELECT COUNT(*) as c FROM users WHERE role='landlord'").get().c,
      tenants: db.prepare("SELECT COUNT(*) as c FROM users WHERE role='tenant'").get().c,
    },
    properties: {
      total: db.prepare('SELECT COUNT(*) as c FROM properties').get().c,
      available: db.prepare('SELECT COUNT(*) as c FROM properties WHERE is_available=1').get().c,
    },
    payments: (() => {
      const r = db.prepare("SELECT COUNT(*) as c, COALESCE(SUM(amount),0) as total FROM payments WHERE status='completed'").get();
      return { count: r.c, total_revenue: r.total };
    })(),
    maintenance: {
      total: db.prepare('SELECT COUNT(*) as c FROM maintenance_requests').get().c,
      pending: db.prepare("SELECT COUNT(*) as c FROM maintenance_requests WHERE status='pending'").get().c,
    }
  });
});

router.get('/users', authenticateToken, requireRole('admin'), (req, res) => {
  res.json(getDb().prepare('SELECT id,name,email,phone,role,is_verified,created_at FROM users ORDER BY created_at DESC').all());
});

router.get('/payments', authenticateToken, requireRole('admin'), (req, res) => {
  res.json(getDb().prepare(`SELECT pay.*,p.title as property_title,u.name as tenant_name,u2.name as landlord_name FROM payments pay JOIN properties p ON pay.property_id=p.id JOIN users u ON pay.tenant_id=u.id JOIN users u2 ON pay.landlord_id=u2.id ORDER BY pay.created_at DESC`).all());
});

module.exports = router;
