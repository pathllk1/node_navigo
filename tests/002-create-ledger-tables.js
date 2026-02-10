/**
 * Migration Script: Create Ledger Tables
 * Creates tables for ledger and voucher management
 */

import { db } from '../server/utils/db.js';

console.log('Starting migration: Create Ledger Tables...');

try {
  // Start transaction
  db.exec('BEGIN TRANSACTION');

  // 1. Create ledger table (double-entry bookkeeping)
  console.log('Creating ledger table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firm_id INTEGER NOT NULL,
      entry_date TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_type TEXT CHECK(account_type IN (
        'SUNDRY_DEBTORS', 'SUNDRY_CREDITORS', 'BANK', 'CASH',
        'SALES', 'PURCHASE', 'EXPENSES', 'INCOME',
        'DUTIES_TAXES', 'ASSETS', 'LIABILITIES', 'CAPITAL'
      )) NOT NULL,
      debit REAL DEFAULT 0,
      credit REAL DEFAULT 0,
      narration TEXT,
      ref_type TEXT CHECK(ref_type IN ('BILL', 'VOUCHER', 'OPENING', 'ADJUSTMENT')),
      ref_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE
    ) STRICT;
  `);

  // 2. Create vouchers table (payment/receipt/journal)
  console.log('Creating vouchers table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firm_id INTEGER NOT NULL,
      voucher_no TEXT NOT NULL,
      voucher_type TEXT CHECK(voucher_type IN ('PAYMENT', 'RECEIPT', 'JOURNAL')) NOT NULL,
      voucher_date TEXT NOT NULL,
      amount REAL NOT NULL,
      narration TEXT,
      paid_from_account TEXT,
      paid_from_type TEXT,
      paid_to_account TEXT,
      paid_to_type TEXT,
      received_in_account TEXT,
      received_in_type TEXT,
      received_from_account TEXT,
      received_from_type TEXT,
      journal_entries TEXT,
      payment_mode TEXT CHECK(payment_mode IN ('CASH', 'CHEQUE', 'NEFT', 'RTGS', 'UPI', 'OTHER')),
      cheque_no TEXT,
      cheque_date TEXT,
      bank_name TEXT,
      status TEXT CHECK(status IN ('Draft', 'Posted', 'Cancelled')) DEFAULT 'Posted',
      created_by INTEGER NOT NULL,
      updated_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT,
      UNIQUE(firm_id, voucher_no)
    ) STRICT;
  `);

  // Create indexes for performance
  console.log('Creating indexes...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ledger_firm_id 
    ON ledger(firm_id);

    CREATE INDEX IF NOT EXISTS idx_ledger_entry_date 
    ON ledger(entry_date);

    CREATE INDEX IF NOT EXISTS idx_ledger_account_name 
    ON ledger(account_name);

    CREATE INDEX IF NOT EXISTS idx_ledger_account_type 
    ON ledger(account_type);

    CREATE INDEX IF NOT EXISTS idx_ledger_ref 
    ON ledger(ref_type, ref_id);

    CREATE INDEX IF NOT EXISTS idx_vouchers_firm_id 
    ON vouchers(firm_id);

    CREATE INDEX IF NOT EXISTS idx_vouchers_voucher_type 
    ON vouchers(voucher_type);

    CREATE INDEX IF NOT EXISTS idx_vouchers_voucher_date 
    ON vouchers(voucher_date);

    CREATE INDEX IF NOT EXISTS idx_vouchers_status 
    ON vouchers(status);
  `);

  // Commit transaction
  db.exec('COMMIT');

  console.log('✅ Migration completed successfully: Ledger Tables');
  process.exit(0);

} catch (error) {
  // Rollback on error
  db.exec('ROLLBACK');
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
