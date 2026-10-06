import Database, { type Database as DatabaseType } from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = path.resolve(__dirname, "../../data");
const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(DEFAULT_DATA_DIR, "cold-dialer.db");
const DATA_DIR = path.dirname(DB_PATH);

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db: DatabaseType = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL COLLATE NOCASE,
    password_hash TEXT,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent', 'manager')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'outbound' CHECK (type IN ('outbound', 'inbound', 'blended')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    settings TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'not_interested', 'callback', 'converted', 'do_not_contact')),
    source TEXT,
    campaign_id TEXT,
    assigned_to TEXT,
    tags TEXT,
    notes TEXT,
    dnc INTEGER NOT NULL DEFAULT 0,
    whatsapp_consent INTEGER NOT NULL DEFAULT 0,
    whatsapp_consent_at TEXT,
    last_called_at TEXT,
    call_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS call_scripts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT,
    content TEXT,
    objection_responses TEXT,
    campaign_id TEXT,
    created_by TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS call_logs (
    id TEXT PRIMARY KEY,
    lead_id TEXT,
    user_id TEXT,
    campaign_id TEXT,
    direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound')),
    outcome TEXT NOT NULL CHECK (outcome IN ('no_answer', 'answered', 'busy', 'voicemail', 'dnc', 'wrong_number', 'disconnected')),
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    recording_url TEXT,
    notes TEXT,
    transcript TEXT,
    sip_call_id TEXT,
    started_at TEXT,
    ended_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    scheduled_at TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    type TEXT NOT NULL CHECK (type IN ('sales_call', 'demo', 'follow_up', 'consultation', 'check_in')),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS dnc_list (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    reason TEXT,
    source TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
  CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(campaign_id);
  CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
  CREATE INDEX IF NOT EXISTS idx_call_logs_lead ON call_logs(lead_id);
  CREATE INDEX IF NOT EXISTS idx_call_logs_user ON call_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_appointments_lead ON appointments(lead_id);
  CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);
  CREATE INDEX IF NOT EXISTS idx_dnc_phone ON dnc_list(phone);
`);

// SQLite does not support ADD COLUMN IF NOT EXISTS. Inspect the schema first so
// installations created before password_hash was introduced retain all data.
const profileColumns = db
  .prepare("PRAGMA table_info(profiles)")
  .all() as Array<{ name: string }>;

if (!profileColumns.some((column) => column.name === "password_hash")) {
  db.exec("ALTER TABLE profiles ADD COLUMN password_hash TEXT");
}

const leadColumns = db
  .prepare("PRAGMA table_info(leads)")
  .all() as Array<{ name: string }>;

if (!leadColumns.some((column) => column.name === "whatsapp_consent")) {
  db.exec("ALTER TABLE leads ADD COLUMN whatsapp_consent INTEGER NOT NULL DEFAULT 0");
}

if (!leadColumns.some((column) => column.name === "whatsapp_consent_at")) {
  db.exec("ALTER TABLE leads ADD COLUMN whatsapp_consent_at TEXT");
}

// New databases enforce one account per normalized email. Add the same
// constraint to legacy databases when their existing data permits it; never
// discard profiles merely to create the index.
const duplicateEmail = db
  .prepare(
    "SELECT 1 FROM profiles GROUP BY email COLLATE NOCASE HAVING COUNT(*) > 1 LIMIT 1"
  )
  .get();

if (!duplicateEmail) {
  db.exec(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique ON profiles(email COLLATE NOCASE)"
  );
} else {
  console.warn(
    "profiles contains duplicate email addresses; resolve them before a unique email index can be enforced"
  );
}

export default db;
