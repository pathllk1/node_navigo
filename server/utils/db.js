'use strict';

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

/* --------------------------------------------------
   DB INIT
-------------------------------------------------- */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// database file at: server/data.sqlite
const dbPath = path.join(__dirname, '..', 'data.sqlite');

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* --------------------------------------------------
   SCHEMA - WITH MULTI-FIRM SUPPORT
-------------------------------------------------- */

db.exec(`
-- FIRMS
CREATE TABLE IF NOT EXISTS firms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT CHECK(status IN ('pending','approved','rejected')) DEFAULT 'approved',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  fullname TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK(role IN ('user','manager','admin')) DEFAULT 'user',
  firm_id INTEGER NOT NULL,
  last_mail_sent TEXT,
  last_login TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE
) STRICT;

-- REFRESH TOKENS
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) STRICT;

-- MASTER ROLLS (WITH FIRM_ID AND USER TRACKING)
CREATE TABLE IF NOT EXISTS master_rolls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firm_id INTEGER NOT NULL,
  employee_name TEXT NOT NULL,
  father_husband_name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  aadhar TEXT NOT NULL,
  pan TEXT,
  phone_no TEXT NOT NULL,
  address TEXT NOT NULL,
  bank TEXT NOT NULL,
  account_no TEXT NOT NULL,
  ifsc TEXT NOT NULL,
  branch TEXT,
  uan TEXT,
  esic_no TEXT,
  s_kalyan_no TEXT,
  category TEXT DEFAULT 'UNSKILLED',
  p_day_wage REAL,
  project TEXT,
  site TEXT,
  date_of_joining TEXT NOT NULL,
  date_of_exit TEXT,
  doe_rem TEXT,
  status TEXT DEFAULT 'Active',
  created_by INTEGER,
  updated_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) STRICT;

-- WAGES (WITH FIRM_ID AND USER TRACKING)
CREATE TABLE IF NOT EXISTS wages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firm_id INTEGER NOT NULL,
  master_roll_id INTEGER NOT NULL,
  p_day_wage REAL,
  wage_days INTEGER DEFAULT 26,
  project TEXT,
  site TEXT,
  gross_salary REAL,
  epf_deduction REAL,
  esic_deduction REAL,
  other_deduction REAL,
  other_benefit REAL,
  net_salary REAL,
  salary_month TEXT NOT NULL,
  paid_date TEXT,
  cheque_no TEXT,
  paid_from_bank_ac TEXT,
  created_by INTEGER NOT NULL,
  updated_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
  FOREIGN KEY (master_roll_id) REFERENCES master_rolls(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT
) STRICT;

-- USER ↔ MASTER ROLL (MANY TO MANY) - Optional for assignment tracking
CREATE TABLE IF NOT EXISTS user_master_rolls (
  user_id INTEGER NOT NULL,
  master_roll_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, master_roll_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (master_roll_id) REFERENCES master_rolls(id) ON DELETE CASCADE
) STRICT;

-- USER ↔ WAGE (MANY TO MANY) - Optional for wage processing tracking
CREATE TABLE IF NOT EXISTS user_wages (
  user_id INTEGER NOT NULL,
  wage_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, wage_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (wage_id) REFERENCES wages(id) ON DELETE CASCADE
) STRICT;
`);

/* --------------------------------------------------
   INDEXES FOR PERFORMANCE
-------------------------------------------------- */



// Create indexes if they don't exist
db.exec(`
  -- Unique index on aadhar per firm (employee can't be duplicated within a firm)
  CREATE UNIQUE INDEX IF NOT EXISTS idx_master_rolls_aadhar_firm 
  ON master_rolls(aadhar, firm_id);

  -- Index on firm_id for faster filtering
  CREATE INDEX IF NOT EXISTS idx_master_rolls_firm_id 
  ON master_rolls(firm_id);

  -- Index on wages firm_id
  CREATE INDEX IF NOT EXISTS idx_wages_firm_id 
  ON wages(firm_id);

  -- Compound index on wages for efficient month-based queries
  CREATE INDEX IF NOT EXISTS idx_wages_firm_month 
  ON wages(firm_id, salary_month);

  -- Unique constraint on wages (firm_id, master_roll_id, salary_month)
  CREATE UNIQUE INDEX IF NOT EXISTS idx_wages_unique_firm_employee_month 
  ON wages(firm_id, master_roll_id, salary_month);

  -- Index on wages master_roll_id
  CREATE INDEX IF NOT EXISTS idx_wages_master_roll_id 
  ON wages(master_roll_id);

  -- Index on master_rolls dates for wage eligibility queries
  CREATE INDEX IF NOT EXISTS idx_master_rolls_joining_date 
  ON master_rolls(date_of_joining);

  CREATE INDEX IF NOT EXISTS idx_master_rolls_exit_date 
  ON master_rolls(date_of_exit);

  -- Index on users firm_id
  CREATE INDEX IF NOT EXISTS idx_users_firm_id 
  ON users(firm_id);

  -- Index on refresh tokens for cleanup
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id 
  ON refresh_tokens(user_id);

  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at 
  ON refresh_tokens(expires_at);

  -- Full-text search indexes (optional - for better search performance)
  CREATE INDEX IF NOT EXISTS idx_master_rolls_employee_name 
  ON master_rolls(employee_name);

  CREATE INDEX IF NOT EXISTS idx_master_rolls_project 
  ON master_rolls(project);

  CREATE INDEX IF NOT EXISTS idx_master_rolls_site 
  ON master_rolls(site);
`);


/* --------------------------------------------------
   PREPARED STATEMENTS (UTILS)
-------------------------------------------------- */

/* ---------- FIRM ---------- */
export const Firm = {
  create: db.prepare(`
    INSERT INTO firms (name, code, description, status)
    VALUES (@name, @code, @description, @status)
  `),

  getById: db.prepare(`SELECT * FROM firms WHERE id = ?`),

  getByCode: db.prepare(`SELECT * FROM firms WHERE code = ?`),

  getAll: db.prepare(`SELECT * FROM firms ORDER BY created_at DESC`),

  updateStatus: db.prepare(`
    UPDATE firms 
    SET status = @status, updated_at = datetime('now')
    WHERE id = @id
  `)
};

/* ---------- USER ---------- */
export const User = {
  create: db.prepare(`
    INSERT INTO users (username, email, fullname, password, role, firm_id)
    VALUES (@username, @email, @fullname, @password, @role, @firm_id)
  `),

  getById: db.prepare(`
    SELECT u.*, f.name as firm_name, f.code as firm_code, f.status as firm_status
    FROM users u
    JOIN firms f ON f.id = u.firm_id
    WHERE u.id = ?
  `),

  getByEmail: db.prepare(`
    SELECT u.*, f.name as firm_name, f.code as firm_code, f.status as firm_status
    FROM users u
    JOIN firms f ON f.id = u.firm_id
    WHERE u.email = ?
  `),

  getByUsername: db.prepare(`
    SELECT u.*, f.name as firm_name, f.code as firm_code, f.status as firm_status
    FROM users u
    JOIN firms f ON f.id = u.firm_id
    WHERE u.username = ?
  `),

  updateLastLogin: db.prepare(`
    UPDATE users 
    SET last_login = datetime('now') 
    WHERE id = ?
  `)
};

/* ---------- MASTER ROLL ---------- */
export const MasterRoll = {
  create: db.prepare(`
    INSERT INTO master_rolls (
      firm_id,
      employee_name,
      father_husband_name,
      date_of_birth,
      aadhar,
      pan,
      phone_no,
      address,
      bank,
      account_no,
      ifsc,
      branch,
      uan,
      esic_no,
      s_kalyan_no,
      category,
      p_day_wage,
      project,
      site,
      date_of_joining,
      date_of_exit,
      doe_rem,
      status,
      created_by,
      updated_by
    ) VALUES (
      @firm_id,
      @employee_name,
      @father_husband_name,
      @date_of_birth,
      @aadhar,
      @pan,
      @phone_no,
      @address,
      @bank,
      @account_no,
      @ifsc,
      @branch,
      @uan,
      @esic_no,
      @s_kalyan_no,
      @category,
      @p_day_wage,
      @project,
      @site,
      @date_of_joining,
      @date_of_exit,
      @doe_rem,
      @status,
      @created_by,
      @updated_by
    )
  `),

  getById: db.prepare(`
    SELECT mr.*, f.name as firm_name, f.code as firm_code,
           cu.fullname as created_by_name, uu.fullname as updated_by_name
    FROM master_rolls mr
    JOIN firms f ON f.id = mr.firm_id
    LEFT JOIN users cu ON cu.id = mr.created_by
    LEFT JOIN users uu ON uu.id = mr.updated_by
    WHERE mr.id = ?
  `),

  getByFirm: db.prepare(`
    SELECT mr.*, f.name as firm_name, f.code as firm_code,
           cu.fullname as created_by_name, uu.fullname as updated_by_name
    FROM master_rolls mr
    JOIN firms f ON f.id = mr.firm_id
    LEFT JOIN users cu ON cu.id = mr.created_by
    LEFT JOIN users uu ON uu.id = mr.updated_by
    WHERE mr.firm_id = ?
    ORDER BY mr.created_at DESC
  `)

};

/* ---------- WAGE ---------- */
export const Wage = {
  create: db.prepare(`
    INSERT INTO wages (
      firm_id,
      master_roll_id,
      p_day_wage,
      wage_days,
      gross_salary,
      net_salary,
      salary_month,
      epf_deduction,
      esic_deduction,
      other_deduction,
      other_benefit
    ) VALUES (
      @firm_id,
      @master_roll_id,
      @p_day_wage,
      @wage_days,
      @gross_salary,
      @net_salary,
      @salary_month,
      @epf_deduction,
      @esic_deduction,
      @other_deduction,
      @other_benefit
    )
  `),

  getById: db.prepare(`
    SELECT w.*, mr.employee_name, mr.aadhar, f.name as firm_name
    FROM wages w
    JOIN master_rolls mr ON mr.id = w.master_roll_id
    JOIN firms f ON f.id = w.firm_id
    WHERE w.id = ? AND w.firm_id = ?
  `),

  getByFirm: db.prepare(`
    SELECT * FROM wages 
    WHERE firm_id = ?
    ORDER BY salary_month DESC, created_at DESC
  `),

  getByFirmAndMonth: db.prepare(`
    SELECT w.*, mr.employee_name, mr.aadhar
    FROM wages w
    JOIN master_rolls mr ON mr.id = w.master_roll_id
    WHERE w.firm_id = ? AND w.salary_month = ?
    ORDER BY mr.employee_name
  `),

  getLastWageForEmployee: db.prepare(`
    SELECT wage_days, gross_salary, salary_month
    FROM wages
    WHERE master_roll_id = ? AND firm_id = ?
    ORDER BY salary_month DESC
    LIMIT 1
  `),

  update: db.prepare(`
    UPDATE wages
    SET 
      p_day_wage = @p_day_wage,
      wage_days = @wage_days,
      gross_salary = @gross_salary,
      epf_deduction = @epf_deduction,
      esic_deduction = @esic_deduction,
      other_deduction = @other_deduction,
      other_benefit = @other_benefit,
      net_salary = @net_salary,
      updated_at = datetime('now')
    WHERE id = ? AND firm_id = ?
  `),

  delete: db.prepare(`
    DELETE FROM wages
    WHERE id = ? AND firm_id = ?
  `),

  checkExists: db.prepare(`
    SELECT id FROM wages
    WHERE firm_id = ? AND master_roll_id = ? AND salary_month = ?
  `),

  getBulkByIds: db.prepare(`
    SELECT * FROM wages
    WHERE id IN (SELECT id FROM wages WHERE firm_id = ?)
    ORDER BY salary_month DESC
  `)
};

/* --------------------------------------------------
   MANY TO MANY HELPERS
-------------------------------------------------- */

export const Relations = {
  assignUserToMasterRoll: db.prepare(`
    INSERT OR IGNORE INTO user_master_rolls (user_id, master_roll_id)
    VALUES (?, ?)
  `),

  assignUserToWage: db.prepare(`
    INSERT OR IGNORE INTO user_wages (user_id, wage_id)
    VALUES (?, ?)
  `),

  getMasterRollUsers: db.prepare(`
    SELECT u.*
    FROM users u
    JOIN user_master_rolls umr ON umr.user_id = u.id
    WHERE umr.master_roll_id = ?
  `),

  getUserWages: db.prepare(`
    SELECT w.*
    FROM wages w
    JOIN user_wages uw ON uw.wage_id = w.id
    WHERE uw.user_id = ?
  `)
};

console.log('✅ Database initialized with multi-firm support');