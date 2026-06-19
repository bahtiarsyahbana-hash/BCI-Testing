-- Reference schema for the local SQLite-backed app.

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

