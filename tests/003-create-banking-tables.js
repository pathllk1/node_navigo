/**
 * Migration Script: Create Banking Tables
 * Creates tables for bank account and transaction management
 */

import { db } from '../server/utils/db.js';

console.log('Starting migration: Create Banking Tables...');

try {
  // Start transaction
  db.exec('BEGIN TRANSACTION');

  // 1. Create bank_accounts table
  console.log('Creating bank_accounts table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firm_id INTEGER NOT NULL,
      bank_name TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_no TEXT NOT NULL,
      ifsc_code TEXT,
      branch TEXT,
      account_type TEXT CHECK(account_type IN ('SAVINGS', 'CURRENT', 'OD', 'CC')) DEFAULT 'CURRENT',
      opening_balance REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      status TEXT CHECK(status IN ('Active', 'Inactive')) DEFAULT 'Active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
      UNIQUE(firm_id, account_no)
    ) STRICT;
  `);

  // 2. Create bank_transactions table
  console.log('Creating bank_transactions table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS bank_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firm_id INTEGER NOT NULL,
      bank_account_id INTEGER NOT NULL,
      transaction_date TEXT NOT NULL,
      transaction_type TEXT CHECK(transaction_type IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER')) NOT NULL,
      amount REAL NOT NULL,
      balance_after REAL NOT NULL,
      ref_type TEXT CHECK(ref_type IN ('VOUCHER', 'BILL', 'MANUAL')),
      ref_id INTEGER,
      ref_no TEXT,
      narration TEXT,
      cheque_no TEXT,
      cheque_date TEXT,
      transfer_to_account_id INTEGER,
      reconciled INTEGER DEFAULT 0,
      reconciled_date TEXT,
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
      FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (transfer_to_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
    ) STRICT;
  `);

  // Create indexes for performance
  console.log('Creating indexes...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bank_accounts_firm_id 
    ON bank_accounts(firm_id);

    CREATE INDEX IF NOT EXISTS idx_bank_accounts_status 
    ON bank_accounts(status);

    CREATE INDEX IF NOT EXISTS idx_bank_transactions_firm_id 
    ON bank_transactions(firm_id);

    CREATE INDEX IF NOT EXISTS idx_bank_transactions_bank_account_id 
    ON bank_transactions(bank_account_id);

    CREATE INDEX IF NOT EXISTS idx_bank_transactions_transaction_date 
    ON bank_transactions(transaction_date);

    CREATE INDEX IF NOT EXISTS idx_bank_transactions_transaction_type 
    ON bank_transactions(transaction_type);

    CREATE INDEX IF NOT EXISTS idx_bank_transactions_ref 
    ON bank_transactions(ref_type, ref_id);

    CREATE INDEX IF NOT EXISTS idx_bank_transactions_reconciled 
    ON bank_transactions(reconciled);
  `);

  // Commit transaction
  db.exec('COMMIT');

  console.log('✅ Migration completed successfully: Banking Tables');
  process.exit(0);

} catch (error) {
  // Rollback on error
  db.exec('ROLLBACK');
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
