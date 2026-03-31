/**
 * ANNADAAN CONNECT — BACKEND SERVER
 * backend/server.js
 *
 * Stack : Node.js + Express + MySQL2
 * Start : node backend/server.js
 *         (or: npm start from project root)
 */

const express    = require('express');
const mysql      = require('mysql2/promise');
const bcrypt     = require('bcrypt');
const cors       = require('cors');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

/* =============================================
   DATABASE CONFIGURATION
   ============================================= */
const dbConfig = {
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || 'karan@456',   // your MySQL password
  database: process.env.DB_NAME     || 'annadaan_connect',
  waitForConnections: true,
  connectionLimit:    10,
  charset: 'utf8mb4'
};

let pool;

async function initDB() {
  pool = mysql.createPool(dbConfig);
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
}

/* =============================================
   MIDDLEWARE
   ============================================= */
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..')));

/* =============================================
   HELPER
   ============================================= */
function apiError(res, status, message) {
  return res.status(status).json({ success: false, message });
}

function apiOk(res, data = {}) {
  return res.json({ success: true, ...data });
}

/* =============================================
   ROUTES — AUTH
   ============================================= */

/**
 * POST /api/register
 * Body: { first_name, last_name, email, phone, city, password, role, ngo_name? }
 */
app.post('/api/register', async (req, res) => {
  const { first_name, last_name, email, phone, city, password, role = 'event_host', ngo_name = null } = req.body;

  if (!first_name || !last_name || !email || !phone || !city || !password) {
    return apiError(res, 400, 'All fields are required.');
  }
  if (password.length < 8) {
    return apiError(res, 400, 'Password must be at least 8 characters.');
  }

  try {
    // Check duplicate email
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return apiError(res, 409, 'An account with this email already exists.');
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (first_name, last_name, email, phone, city, password, role, ngo_name) VALUES (?,?,?,?,?,?,?,?)',
      [first_name, last_name, email, phone, city, hashed, role, ngo_name]
    );

    // If role is NGO, also create NGO record
    if (role === 'ngo' && ngo_name) {
      await pool.query(
        'INSERT INTO ngos (user_id, ngo_name, contact_person, phone, email, city) VALUES (?,?,?,?,?,?)',
        [result.insertId, ngo_name, `${first_name} ${last_name}`, phone, email, city]
      );
    }

    return apiOk(res, { message: 'Account created successfully!', userId: result.insertId });
  } catch (err) {
    console.error('[register]', err);
    return apiError(res, 500, 'Server error. Please try again.');
  }
});

/**
 * POST /api/login
 * Body: { email, password }
 */
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return apiError(res, 400, 'Email and password are required.');
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return apiError(res, 401, 'Invalid email or password.');
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return apiError(res, 401, 'Invalid email or password.');
    }

    return apiOk(res, {
      message: 'Login successful!',
      user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role, city: user.city }
    });
  } catch (err) {
    console.error('[login]', err);
    return apiError(res, 500, 'Server error. Please try again.');
  }
});

/* =============================================
   ROUTES — NGOs
   ============================================= */

/**
 * GET /api/ngos
 * Returns all active NGOs
 */
app.get('/api/ngos', async (req, res) => {
  try {
    const [ngos] = await pool.query(
      'SELECT id, ngo_name, city, operating_areas, daily_capacity FROM ngos WHERE is_active = 1 ORDER BY ngo_name'
    );
    return apiOk(res, { ngos });
  } catch (err) {
    console.error('[ngos]', err);
    return apiError(res, 500, 'Could not fetch NGOs.');
  }
});

/**
 * POST /api/ngos/register
 * Body: { ngo_name, registration_no, contact_person, phone, email, city, daily_capacity }
 */
app.post('/api/ngos/register', async (req, res) => {
  const { ngo_name, registration_no, contact_person, phone, email, city, daily_capacity = 0 } = req.body;

  if (!ngo_name || !contact_person || !phone || !city) {
    return apiError(res, 400, 'NGO name, contact person, phone and city are required.');
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO ngos (ngo_name, registration_no, contact_person, phone, email, city, daily_capacity) VALUES (?,?,?,?,?,?,?)',
      [ngo_name, registration_no || null, contact_person, phone, email || null, city, daily_capacity]
    );
    return apiOk(res, { message: 'NGO application submitted! We will verify and contact you.', ngoId: result.insertId });
  } catch (err) {
    console.error('[ngo-register]', err);
    return apiError(res, 500, 'Server error. Please try again.');
  }
});

/* =============================================
   ROUTES — FOOD ALERTS
   ============================================= */

/**
 * POST /api/alert
 * Body: { name, phone, event_type, event_datetime, venue, quantity, food_type, message, ngo_ids[] }
 */
app.post('/api/alert', async (req, res) => {
  const {
    name, phone, event_type, event_datetime,
    venue, quantity, food_type, message = '', ngo_ids = []
  } = req.body;

  if (!name || !phone || !event_type || !venue || !quantity || !food_type) {
    return apiError(res, 400, 'Please fill all required fields.');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert alert
    const [alertResult] = await conn.query(
      `INSERT INTO food_alerts (name, phone, event_type, event_datetime, venue, quantity, food_type, message)
       VALUES (?,?,?,?,?,?,?,?)`,
      [name, phone, event_type, event_datetime || null, venue, quantity, food_type, message]
    );
    const alertId = alertResult.insertId;

    // Link selected NGOs
    if (Array.isArray(ngo_ids) && ngo_ids.length > 0) {
      const validIds = ngo_ids.filter(id => id && !isNaN(id));
      if (validIds.length > 0) {
        const vals = validIds.map(id => [alertId, parseInt(id)]);
        await conn.query('INSERT IGNORE INTO alert_ngos (alert_id, ngo_id) VALUES ?', [vals]);
      }
    } else {
      // If no specific NGOs chosen, notify all active NGOs
      const [allNgos] = await conn.query('SELECT id FROM ngos WHERE is_active = 1');
      if (allNgos.length > 0) {
        const vals = allNgos.map(n => [alertId, n.id]);
        await conn.query('INSERT IGNORE INTO alert_ngos (alert_id, ngo_id) VALUES ?', [vals]);
      }
    }

    await conn.commit();
    return apiOk(res, { message: 'Alert sent to NGOs successfully!', alertId });
  } catch (err) {
    await conn.rollback();
    console.error('[alert]', err);
    return apiError(res, 500, 'Failed to send alert. Please try again.');
  } finally {
    conn.release();
  }
});

/**
 * GET /api/alerts
 * Returns all food alerts with their NGO assignments
 */
app.get('/api/alerts', async (req, res) => {
  try {
    const [alerts] = await pool.query(
      `SELECT fa.*, GROUP_CONCAT(n.ngo_name SEPARATOR ', ') AS notified_ngos
       FROM food_alerts fa
       LEFT JOIN alert_ngos an ON fa.id = an.alert_id
       LEFT JOIN ngos n ON an.ngo_id = n.id
       GROUP BY fa.id
       ORDER BY fa.created_at DESC`
    );
    return apiOk(res, { alerts });
  } catch (err) {
    console.error('[alerts]', err);
    return apiError(res, 500, 'Could not fetch alerts.');
  }
});

/**
 * PATCH /api/alerts/:id/status
 * Body: { status }
 */
app.patch('/api/alerts/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending','accepted','collected','completed','cancelled'];
  if (!validStatuses.includes(status)) {
    return apiError(res, 400, 'Invalid status value.');
  }
  try {
    await pool.query('UPDATE food_alerts SET status = ? WHERE id = ?', [status, id]);
    return apiOk(res, { message: 'Alert status updated.' });
  } catch (err) {
    console.error('[alert-status]', err);
    return apiError(res, 500, 'Could not update status.');
  }
});

/* =============================================
   HEALTH CHECK
   ============================================= */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), app: 'Annadaan Connect' });
});

/* =============================================
   FALLBACK — Serve index.html for all routes
   ============================================= */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

/* =============================================
   START SERVER
   ============================================= */
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🍱 Annadaan Connect Server running on http://localhost:${PORT}`);
    console.log(`📋 API Docs:`);
    console.log(`   POST /api/register    — Create account`);
    console.log(`   POST /api/login       — Login`);
    console.log(`   GET  /api/ngos        — List all NGOs`);
    console.log(`   POST /api/ngos/register — Register new NGO`);
    console.log(`   POST /api/alert       — Send food alert`);
    console.log(`   GET  /api/alerts      — List all alerts`);
    console.log(`   GET  /api/health      — Health check\n`);
  });
});
