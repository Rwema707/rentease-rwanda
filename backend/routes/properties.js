const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/properties');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `prop_${Date.now()}_${Math.random().toString(36).substr(2,5)}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5*1024*1024 }, fileFilter: (req,f,cb) => f.mimetype.startsWith('image/') ? cb(null,true) : cb(new Error('Images only')) });

// Public: search & filter (FR 3.1, 3.2)
router.get('/', (req, res) => {
  const { location, district, min_price, max_price, rooms, property_type } = req.query;
  let q = 'SELECT p.*,u.name as landlord_name,u.phone as landlord_phone FROM properties p JOIN users u ON p.landlord_id=u.id WHERE p.is_available=1';
  const params = [];
  if (location) { q += ' AND (p.location LIKE ? OR p.district LIKE ? OR p.title LIKE ?)'; params.push(`%${location}%`,`%${location}%`,`%${location}%`); }
  if (district && district!=='All') { q += ' AND p.district LIKE ?'; params.push(`%${district}%`); }
  if (min_price) { q += ' AND p.price >= ?'; params.push(Number(min_price)); }
  if (max_price) { q += ' AND p.price <= ?'; params.push(Number(max_price)); }
  if (rooms) { q += ' AND p.rooms = ?'; params.push(Number(rooms)); }
  if (property_type && property_type!=='All') { q += ' AND p.property_type = ?'; params.push(property_type); }
  q += ' ORDER BY p.created_at DESC';
  const rows = getDb().prepare(q).all(...params);
  res.json(rows.map(p => ({ ...p, image_urls: JSON.parse(p.image_urls||'[]'), amenities: JSON.parse(p.amenities||'[]') })));
});

// Landlord's own properties
router.get('/landlord/mine', authenticateToken, requireRole('landlord','admin'), (req, res) => {
  const rows = getDb().prepare('SELECT * FROM properties WHERE landlord_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows.map(p => ({ ...p, image_urls: JSON.parse(p.image_urls||'[]'), amenities: JSON.parse(p.amenities||'[]') })));
});

// Public: property detail (FR 3.3)
router.get('/:id', (req, res) => {
  const p = getDb().prepare('SELECT p.*,u.name as landlord_name,u.phone as landlord_phone,u.email as landlord_email FROM properties p JOIN users u ON p.landlord_id=u.id WHERE p.id=?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Property not found' });
  res.json({ ...p, image_urls: JSON.parse(p.image_urls||'[]'), amenities: JSON.parse(p.amenities||'[]') });
});

// FR 2.1 – Create listing
router.post('/', authenticateToken, requireRole('landlord','admin'), upload.array('images',6), (req, res) => {
  const { title, description, location, district, price, rooms, property_type, amenities } = req.body;
  if (!title||!location||!district||!price||!rooms) return res.status(400).json({ error: 'title, location, district, price, rooms required' });
  const imgs = req.files ? req.files.map(f => `/uploads/properties/${f.filename}`) : [];
  const r = getDb().prepare('INSERT INTO properties (landlord_id,title,description,location,district,price,rooms,property_type,amenities,image_urls) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(req.user.id,title,description||'',location,district,Number(price),Number(rooms),property_type||'apartment',amenities?JSON.stringify(JSON.parse(amenities)):'[]',JSON.stringify(imgs));
  const p = getDb().prepare('SELECT * FROM properties WHERE id=?').get(r.lastInsertRowid);
  res.status(201).json({ message: 'Property listed', property: { ...p, image_urls: JSON.parse(p.image_urls), amenities: JSON.parse(p.amenities||'[]') } });
});

// FR 2.3 – Edit listing
router.put('/:id', authenticateToken, requireRole('landlord','admin'), upload.array('images',6), (req, res) => {
  const db = getDb();
  const p = db.prepare('SELECT * FROM properties WHERE id=?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  if (p.landlord_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
  const { title,description,location,district,price,rooms,property_type,amenities,is_available } = req.body;
  let imgs = JSON.parse(p.image_urls||'[]');
  if (req.files?.length) imgs = [...imgs, ...req.files.map(f => `/uploads/properties/${f.filename}`)];
  const avail = is_available !== undefined ? (is_available==='true'||is_available===true?1:0) : p.is_available;
  db.prepare('UPDATE properties SET title=?,description=?,location=?,district=?,price=?,rooms=?,property_type=?,amenities=?,image_urls=?,is_available=? WHERE id=?')
    .run(title||p.title,description||p.description,location||p.location,district||p.district,Number(price)||p.price,Number(rooms)||p.rooms,property_type||p.property_type,amenities?JSON.stringify(JSON.parse(amenities)):p.amenities,JSON.stringify(imgs),avail,req.params.id);
  const updated = db.prepare('SELECT * FROM properties WHERE id=?').get(req.params.id);
  res.json({ message: 'Updated', property: { ...updated, image_urls: JSON.parse(updated.image_urls), amenities: JSON.parse(updated.amenities||'[]') } });
});

// FR 2.4 – Deactivate listing
router.delete('/:id', authenticateToken, requireRole('landlord','admin'), (req, res) => {
  const db = getDb();
  const p = db.prepare('SELECT * FROM properties WHERE id=?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  if (p.landlord_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
  db.prepare('UPDATE properties SET is_available=0 WHERE id=?').run(req.params.id);
  res.json({ message: 'Property deactivated' });
});

module.exports = router;
