const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'rentease.db');

let dbWrapper = null;

function flattenParams(params) {
  if (params.length === 1 && Array.isArray(params[0])) return params[0];
  return params.length > 0 ? params : [];
}

function buildRow(stmt) {
  const cols = stmt.getColumnNames();
  const vals = stmt.get();
  const row = {};
  cols.forEach((c, i) => (row[c] = vals[i]));
  return row;
}

function createWrapper(sqlDb) {
  function save() {
    try {
      const data = sqlDb.export();
      fs.writeFileSync(DB_PATH, Buffer.from(data));
    } catch (e) { console.error('DB save error:', e); }
  }

  return {
    exec(sql) { sqlDb.run(sql); save(); },

    prepare(sql) {
      return {
        run(...args) {
          const params = flattenParams(args);
          const stmt = sqlDb.prepare(sql);
          stmt.run(params);
          stmt.free();
          const res = sqlDb.exec('SELECT last_insert_rowid() as id, changes() as ch');
          save();
          const lastInsertRowid = res[0]?.values[0][0] ?? null;
          const changes = res[0]?.values[0][1] ?? 0;
          return { lastInsertRowid, changes };
        },
        get(...args) {
          const params = flattenParams(args);
          const stmt = sqlDb.prepare(sql);
          if (params.length) stmt.bind(params);
          const result = stmt.step() ? buildRow(stmt) : undefined;
          stmt.free();
          return result;
        },
        all(...args) {
          const params = flattenParams(args);
          const stmt = sqlDb.prepare(sql);
          if (params.length) stmt.bind(params);
          const rows = [];
          while (stmt.step()) rows.push(buildRow(stmt));
          stmt.free();
          return rows;
        }
      };
    }
  };
}

async function initializeDatabase() {
  const SQL = await initSqlJs();
  let sqlDb;
  if (fs.existsSync(DB_PATH)) {
    sqlDb = new SQL.Database(fs.readFileSync(DB_PATH));
    console.log('📂 Loaded existing database');
  } else {
    sqlDb = new SQL.Database();
    console.log('🆕 Created new database');
  }

  dbWrapper = createWrapper(sqlDb);

  dbWrapper.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'tenant', is_verified INTEGER DEFAULT 0,
      verification_token TEXT, bank_details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT, landlord_id INTEGER NOT NULL,
      title TEXT NOT NULL, description TEXT, location TEXT NOT NULL,
      district TEXT NOT NULL, price REAL NOT NULL, rooms INTEGER NOT NULL,
      property_type TEXT DEFAULT 'apartment', amenities TEXT DEFAULT '[]',
      is_available INTEGER DEFAULT 1, image_urls TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS rental_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT, property_id INTEGER NOT NULL,
      tenant_id INTEGER NOT NULL, landlord_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending', message TEXT, move_in_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS tenancies (
      id INTEGER PRIMARY KEY AUTOINCREMENT, property_id INTEGER NOT NULL,
      tenant_id INTEGER NOT NULL, landlord_id INTEGER NOT NULL,
      start_date TEXT NOT NULL, rent_due_day INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT, tenancy_id INTEGER NOT NULL,
      tenant_id INTEGER NOT NULL, landlord_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL, amount REAL NOT NULL,
      payment_method TEXT NOT NULL, status TEXT DEFAULT 'pending',
      transaction_id TEXT, receipt_number TEXT, month_covered TEXT,
      notes TEXT, paid_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
      type TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0, related_id INTEGER, related_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS maintenance_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT, property_id INTEGER NOT NULL,
      tenant_id INTEGER NOT NULL, landlord_id INTEGER NOT NULL,
      title TEXT NOT NULL, description TEXT NOT NULL,
      priority TEXT DEFAULT 'medium', status TEXT DEFAULT 'pending',
      landlord_notes TEXT, images TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed admin
  const admin = dbWrapper.prepare("SELECT id FROM users WHERE role='admin'").get();
  if (!admin) {
    const hash = bcrypt.hashSync('admin123', 10);
    dbWrapper.prepare('INSERT INTO users (name,email,phone,password,role,is_verified) VALUES (?,?,?,?,?,?)')
      .run('Administrator','admin@rentease.rw','+250780000000',hash,'admin',1);
    console.log('✅ Admin: admin@rentease.rw / admin123');
  }

  // Seed demo landlord + tenant + properties
  const propCount = dbWrapper.prepare('SELECT COUNT(*) as c FROM properties').get();
  if (propCount.c === 0) {
    const lHash = bcrypt.hashSync('landlord123', 10);
    const tHash = bcrypt.hashSync('tenant123', 10);
    const l = dbWrapper.prepare('INSERT INTO users (name,email,phone,password,role,is_verified) VALUES (?,?,?,?,?,?)')
      .run('Jean Paul Uwimana','landlord@rentease.rw','+250788123456',lHash,'landlord',1);
    dbWrapper.prepare('INSERT INTO users (name,email,phone,password,role,is_verified) VALUES (?,?,?,?,?,?)')
      .run('Marie Claire Ingabire','tenant@rentease.rw','+250788654321',tHash,'tenant',1);
    const lid = l.lastInsertRowid;
    const props = [
      [lid,'Modern 2BR Apartment – Kacyiru','Spacious modern apartment with city views. WiFi & 24/7 security included.','Kacyiru','Gasabo',250000,2,'apartment','["WiFi","Water","Electricity","Security","Parking"]'],
      [lid,'Cozy Studio – Nyamirambo','Furnished studio perfect for young professionals near the city center.','Nyamirambo','Nyarugenge',120000,1,'studio','["WiFi","Water","Electricity","Furnished"]'],
      [lid,'3BR Family House – Remera','Spacious family home with garden, parking and safe neighborhood.','Remera','Gasabo',380000,3,'house','["Parking","Garden","Water","Electricity","Security","DSTV"]'],
      [lid,'Luxury Apartment – Kimihurura','Premium finishes, generator backup, close to embassies & Kigali Convention Centre.','Kimihurura','Gasabo',650000,3,'apartment','["WiFi","Generator","Parking","Security","Furnished","DSTV"]'],
      [lid,'Affordable 1BR – Kicukiro','Well-located near main bus stop, close to shopping centers.','Kicukiro Center','Kicukiro',90000,1,'apartment','["Water","Electricity"]'],
      [lid,'2BR House – Huye City','Quiet residential area near University of Rwanda campus.','Huye Center','Huye',180000,2,'house','["Water","Electricity","Garden","Parking"]'],
    ];
    for (const p of props) {
      dbWrapper.prepare('INSERT INTO properties (landlord_id,title,description,location,district,price,rooms,property_type,amenities) VALUES (?,?,?,?,?,?,?,?,?)').run(...p);
    }
    console.log('✅ Demo accounts: landlord@rentease.rw / landlord123 | tenant@rentease.rw / tenant123');
    console.log('✅ 6 sample properties seeded');
  }

  console.log('✅ Database initialized successfully\n');
  return dbWrapper;
}

const dbReady = initializeDatabase();

function getDb() {
  if (!dbWrapper) throw new Error('Database not ready yet');
  return dbWrapper;
}

module.exports = { getDb, dbReady };
