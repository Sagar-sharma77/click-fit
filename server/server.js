/* =========================================================
   ClickFit — upload backend
   ========================================================= */
const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const pool = require('./db');

const app  = express();
const PORT = 3000;

// --- Where uploads go: ../upload_images (sibling of /server) ---
const UPLOAD_DIR = path.join(__dirname, '..', 'upload_images');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// --- CORS: allow the Live Server origin ---
app.use(cors());                 // wide-open for dev; tighten later

// --- Serve the uploaded images back to the browser ---
app.use('/uploads', express.static(UPLOAD_DIR));

// --- Multer storage config ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // keep the extension, generate a safe unique name
    const ext  = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
                     .replace(/[^a-z0-9_-]/gi, '_')
                     .slice(0, 40);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${base}-${unique}${ext}`);
  }
});

// --- Multer file filter: images only ---
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },   // 5 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files are allowed.'));
  }
});

// --- The upload endpoint ---
// `upload.single('image')` must match the FormData field name on the frontend
app.post('/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file received.' });
    }
    res.json({
      ok: true,
      filename: req.file.filename,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`,
      url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
    });
  });
});

// --- Simple health check ---
app.get('/', (req, res) => res.send('ClickFit upload server is running.'));

// --- Global error handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error.' });
});

app.listen(PORT, () => {
  console.log(`✅ Upload server running at http://localhost:${PORT}`);
  console.log(`   Saving images to: ${UPLOAD_DIR}`);
});
// ---------- GET /users — list all users (no passwords!) ----------
app.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT userId, email, type, active, createdAt FROM users ORDER BY userId DESC'
    );
    res.json({ ok: true, count: rows.length, users: rows });
  } catch (err) {
    console.error('GET /users failed:', err);
    res.status(500).json({ error: 'Database error.' });
  }
});

// ---------- POST /users — insert a user via the stored procedure ----------
app.post('/users', express.json(), async (req, res) => {
  const { email, password, type, active } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' });
  }

  try {
    // In a real app: hash `password` with bcrypt before storing!
    const [result] = await pool.query(
      'CALL addUser(?, ?, ?, ?, @newUserId)',
      [email, password, type || 'user', active === undefined ? 1 : active ? 1 : 0]
    );
    const [[{ newUserId }]] = await pool.query('SELECT @newUserId AS newUserId');

    res.json({ ok: true, userId: newUserId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered.' });
    }
    console.error('POST /users failed:', err);
    res.status(500).json({ error: 'Database error.' });
  }
});