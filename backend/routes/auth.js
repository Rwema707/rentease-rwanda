const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { getDb } = require('../database/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !phone || !password || !role)
    return res.status(400).json({ error: 'All fields are required' });
  if (!['tenant','landlord'].includes(role))
    return res.status(400).json({ error: 'Role must be tenant or landlord' });
  const db = getDb();
  if (db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase()))
    return res.status(409).json({ error: 'Email already registered' });
  if (db.prepare('SELECT id FROM users WHERE phone=?').get(phone))
    return res.status(409).json({ error: 'Phone already registered' });
  const hash = await bcrypt.hash(password, 12);
  const token = Math.random().toString(36).substring(2,8).toUpperCase();
  const r = db.prepare('INSERT INTO users (name,email,phone,password,role,verification_token,is_verified) VALUES (?,?,?,?,?,?,?)')
    .run(name, email.toLowerCase(), phone, hash, role, token, 1);
  db.prepare('INSERT INTO notifications (user_id,type,title,message) VALUES (?,?,?,?)')
    .run(r.lastInsertRowid,'system','Welcome to RentEase Rwanda!',`Hello ${name}! Your account is ready. Verification code: ${token}`);
  const jwt_token = jwt.sign({ userId: r.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' });
  const user = db.prepare('SELECT id,name,email,phone,role,is_verified FROM users WHERE id=?').get(r.lastInsertRowid);
  res.status(201).json({ message: 'Account created', token: jwt_token, user });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  if (!await bcrypt.compare(password, user.password))
    return res.status(401).json({ error: 'Invalid email or password' });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, verification_token: __, ...safe } = user;
  res.json({ message: 'Login successful', token, user: safe });
});

router.post('/verify', authenticateToken, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (user.is_verified) return res.json({ message: 'Already verified' });
  if (user.verification_token !== req.body.token)
    return res.status(400).json({ error: 'Invalid verification code' });
  db.prepare('UPDATE users SET is_verified=1 WHERE id=?').run(req.user.id);
  res.json({ message: 'Account verified' });
});

router.get('/me', authenticateToken, (req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT id,name,email,phone,role,is_verified,bank_details,created_at FROM users WHERE id=?').get(req.user.id));
});

router.put('/profile', authenticateToken, (req, res) => {
  const { name, phone, bank_details } = req.body;
  const db = getDb();
  db.prepare('UPDATE users SET name=?,phone=?,bank_details=? WHERE id=?')
    .run(name||req.user.name, phone||req.user.phone, bank_details||null, req.user.id);
  const u = db.prepare('SELECT id,name,email,phone,role,is_verified,bank_details FROM users WHERE id=?').get(req.user.id);
  res.json({ message: 'Profile updated', user: u });
});

router.put('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!await bcrypt.compare(currentPassword, user.password))
    return res.status(400).json({ error: 'Current password incorrect' });
  db.prepare('UPDATE users SET password=? WHERE id=?').run(await bcrypt.hash(newPassword, 12), req.user.id);
  res.json({ message: 'Password updated' });
});

module.exports = router;
