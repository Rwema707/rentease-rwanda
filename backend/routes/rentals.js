const express = require('express');
const router = express.Router();
const { getDb } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// FR 4.1 – Tenant submits rental request
router.post('/', authenticateToken, requireRole('tenant'), (req, res) => {
  const { property_id, message, move_in_date } = req.body;
  if (!property_id) return res.status(400).json({ error: 'property_id required' });
  const db = getDb();
  const prop = db.prepare('SELECT * FROM properties WHERE id=? AND is_available=1').get(property_id);
  if (!prop) return res.status(404).json({ error: 'Property not available' });
  const exists = db.prepare("SELECT id FROM rental_requests WHERE property_id=? AND tenant_id=? AND status='pending'").get(property_id, req.user.id);
  if (exists) return res.status(409).json({ error: 'You already have a pending request for this property' });
  const r = db.prepare('INSERT INTO rental_requests (property_id,tenant_id,landlord_id,message,move_in_date) VALUES (?,?,?,?,?)')
    .run(property_id, req.user.id, prop.landlord_id, message||'', move_in_date||null);
  db.prepare('INSERT INTO notifications (user_id,type,title,message,related_id,related_type) VALUES (?,?,?,?,?,?)')
    .run(prop.landlord_id,'rental_request','📋 New Rental Request',`${req.user.name} wants to rent: ${prop.title}`,r.lastInsertRowid,'rental_request');
  res.status(201).json({ message: 'Request sent!', request_id: r.lastInsertRowid });
});

// FR 4.2 – Landlord approves/rejects
router.put('/:id', authenticateToken, requireRole('landlord','admin'), (req, res) => {
  const { status } = req.body;
  if (!['approved','rejected'].includes(status)) return res.status(400).json({ error: 'Status: approved or rejected' });
  const db = getDb();
  const req_data = db.prepare('SELECT rr.*,p.title as ptitle,p.price FROM rental_requests rr JOIN properties p ON rr.property_id=p.id WHERE rr.id=?').get(req.params.id);
  if (!req_data) return res.status(404).json({ error: 'Request not found' });
  if (req_data.landlord_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
  db.prepare('UPDATE rental_requests SET status=? WHERE id=?').run(status, req.params.id);
  if (status === 'approved') {
    const start = req_data.move_in_date || new Date().toISOString().split('T')[0];
    db.prepare('INSERT INTO tenancies (property_id,tenant_id,landlord_id,start_date) VALUES (?,?,?,?)')
      .run(req_data.property_id, req_data.tenant_id, req_data.landlord_id, start);
    db.prepare('UPDATE properties SET is_available=0 WHERE id=?').run(req_data.property_id);
    db.prepare('INSERT INTO notifications (user_id,type,title,message) VALUES (?,?,?,?)')
      .run(req_data.tenant_id,'rental_approved','🎉 Rental Approved!',`Your request for "${req_data.ptitle}" was approved! You can now pay rent.`);
  } else {
    db.prepare('INSERT INTO notifications (user_id,type,title,message) VALUES (?,?,?,?)')
      .run(req_data.tenant_id,'rental_rejected','Rental Update',`Your request was declined. Keep searching!`);
  }
  res.json({ message: `Request ${status}` });
});

// Landlord's incoming requests
router.get('/landlord', authenticateToken, requireRole('landlord','admin'), (req, res) => {
  const rows = getDb().prepare(`SELECT rr.*,u.name as tenant_name,u.phone as tenant_phone,u.email as tenant_email,p.title as property_title,p.location as property_location FROM rental_requests rr JOIN users u ON rr.tenant_id=u.id JOIN properties p ON rr.property_id=p.id WHERE rr.landlord_id=? ORDER BY rr.created_at DESC`).all(req.user.id);
  res.json(rows);
});

// Tenant's own requests
router.get('/tenant', authenticateToken, requireRole('tenant'), (req, res) => {
  const rows = getDb().prepare(`SELECT rr.*,u.name as landlord_name,p.title as property_title,p.location,p.price FROM rental_requests rr JOIN users u ON rr.landlord_id=u.id JOIN properties p ON rr.property_id=p.id WHERE rr.tenant_id=? ORDER BY rr.created_at DESC`).all(req.user.id);
  res.json(rows);
});

module.exports = router;
