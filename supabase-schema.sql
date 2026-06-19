-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS claims (
  id SERIAL PRIMARY KEY,
  claim_number TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  insurance_type TEXT NOT NULL,
  insurer_name TEXT NOT NULL,
  date_of_loss TEXT NOT NULL,
  date_reported TEXT NOT NULL,
  claim_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  last_update_date TEXT NOT NULL,
  settlement_amount NUMERIC,
  settlement_date TEXT,
  remarks TEXT
);

CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  claim_id INTEGER NOT NULL REFERENCES claims (id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users (id),
  activity TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  claim_id INTEGER NOT NULL REFERENCES claims (id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  upload_date TEXT NOT NULL
);

-- Seed initial data
INSERT INTO users (name, role, email, password) VALUES 
  ('Admin User', 'Admin', 'admin@broker.com', 'password123'),
  ('Broker Staff', 'Broker Staff', 'staff@broker.com', 'password123'),
  ('Supervisor', 'Supervisor', 'supervisor@broker.com', 'password123')
ON CONFLICT (email) DO NOTHING;

INSERT INTO claims (
  claim_number, client_name, policy_number, insurance_type, insurer_name,
  date_of_loss, date_reported, claim_amount, currency, status, last_update_date, remarks
) VALUES 
  ('CLM-2026-0001', 'Acme Corp', 'POL-12345', 'Marine Cargo', 'Allianz', '2026-03-01', '2026-03-05', 50000, 'USD', 'Claim Registered', NOW(), 'Initial report received.'),
  ('CLM-2026-0002', 'Global Logistics', 'POL-67890', 'Property', 'Zurich', '2026-02-15', '2026-02-20', 120000, 'USD', 'Under Assessment', NOW(), 'Awaiting surveyor report.'),
  ('CLM-2026-0003', 'Tech Solutions', 'POL-11121', 'Liability', 'AIG', '2025-12-10', '2025-12-15', 75000, 'USD', 'Document Pending', NOW(), 'Missing police report.'),
  ('CLM-2026-0004', 'Health Plus', 'POL-33344', 'Health', 'Cigna', '2026-01-05', '2026-01-10', 5000, 'USD', 'Claim Settled', NOW(), 'Settlement paid.')
ON CONFLICT (claim_number) DO NOTHING;

-- Update the settled claim
UPDATE claims SET settlement_amount = 4500, settlement_date = '2026-02-28' WHERE claim_number = 'CLM-2026-0004';

INSERT INTO activities (claim_id, date, user_id, activity, notes) VALUES 
  (1, NOW(), 2, 'Claim Registered', 'Claim opened by broker staff.'),
  (2, NOW(), 2, 'Status Updated', 'Changed to Under Assessment.'),
  (3, NOW(), 2, 'Follow up', 'Requested police report from client.'),
  (4, NOW(), 2, 'Settlement Received', 'Claim settled for $4,500.');
