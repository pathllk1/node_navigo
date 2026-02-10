/**
 * Migration Script: Create Settings Tables
 * Creates tables for firm settings and global settings
 */

import { db } from '../server/utils/db.js';

console.log('Starting migration: Create Settings Tables...');

try {
  // Start transaction
  db.exec('BEGIN TRANSACTION');

  // 1. Create firm_settings table
  console.log('Creating firm_settings table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS firm_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firm_id INTEGER NOT NULL,
      gstin TEXT,
      pan TEXT,
      tan TEXT,
      cin TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      state_code INTEGER,
      pincode TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      logo_url TEXT,
      invoice_prefix TEXT,
      invoice_terms TEXT,
      bank_details TEXT,
      financial_year_start TEXT DEFAULT '04-01',
      gst_enabled INTEGER DEFAULT 1,
      cess_enabled INTEGER DEFAULT 0,
      tds_enabled INTEGER DEFAULT 0,
      multi_currency INTEGER DEFAULT 0,
      decimal_places INTEGER DEFAULT 2,
      date_format TEXT DEFAULT 'DD-MM-YYYY',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
      UNIQUE(firm_id)
    ) STRICT;
  `);

  // 2. Create settings table (global settings)
  console.log('Creating settings table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT NOT NULL UNIQUE,
      setting_value TEXT,
      setting_type TEXT CHECK(setting_type IN ('STRING', 'NUMBER', 'BOOLEAN', 'JSON')) DEFAULT 'STRING',
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    ) STRICT;
  `);

  // 3. Create migrations_log table (track migrations)
  console.log('Creating migrations_log table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_name TEXT NOT NULL UNIQUE,
      executed_at TEXT DEFAULT (datetime('now')),
      status TEXT CHECK(status IN ('SUCCESS', 'FAILED')) DEFAULT 'SUCCESS',
      error_message TEXT
    ) STRICT;
  `);

  // Insert default settings
  console.log('Inserting default settings...');
  db.exec(`
    INSERT OR IGNORE INTO settings (setting_key, setting_value, setting_type, description)
    VALUES 
      ('app_name', 'Business Management System', 'STRING', 'Application name'),
      ('app_version', '1.0.0', 'STRING', 'Application version'),
      ('maintenance_mode', '0', 'BOOLEAN', 'Enable maintenance mode'),
      ('max_upload_size', '10485760', 'NUMBER', 'Max file upload size in bytes (10MB)'),
      ('session_timeout', '3600', 'NUMBER', 'Session timeout in seconds (1 hour)'),
      ('backup_enabled', '1', 'BOOLEAN', 'Enable automatic backups'),
      ('backup_frequency', 'daily', 'STRING', 'Backup frequency (daily, weekly, monthly)'),
      ('email_notifications', '1', 'BOOLEAN', 'Enable email notifications'),
      ('sms_notifications', '0', 'BOOLEAN', 'Enable SMS notifications');
  `);

  // Log this migration
  console.log('Logging migration...');
  db.exec(`
    INSERT OR IGNORE INTO migrations_log (migration_name, status)
    VALUES ('004-create-settings-tables', 'SUCCESS');
  `);

  // Create indexes for performance
  console.log('Creating indexes...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_firm_settings_firm_id 
    ON firm_settings(firm_id);

    CREATE INDEX IF NOT EXISTS idx_settings_setting_key 
    ON settings(setting_key);

    CREATE INDEX IF NOT EXISTS idx_migrations_log_migration_name 
    ON migrations_log(migration_name);
  `);

  // Commit transaction
  db.exec('COMMIT');

  console.log('✅ Migration completed successfully: Settings Tables');
  process.exit(0);

} catch (error) {
  // Rollback on error
  db.exec('ROLLBACK');
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
