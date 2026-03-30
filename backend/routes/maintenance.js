const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, f, cb) => { const d = path.join(__dirname,'../uploads/maintenance'); if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true}); cb(null,d); },
  filename: (req, f, cb) => cb(null,`maint_${Date.now()}${path.extname(f.originalname)}`)
});
const upload = multer({ storage, limits:{ fileSize:5*1024*1024 } });

// FR 7.1 – Tenant submits request
router.post('/', authenticateToken, requireRole('tenant'), upload.array('images',4), (req, res) => {
  const { property_id, title, description, priority } = req.body;
  if (!property_id||!title||!description) return res.status(400).json({ error: 'property_id, title, description required' });
  const db = getDb();
  const t = db.prepare('SELECT * FROM tenancies WHERE property_id=? AND tenant_id=? AND is_active=1').get(property_id, req.user.id);
  if (!t) return res.status(403).json({ error: 'You must be an active tenant to submit maintenance requests' });
  const imgs = req.files ? req.files.map(f=>`/uploads/maintenance/${f.filename}`) : [];
  const r = db.prepare('INSERT INTO maintenance_requests (property_id,tenant_id,landlord_id,title,description,priority,images) VALUES (?,?,?,?,?,?,?)')
    .run(property_id, req.user.id, t.landlord_id, title, description, priority||'medium', JSON.stringify(imgs));
  db.prepare('INSERT INTO notifications (user_id,type,title,message,related_id,related_type) VALUES (?,?,?,?,?,?)')
    .run(t.landlord_id,'maintenance','🔧 Maintenance Request',`${req.user.name}: "${title}" — Priority: ${priority||'medium'}`,r.lastInsertRowid,'maintenance');
  res.status(201).json({ message: 'Submitted', id: r.lastInsertRowid });
});

// FR 7.2 – Landlord views requests
router.get('/landlord', authenticateToken, requireRole('landlord','admin'), (req, res) => {
  const rows = getDb().prepare(`SELECT mr.*,u.name as tenant_name,u.phone as tenant_phone,p.title as property_title FROM maintenance_requests mr JOIN users u ON mr.tenant_id=u.id JOIN properties p ON mr.property_id=p.id WHERE mr.landlord_id=? ORDER BY mr.created_at DESC`).all(req.user.id);
  res.json(rows.map(r=>({...r,images:JSON.parse(r.images||'[]')})));
});

// Tenant's requests
router.get('/tenant', authenticateToken, requireRole('tenant'), (req, res) => {
  const rows = getDb().prepare(`SELECT mr.*,p.title as property_title,u.name as landlord_name FROM maintenance_requests mr JOIN properties p ON mr.property_id=p.id JOIN users u ON mr.landlord_id=u.id WHERE mr.tenant_id=? ORDER BY mr.created_at DESC`).all(req.user.id);
  res.json(rows.map(r=>({...r,images:JSON.parse(r.images||'[]')})));
});

// FR 7.3 – Landlord updates status
router.put('/:id', authenticateToken, requireRole('landlord','admin'), (req, res) => {
  const { status, landlord_notes } = req.body;
  if (!['pending','in_progress','completed','cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const db = getDb();
  const m = db.prepare('SELECT * FROM maintenance_requests WHERE id=?').get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Not found' });
  if (m.landlord_id!==req.user.id && req.user.role!=='admin') return res.status(403).json({ error: 'Not authorized' });
  db.prepare('UPDATE maintenance_requests SET status=?,landlord_notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run(status, landlord_notes||m.landlord_notes, req.params.id);
  const msgs = { in_progress:'🔨 Being worked on now.', completed:'✅ Issue resolved!', cancelled:'Request cancelled.' };
  if (msgs[status]) db.prepare('INSERT INTO notifications (user_id,type,title,message) VALUES (?,?,?,?)').run(m.tenant_id,'maintenance_update','Maintenance Update',`"${m.title}": ${msgs[status]}`);
  res.json({ message: 'Updated' });
});

module.exports = router;
