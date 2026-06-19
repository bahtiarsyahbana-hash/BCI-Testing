import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');
const databaseProvider = (process.env.DATABASE_PROVIDER || 'sqlite').toLowerCase();

const dataDir = path.resolve(process.env.DATA_DIR || 'data');
const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
const dbPath = path.resolve(process.env.DATABASE_PATH || path.join(dataDir, 'app.db'));

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

type Row = Record<string, any>;

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      claim_number TEXT UNIQUE NOT NULL,
      client_name TEXT NOT NULL,
      policy_number TEXT NOT NULL,
      insurance_type TEXT NOT NULL,
      insurer_name TEXT NOT NULL,
      date_of_loss TEXT NOT NULL,
      date_reported TEXT NOT NULL,
      claim_amount REAL NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT 'On Broker',
      last_update_date TEXT NOT NULL,
      settlement_amount REAL,
      settlement_date TEXT,
      remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      claim_id INTEGER NOT NULL REFERENCES claims (id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users (id),
      activity TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      claim_id INTEGER NOT NULL REFERENCES claims (id) ON DELETE CASCADE,
      document_type TEXT NOT NULL,
      filename TEXT NOT NULL,
      url TEXT NOT NULL,
      storage_path TEXT,
      upload_date TEXT NOT NULL
    );
  `);

  const claimColumns = db.prepare('PRAGMA table_info(claims)').all().map((column: Row) => column.name);
  if (!claimColumns.includes('label')) {
    db.exec("ALTER TABLE claims ADD COLUMN label TEXT NOT NULL DEFAULT 'On Broker'");
  }

  const documentColumns = db.prepare('PRAGMA table_info(documents)').all().map((column: Row) => column.name);
  if (!documentColumns.includes('storage_path')) {
    db.exec('ALTER TABLE documents ADD COLUMN storage_path TEXT');
  }

  const seed = db.transaction(() => {
    const now = new Date().toISOString();

    const addUser = db.prepare(`
      INSERT OR IGNORE INTO users (id, name, role, email, password)
      VALUES (?, ?, ?, ?, ?)
    `);
    addUser.run(1, 'Admin User', 'Superadmin', 'admin@broker.com', 'password123');
    addUser.run(2, 'Broker Staff', 'Broker Staff', 'staff@broker.com', 'password123');
    addUser.run(3, 'Supervisor', 'Supervisor', 'supervisor@broker.com', 'password123');

    const addClaim = db.prepare(`
      INSERT OR IGNORE INTO claims (
        id, claim_number, client_name, policy_number, insurance_type, insurer_name,
        date_of_loss, date_reported, claim_amount, currency, status, label,
        last_update_date, settlement_amount, settlement_date, remarks
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    addClaim.run(1, 'CLM-2026-0001', 'Acme Corp', 'POL-12345', 'Marine Cargo', 'Allianz', '2026-03-01', '2026-03-05', 50000, 'USD', 'Claim Registered', 'On Broker', now, null, null, 'Initial report received.');
    addClaim.run(2, 'CLM-2026-0002', 'Global Logistics', 'POL-67890', 'Property', 'Zurich', '2026-02-15', '2026-02-20', 120000, 'USD', 'Under Assessment', 'On Insurer', now, null, null, 'Awaiting surveyor report.');
    addClaim.run(3, 'CLM-2026-0003', 'Tech Solutions', 'POL-11121', 'Liability', 'AIG', '2025-12-10', '2025-12-15', 75000, 'USD', 'Document Pending', 'On Insured', now, null, null, 'Missing police report.');
    addClaim.run(4, 'CLM-2026-0004', 'Health Plus', 'POL-33344', 'Health', 'Cigna', '2026-01-05', '2026-01-10', 5000, 'USD', 'Claim Settled', 'Settled', now, 4500, '2026-02-28', 'Settlement paid.');

    const existingActivities = db.prepare('SELECT COUNT(*) AS count FROM activities').get() as Row;
    if (existingActivities.count === 0) {
      const addActivity = db.prepare(`
        INSERT INTO activities (claim_id, date, user_id, activity, notes)
        VALUES (?, ?, ?, ?, ?)
      `);
      addActivity.run(1, now, 2, 'Claim Registered', 'Claim opened by broker staff.');
      addActivity.run(2, now, 2, 'Status Updated', 'Changed to Under Assessment.');
      addActivity.run(3, now, 2, 'Follow up', 'Requested police report from client.');
      addActivity.run(4, now, 2, 'Settlement Received', 'Claim settled for $4,500.');
    }
  });

  seed();
}

function groupChart(rows: Row[], key: string) {
  const chartMap: Record<string, number> = {};
  rows.forEach((row) => {
    const value = row[key] || 'Unknown';
    chartMap[value] = (chartMap[value] || 0) + 1;
  });
  return Object.entries(chartMap).map(([name, value]) => ({ name, value }));
}

function saveUploadedFile(claimId: string, file: Express.Multer.File) {
  const claimUploadDir = path.join(uploadDir, claimId);
  fs.mkdirSync(claimUploadDir, { recursive: true });

  const originalExt = path.extname(file.originalname);
  const safeExt = originalExt.replace(/[^a-zA-Z0-9.]/g, '') || '.bin';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`;
  const storagePath = path.join(claimUploadDir, fileName);
  fs.writeFileSync(storagePath, file.buffer);

  return {
    storagePath,
    url: `/uploads/${claimId}/${fileName}`,
  };
}

initializeDatabase();

const storage = multer.memoryStorage();
const upload = multer({ storage });

function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('DATABASE_PROVIDER=supabase requires SUPABASE_URL and SUPABASE_ANON_KEY.');
  }

  return createClient(supabaseUrl, supabaseKey);
}

function registerSupabaseRoutes(app: express.Express, supabase: SupabaseClient) {
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { data: user, error } = await supabase.from('users')
      .select('id, name, email, role')
      .eq('email', normalizedEmail)
      .eq('password', password)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({ user });
  });

  app.get('/api/dashboard', async (req, res) => {
    try {
      const { count: totalActive } = await supabase.from('claims')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("Claim Settled","Claim Closed","Claim Rejected","Deleted")');

      const { count: settled } = await supabase.from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Claim Settled');

      const { count: underReview } = await supabase.from('claims')
        .select('*', { count: 'exact', head: true })
        .in('status', ['Under Assessment', 'Under Insurer Review']);

      const { count: rejected } = await supabase.from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Claim Rejected');

      const { data: claims } = await supabase.from('claims')
        .select('label, status, insurer_name, insurance_type')
        .neq('status', 'Deleted');

      let onInsurer = 0;
      let onBroker = 0;
      let onInsured = 0;
      let settledCount = 0;
      let closedCancel = 0;

      (claims || []).forEach((claim) => {
        const label = claim.label || 'On Broker';
        if (label === 'On Insurer') onInsurer++;
        else if (label === 'On Broker') onBroker++;
        else if (label === 'On Insured') onInsured++;
        else if (label === 'Settled') settledCount++;
        else if (label === 'Closed/Cancel') closedCancel++;
      });

      res.json({
        metrics: {
          totalActive: totalActive || 0,
          settled: settled || 0,
          underReview: underReview || 0,
          delayed: onInsurer + onBroker + onInsured,
          rejected: rejected || 0,
        },
        label: { onInsurer, onBroker, onInsured, settled: settledCount, closedCancel },
        charts: {
          statusChart: groupChart(claims || [], 'status'),
          insurerChart: groupChart(claims || [], 'insurer_name'),
          typeChart: groupChart(claims || [], 'insurance_type'),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  app.get('/api/claims', async (req, res) => {
    const { data, error } = await supabase.from('claims')
      .select('*')
      .neq('status', 'Deleted')
      .order('id', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.get('/api/claims/:id', async (req, res) => {
    const { data: claim, error: claimError } = await supabase.from('claims')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (claimError || !claim) return res.status(404).json({ error: 'Claim not found' });

    const { data: activitiesData } = await supabase.from('activities')
      .select('*')
      .eq('claim_id', req.params.id)
      .order('date', { ascending: false });

    const { data: usersData } = await supabase.from('users').select('id, name');
    const userMap = new Map((usersData || []).map((user) => [user.id, user.name]));

    const activities = (activitiesData || []).map((activity) => ({
      ...activity,
      user_name: userMap.get(activity.user_id) || 'Unknown User',
    }));

    const { data: documents } = await supabase.from('documents')
      .select('*')
      .eq('claim_id', req.params.id)
      .order('upload_date', { ascending: false });

    res.json({ claim, activities, documents: documents || [] });
  });

  app.post('/api/claims', async (req, res) => {
    try {
      const { client_name, policy_number, insurance_type, insurer_name, date_of_loss, date_reported, claim_amount, currency, remarks, user_id, label } = req.body;

      const dateObj = new Date();
      const year = dateObj.getFullYear();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const monthYear = `${month}${year}`;

      const { data: lastClaimData } = await supabase.from('claims')
        .select('claim_number')
        .like('claim_number', `BCI-CLM-${monthYear}-%`)
        .order('claim_number', { ascending: false })
        .limit(1);

      const lastClaim = lastClaimData && lastClaimData.length > 0 ? lastClaimData[0] : null;
      let nextNum = '0001';
      if (lastClaim) {
        const lastNum = Number(lastClaim.claim_number.split('-')[3]);
        nextNum = String(lastNum + 1).padStart(4, '0');
      }

      const claim_number = `BCI-CLM-${monthYear}-${nextNum}`;
      const status = 'Claim Registered';
      const last_update_date = new Date().toISOString();

      const { data: newClaim, error } = await supabase.from('claims').insert([{
        claim_number,
        client_name,
        policy_number,
        insurance_type,
        insurer_name,
        date_of_loss,
        date_reported,
        claim_amount,
        currency,
        status,
        last_update_date,
        remarks,
        label: label || 'On Broker',
      }]).select().single();

      if (error) throw error;

      await supabase.from('activities').insert([{
        claim_id: newClaim.id,
        date: last_update_date,
        user_id: user_id || 2,
        activity: 'Claim Registered',
        notes: 'New claim created.',
      }]);

      res.json({ id: newClaim.id, claim_number });
    } catch (error: any) {
      console.error('Error creating claim in server:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.put('/api/claims/:id/amount', async (req, res) => {
    const { claim_amount, currency, user_id } = req.body;
    const last_update_date = new Date().toISOString();
    const updateData: any = { claim_amount, last_update_date };
    let notes = `Claim amount updated to ${claim_amount}`;

    if (currency) {
      updateData.currency = currency;
      notes = `Claim amount updated to ${claim_amount} ${currency}`;
    }

    const { error } = await supabase.from('claims').update(updateData).eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });

    await supabase.from('activities').insert([{
      claim_id: req.params.id,
      date: last_update_date,
      user_id: user_id || 2,
      activity: 'Amount Updated',
      notes,
    }]);

    res.json({ success: true });
  });

  app.put('/api/claims/:id/status', async (req, res) => {
    const { status, label, notes, user_id, settlement_amount } = req.body;
    const last_update_date = new Date().toISOString();
    const updateData: any = { last_update_date };

    if (status) updateData.status = status;
    if (label) updateData.label = label;
    if (settlement_amount !== undefined) {
      updateData.settlement_amount = settlement_amount;
      if (status === 'Claim Settled') updateData.settlement_date = last_update_date.split('T')[0];
    }

    const { error } = await supabase.from('claims').update(updateData).eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });

    let activityNote = notes || '';
    if (!activityNote) {
      if (status && label) activityNote = `Status changed to ${status}, Label changed to ${label}`;
      else if (status) activityNote = `Status changed to ${status}`;
      else if (label) activityNote = `Label changed to ${label}`;
    }

    await supabase.from('activities').insert([{
      claim_id: req.params.id,
      date: last_update_date,
      user_id: user_id || 2,
      activity: 'Status/Label Updated',
      notes: activityNote,
    }]);

    res.json({ success: true });
  });

  app.post('/api/claims/:id/documents', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
      const { document_type } = req.body;
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${req.params.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const url = publicUrlData.publicUrl;
      const upload_date = new Date().toISOString();

      await supabase.from('documents').insert([{
        claim_id: req.params.id,
        document_type,
        filename: req.file.originalname,
        url,
        upload_date,
      }]);

      await supabase.from('activities').insert([{
        claim_id: req.params.id,
        date: upload_date,
        user_id: 2,
        activity: 'Document Uploaded',
        notes: `Uploaded ${document_type}: ${req.file.originalname}`,
      }]);

      res.json({ success: true, url });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload document' });
    }
  });

  app.post('/api/claims/:id/activities', async (req, res) => {
    const { activity, notes, user_id } = req.body;
    const date = new Date().toISOString();

    const { error } = await supabase.from('activities').insert([{
      claim_id: req.params.id,
      date,
      user_id: user_id || 2,
      activity: activity || 'Note Added',
      notes,
    }]);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete('/api/claims/:id', async (req, res) => {
    try {
      const last_update_date = new Date().toISOString();
      const { error } = await supabase.from('claims').update({ status: 'Deleted', last_update_date }).eq('id', req.params.id);
      if (error) throw error;

      await supabase.from('activities').insert([{
        claim_id: req.params.id,
        date: last_update_date,
        user_id: 2,
        activity: 'Claim Deleted',
        notes: 'Claim was soft deleted.',
      }]);

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting claim:', error);
      res.status(500).json({ error: 'Failed to delete claim' });
    }
  });

  app.delete('/api/documents/:id', async (req, res) => {
    try {
      const { data: doc } = await supabase.from('documents').select('*').eq('id', req.params.id).single();
      if (doc) {
        const urlParts = doc.url.split('/public/documents/');
        if (urlParts.length > 1) {
          await supabase.storage.from('documents').remove([urlParts[1]]);
        }

        await supabase.from('documents').delete().eq('id', req.params.id);
        await supabase.from('activities').insert([{
          claim_id: doc.claim_id,
          date: new Date().toISOString(),
          user_id: 2,
          activity: 'Document Deleted',
          notes: `Deleted ${doc.document_type}: ${doc.filename}`,
        }]);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  });

  app.post('/api/admin/reset', async (req, res) => {
    res.status(403).json({ error: 'Database reset is disabled.' });
  });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json());

  if (databaseProvider === 'supabase') {
    registerSupabaseRoutes(app, createSupabaseClient());
  } else {
    app.use('/uploads', express.static(uploadDir));

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare(`
      SELECT id, name, email, role
      FROM users
      WHERE email = ? AND password = ?
    `).get(normalizedEmail, password) as Row | undefined;

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({ user });
  });

  app.get('/api/dashboard', (req, res) => {
    try {
      const totalActive = (db.prepare(`
        SELECT COUNT(*) AS count FROM claims
        WHERE status NOT IN ('Claim Settled','Claim Closed','Claim Rejected','Deleted')
      `).get() as Row).count;
      const settled = (db.prepare("SELECT COUNT(*) AS count FROM claims WHERE status = 'Claim Settled'").get() as Row).count;
      const underReview = (db.prepare(`
        SELECT COUNT(*) AS count FROM claims
        WHERE status IN ('Under Assessment', 'Under Insurer Review')
      `).get() as Row).count;
      const rejected = (db.prepare("SELECT COUNT(*) AS count FROM claims WHERE status = 'Claim Rejected'").get() as Row).count;

      const claims = db.prepare("SELECT label, status, insurer_name, insurance_type FROM claims WHERE status != 'Deleted'").all() as Row[];
      let onInsurer = 0;
      let onBroker = 0;
      let onInsured = 0;
      let settledCount = 0;
      let closedCancel = 0;

      claims.forEach((claim) => {
        const label = claim.label || 'On Broker';
        if (label === 'On Insurer') onInsurer++;
        else if (label === 'On Broker') onBroker++;
        else if (label === 'On Insured') onInsured++;
        else if (label === 'Settled') settledCount++;
        else if (label === 'Closed/Cancel') closedCancel++;
      });

      res.json({
        metrics: {
          totalActive,
          settled,
          underReview,
          delayed: onInsurer + onBroker + onInsured,
          rejected,
        },
        label: { onInsurer, onBroker, onInsured, settled: settledCount, closedCancel },
        charts: {
          statusChart: groupChart(claims, 'status'),
          insurerChart: groupChart(claims, 'insurer_name'),
          typeChart: groupChart(claims, 'insurance_type'),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  app.get('/api/claims', (req, res) => {
    const claims = db.prepare("SELECT * FROM claims WHERE status != 'Deleted' ORDER BY id DESC").all();
    res.json(claims);
  });

  app.get('/api/claims/:id', (req, res) => {
    const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id) as Row | undefined;
    if (!claim) return res.status(404).json({ error: 'Claim not found' });

    const activities = db.prepare(`
      SELECT activities.*, COALESCE(users.name, 'Unknown User') AS user_name
      FROM activities
      LEFT JOIN users ON users.id = activities.user_id
      WHERE activities.claim_id = ?
      ORDER BY activities.date DESC
    `).all(req.params.id);

    const documents = db.prepare(`
      SELECT id, claim_id, document_type, filename, url, upload_date
      FROM documents
      WHERE claim_id = ?
      ORDER BY upload_date DESC
    `).all(req.params.id);

    res.json({ claim, activities, documents });
  });

  app.post('/api/claims', (req, res) => {
    try {
      const {
        client_name,
        policy_number,
        insurance_type,
        insurer_name,
        date_of_loss,
        date_reported,
        claim_amount,
        currency,
        remarks,
        user_id,
        label,
      } = req.body;

      const dateObj = new Date();
      const year = dateObj.getFullYear();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const monthYear = `${month}${year}`;
      const lastClaim = db.prepare(`
        SELECT claim_number FROM claims
        WHERE claim_number LIKE ?
        ORDER BY claim_number DESC
        LIMIT 1
      `).get(`BCI-CLM-${monthYear}-%`) as Row | undefined;

      let nextNum = '0001';
      if (lastClaim) {
        const lastNum = Number(lastClaim.claim_number.split('-')[3]);
        nextNum = String(lastNum + 1).padStart(4, '0');
      }

      const claim_number = `BCI-CLM-${monthYear}-${nextNum}`;
      const status = 'Claim Registered';
      const last_update_date = new Date().toISOString();

      const createClaim = db.transaction(() => {
        const result = db.prepare(`
          INSERT INTO claims (
            claim_number, client_name, policy_number, insurance_type, insurer_name,
            date_of_loss, date_reported, claim_amount, currency, status,
            last_update_date, remarks, label
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          claim_number,
          client_name,
          policy_number,
          insurance_type,
          insurer_name,
          date_of_loss,
          date_reported,
          Number(claim_amount),
          currency,
          status,
          last_update_date,
          remarks || null,
          label || 'On Broker',
        );

        db.prepare(`
          INSERT INTO activities (claim_id, date, user_id, activity, notes)
          VALUES (?, ?, ?, ?, ?)
        `).run(result.lastInsertRowid, last_update_date, user_id || 2, 'Claim Registered', 'New claim created.');

        return result.lastInsertRowid;
      });

      const id = createClaim();
      res.json({ id, claim_number });
    } catch (error: any) {
      console.error('Error creating claim in server:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.put('/api/claims/:id/amount', (req, res) => {
    const { claim_amount, currency, user_id } = req.body;
    const last_update_date = new Date().toISOString();
    const amount = Number(claim_amount);
    const notes = currency ? `Claim amount updated to ${amount} ${currency}` : `Claim amount updated to ${amount}`;

    const updateClaim = db.transaction(() => {
      db.prepare(`
        UPDATE claims
        SET claim_amount = ?, currency = COALESCE(?, currency), last_update_date = ?
        WHERE id = ?
      `).run(amount, currency || null, last_update_date, req.params.id);

      db.prepare(`
        INSERT INTO activities (claim_id, date, user_id, activity, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(req.params.id, last_update_date, user_id || 2, 'Amount Updated', notes);
    });

    updateClaim();
    res.json({ success: true });
  });

  app.put('/api/claims/:id/status', (req, res) => {
    const { status, label, notes, user_id, settlement_amount } = req.body;
    const last_update_date = new Date().toISOString();
    const settlementDate = settlement_amount !== undefined && status === 'Claim Settled'
      ? last_update_date.split('T')[0]
      : null;

    let activityNote = notes || '';
    if (!activityNote) {
      if (status && label) activityNote = `Status changed to ${status}, Label changed to ${label}`;
      else if (status) activityNote = `Status changed to ${status}`;
      else if (label) activityNote = `Label changed to ${label}`;
    }

    const updateStatus = db.transaction(() => {
      db.prepare(`
        UPDATE claims
        SET
          status = COALESCE(?, status),
          label = COALESCE(?, label),
          settlement_amount = COALESCE(?, settlement_amount),
          settlement_date = COALESCE(?, settlement_date),
          last_update_date = ?
        WHERE id = ?
      `).run(
        status || null,
        label || null,
        settlement_amount !== undefined ? Number(settlement_amount) : null,
        settlementDate,
        last_update_date,
        req.params.id,
      );

      db.prepare(`
        INSERT INTO activities (claim_id, date, user_id, activity, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(req.params.id, last_update_date, user_id || 2, 'Status/Label Updated', activityNote);
    });

    updateStatus();
    res.json({ success: true });
  });

  app.post('/api/claims/:id/documents', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
      const { document_type } = req.body;
      const { storagePath, url } = saveUploadedFile(req.params.id, req.file);
      const upload_date = new Date().toISOString();

      const addDocument = db.transaction(() => {
        db.prepare(`
          INSERT INTO documents (claim_id, document_type, filename, url, storage_path, upload_date)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(req.params.id, document_type, req.file?.originalname, url, storagePath, upload_date);

        db.prepare(`
          INSERT INTO activities (claim_id, date, user_id, activity, notes)
          VALUES (?, ?, ?, ?, ?)
        `).run(req.params.id, upload_date, 2, 'Document Uploaded', `Uploaded ${document_type}: ${req.file?.originalname}`);
      });

      addDocument();
      res.json({ success: true, url });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload document' });
    }
  });

  app.post('/api/claims/:id/activities', (req, res) => {
    const { activity, notes, user_id } = req.body;
    const date = new Date().toISOString();

    db.prepare(`
      INSERT INTO activities (claim_id, date, user_id, activity, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.params.id, date, user_id || 2, activity || 'Note Added', notes || null);

    res.json({ success: true });
  });

  app.delete('/api/claims/:id', (req, res) => {
    try {
      const last_update_date = new Date().toISOString();
      const deleteClaim = db.transaction(() => {
        db.prepare("UPDATE claims SET status = 'Deleted', last_update_date = ? WHERE id = ?").run(last_update_date, req.params.id);
        db.prepare(`
          INSERT INTO activities (claim_id, date, user_id, activity, notes)
          VALUES (?, ?, ?, ?, ?)
        `).run(req.params.id, last_update_date, 2, 'Claim Deleted', 'Claim was soft deleted.');
      });

      deleteClaim();
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting claim:', error);
      res.status(500).json({ error: 'Failed to delete claim' });
    }
  });

  app.delete('/api/documents/:id', (req, res) => {
    try {
      const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as Row | undefined;
      if (doc) {
        if (doc.storage_path && fs.existsSync(doc.storage_path)) {
          fs.unlinkSync(doc.storage_path);
        }

        const deleteDocument = db.transaction(() => {
          db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
          db.prepare(`
            INSERT INTO activities (claim_id, date, user_id, activity, notes)
            VALUES (?, ?, ?, ?, ?)
          `).run(doc.claim_id, new Date().toISOString(), 2, 'Document Deleted', `Deleted ${doc.document_type}: ${doc.filename}`);
        });

        deleteDocument();
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  });

  app.post('/api/admin/reset', (req, res) => {
    res.status(403).json({ error: 'Database reset is disabled.' });
  });
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (databaseProvider === 'supabase') {
      console.log('Using Supabase database provider');
    } else {
      console.log(`Using local SQLite database at ${dbPath}`);
    }
  });
}

startServer();
