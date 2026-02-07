import { db } from './db.js';

/**
 * Migration: Add firm_id to master_rolls table for multi-firm support
 */

console.log('🔄 Running migration: Add firm_id to master_rolls...');

try {
  // Check if firm_id column already exists
  const tableInfo = db.prepare("PRAGMA table_info(master_rolls)").all();
  const hasFirmId = tableInfo.some(col => col.name === 'firm_id');

  if (hasFirmId) {
    console.log('✅ firm_id column already exists in master_rolls table');
  } else {
    console.log('📝 Adding firm_id column to master_rolls table...');
    
    // SQLite doesn't support adding foreign key constraints to existing tables easily
    // We need to recreate the table
    
    db.exec(`
      -- Create new table with firm_id and user tracking
      CREATE TABLE master_rolls_new (
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
        created_by INTEGER,
        updated_by INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
      ) STRICT;

      -- Copy existing data (if any) - assign to first firm and first user
      INSERT INTO master_rolls_new (
        id, firm_id, employee_name, father_husband_name, date_of_birth,
        aadhar, pan, phone_no, address, bank, account_no, ifsc,
        uan, esic_no, s_kalyan_no, category, p_day_wage,
        project, site, date_of_joining, date_of_exit, doe_rem,
        created_by, updated_by, created_at, updated_at
      )
      SELECT 
        id, 
        (SELECT id FROM firms ORDER BY id LIMIT 1) as firm_id,
        employee_name, father_husband_name, date_of_birth,
        aadhar, pan, phone_no, address, bank, account_no, ifsc,
        uan, esic_no, s_kalyan_no, category, p_day_wage,
        project, site, date_of_joining, date_of_exit, doe_rem,
        (SELECT id FROM users ORDER BY id LIMIT 1) as created_by,
        (SELECT id FROM users ORDER BY id LIMIT 1) as updated_by,
        created_at, updated_at
      FROM master_rolls;

      -- Drop old table
      DROP TABLE master_rolls;

      -- Rename new table
      ALTER TABLE master_rolls_new RENAME TO master_rolls;

      -- Recreate unique index on aadhar with firm_id
      CREATE UNIQUE INDEX idx_master_rolls_aadhar_firm ON master_rolls(aadhar, firm_id);
    `);

    console.log('✅ Successfully added firm_id to master_rolls');
    console.log('ℹ️  Existing records assigned to first firm');
  }

  // Also update wages table if it doesn't have firm_id
  const wagesTableInfo = db.prepare("PRAGMA table_info(wages)").all();
  const wagesHasFirmId = wagesTableInfo.some(col => col.name === 'firm_id');

  if (!wagesHasFirmId) {
    console.log('📝 Adding firm_id column to wages table...');
    
    db.exec(`
      -- Create new wages table with firm_id
      CREATE TABLE wages_new (
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
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
        FOREIGN KEY (master_roll_id) REFERENCES master_rolls(id) ON DELETE CASCADE
      ) STRICT;

      -- Copy existing data
      INSERT INTO wages_new (
        id, firm_id, master_roll_id, p_day_wage, wage_days, project, site,
        gross_salary, epf_deduction, esic_deduction, other_deduction,
        other_benefit, net_salary, salary_month, paid_date, cheque_no,
        paid_from_bank_ac, created_at, updated_at
      )
      SELECT 
        w.id,
        (SELECT firm_id FROM master_rolls WHERE id = w.master_roll_id) as firm_id,
        w.master_roll_id, w.p_day_wage, w.wage_days, w.project, w.site,
        w.gross_salary, w.epf_deduction, w.esic_deduction, w.other_deduction,
        w.other_benefit, w.net_salary, w.salary_month, w.paid_date, w.cheque_no,
        w.paid_from_bank_ac, w.created_at, w.updated_at
      FROM wages w;

      -- Drop old table
      DROP TABLE wages;

      -- Rename new table
      ALTER TABLE wages_new RENAME TO wages;
    `);

    console.log('✅ Successfully added firm_id to wages');
  }

  console.log('🎉 Migration completed successfully!');
} catch (err) {
  console.error('❌ Migration failed:', err);
  throw err;
}