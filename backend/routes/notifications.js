const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const notifs = db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  const unread = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id=? AND is_read=0').get(req.user.id);
  res.json({ notifications: notifs, unread_count: unread.c });
});

router.put('/read', authenticateToken, (req, res) => {
  const db = getDb();
  const { ids } = req.body;
  if (ids?.length) ids.forEach(id => db.prepare('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?').run(id, req.user.id));
  else db.prepare('UPDATE notifications SET is_read=1 WHERE user_id=?').run(req.user.id);
  res.json({ message: 'Marked read' });
});

router.delete('/:id', authenticateToken, (req, res) => {
  getDb().prepare('DELETE FROM notifications WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ message: 'Deleted' });
});

// FR 6.1, 6.2 – Landlord manual reminder
router.post('/send-reminder', authenticateToken, (req, res) => {
  if (!['landlord','admin'].includes(req.user.role)) return res.status(403).json({ error: 'Landlords only' });
  const { tenant_id, message } = req.body;
  getDb().prepare('INSERT INTO notifications (user_id,type,title,message) VALUES (?,?,?,?)')
    .run(tenant_id,'rent_reminder','📅 Rent Reminder',message||'Your landlord reminds you that rent is due. Please pay on time.');
  res.json({ message: 'Reminder sent' });
});

// FR 6.1 – Automated daily reminder cron
function scheduleRentReminders() {
  cron.schedule('0 8 * * *', () => {
    console.log('⏰ Running rent reminders...');
    try {
      const db = getDb();
      const tenancies = db.prepare(`SELECT t.*,p.title as ptitle,p.price as rent,u.name as tname FROM tenancies t JOIN properties p ON t.property_id=p.id JOIN users u ON t.tenant_id=u.id WHERE t.is_active=1`).all();
      const today = new Date();
      for (const t of tenancies) {
        const due = new Date(today.getFullYear(), today.getMonth(), t.rent_due_day||1);
        const days = Math.ceil((due-today)/(1000*60*60*24));
        if (days<=3 && days>=0) {
          const month = today.toISOString().substring(0,7);
          const paid = db.prepare("SELECT id FROM payments WHERE tenancy_id=? AND month_covered=? AND status='completed'").get(t.id, month);
          const alreadySent = db.prepare("SELECT id FROM notifications WHERE user_id=? AND type='rent_reminder' AND created_at>=date('now','-1 day')").get(t.tenant_id);
          if (!paid && !alreadySent) {
            db.prepare('INSERT INTO notifications (user_id,type,title,message) VALUES (?,?,?,?)')
              .run(t.tenant_id,'rent_reminder','📅 Rent Due Reminder',`Rent of RWF ${Number(t.rent).toLocaleString()} for "${t.ptitle}" is due in ${days} day(s).`);
          }
        }
      }
    } catch(e) { console.error('Reminder error:', e); }
  });
  console.log('⏰ Rent reminders scheduled (daily 8AM)');
}

module.exports = { router, scheduleRentReminders };
