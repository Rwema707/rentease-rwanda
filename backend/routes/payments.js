const express = require('express');
const router = express.Router();
const { getDb } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const txnId = () => 'TXN' + Date.now() + Math.random().toString(36).substring(2,5).toUpperCase();
const rcptNum = () => 'RCT-RW-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2,8).toUpperCase();

// Get active tenancy (for tenant)
router.get('/tenancy', authenticateToken, requireRole('tenant'), (req, res) => {
  const t = getDb().prepare(`SELECT t.*,p.title as property_title,p.location,p.price as monthly_rent,u.name as landlord_name,u.phone as landlord_phone FROM tenancies t JOIN properties p ON t.property_id=p.id JOIN users u ON t.landlord_id=u.id WHERE t.tenant_id=? AND t.is_active=1`).get(req.user.id);
  res.json(t || null);
});

// FR 5.1 – Pay rent
router.post('/', authenticateToken, requireRole('tenant'), (req, res) => {
  const { tenancy_id, amount, payment_method, month_covered } = req.body;
  if (!tenancy_id||!amount||!payment_method) return res.status(400).json({ error: 'tenancy_id, amount, payment_method required' });
  const db = getDb();
  const tenancy = db.prepare(`SELECT t.*,p.title as ptitle,p.price as rent FROM tenancies t JOIN properties p ON t.property_id=p.id WHERE t.id=? AND t.tenant_id=? AND t.is_active=1`).get(tenancy_id, req.user.id);
  if (!tenancy) return res.status(404).json({ error: 'Active tenancy not found' });

  // Simulate payment (95% success) — replace with real MTN/Airtel API call in production
  const success = Math.random() > 0.05;
  const tId = txnId(), rNum = rcptNum();
  const status = success ? 'completed' : 'failed';
  const month = month_covered || new Date().toISOString().substring(0,7);
  const paidAt = success ? new Date().toISOString() : null;

  const r = db.prepare('INSERT INTO payments (tenancy_id,tenant_id,landlord_id,property_id,amount,payment_method,status,transaction_id,receipt_number,month_covered,paid_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(tenancy_id, req.user.id, tenancy.landlord_id, tenancy.property_id, Number(amount), payment_method, status, tId, rNum, month, paidAt);

  if (success) {
    db.prepare('INSERT INTO notifications (user_id,type,title,message,related_id,related_type) VALUES (?,?,?,?,?,?)')
      .run(tenancy.landlord_id,'payment_received','💰 Rent Received',`${req.user.name} paid RWF ${Number(amount).toLocaleString()} for ${tenancy.ptitle}. Receipt: ${rNum}`,r.lastInsertRowid,'payment');
    db.prepare('INSERT INTO notifications (user_id,type,title,message,related_id,related_type) VALUES (?,?,?,?,?,?)')
      .run(req.user.id,'payment_success','✅ Payment Successful',`RWF ${Number(amount).toLocaleString()} paid. Receipt: ${rNum}`,r.lastInsertRowid,'payment');
  }

  res.status(success?201:402).json({ success, message: success?'Payment successful':'Payment failed. Try again.', transaction_id: tId, receipt_number: success?rNum:null, payment_id: r.lastInsertRowid, status });
});

// FR 5.2 – Get receipt
router.get('/receipt/:id', authenticateToken, (req, res) => {
  const p = getDb().prepare(`SELECT pay.*,u.name as tenant_name,u.phone as tenant_phone,u2.name as landlord_name,pr.title as property_title,pr.location FROM payments pay JOIN users u ON pay.tenant_id=u.id JOIN users u2 ON pay.landlord_id=u2.id JOIN properties pr ON pay.property_id=pr.id WHERE pay.id=?`).get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Payment not found' });
  if (p.tenant_id!==req.user.id && p.landlord_id!==req.user.id && req.user.role!=='admin') return res.status(403).json({ error: 'Not authorized' });
  res.json(p);
});

// FR 5.3 – Payment history
router.get('/history', authenticateToken, (req, res) => {
  const db = getDb();
  let rows;
  if (req.user.role==='tenant') {
    rows = db.prepare(`SELECT pay.*,p.title as property_title,p.location,u.name as landlord_name FROM payments pay JOIN properties p ON pay.property_id=p.id JOIN users u ON pay.landlord_id=u.id WHERE pay.tenant_id=? ORDER BY pay.created_at DESC`).all(req.user.id);
  } else if (req.user.role==='landlord') {
    rows = db.prepare(`SELECT pay.*,p.title as property_title,u.name as tenant_name,u.phone as tenant_phone FROM payments pay JOIN properties p ON pay.property_id=p.id JOIN users u ON pay.tenant_id=u.id WHERE pay.landlord_id=? ORDER BY pay.created_at DESC`).all(req.user.id);
  } else {
    rows = db.prepare(`SELECT pay.*,p.title as property_title,u.name as tenant_name,u2.name as landlord_name FROM payments pay JOIN properties p ON pay.property_id=p.id JOIN users u ON pay.tenant_id=u.id JOIN users u2 ON pay.landlord_id=u2.id ORDER BY pay.created_at DESC`).all();
  }
  res.json(rows);
});

module.exports = router;
