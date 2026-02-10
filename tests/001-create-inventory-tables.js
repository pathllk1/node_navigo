/**
 * Migration Script: Create Inventory Tables
 * Creates all necessary tables for inventory management system
 */

import { db } from '../server/utils/db.js';

console.log('Starting migration: Create Inventory Tables...');

try {
  // Start transaction
  db.exec('BEGIN TRANSACTION');

  // 1. Create bill_sequences table (for auto-incrementing bill numbers)
  console.log('Creating bill_sequences table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS bill_sequences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firm_id INTEGER NOT NULL,
      financial_year TEXT NOT NULL,
      last_sequence INTEGER DEFAULT 0,
      voucher_type TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
      UNIQUE(firm_id, financial_year, voucher_type)
    ) STRICT;
  `);

  // 2. Create parties table (customers/suppliers)
  console.log('Creating parties table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS parties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firm_id INTEGER NOT NULL,
      party_name TEXT NOT NULL,
      party_type TEXT CHECK(party_type IN ('CUSTOMER', 'SUPPLIER', 'BOTH')) DEFAULT 'CUSTOMER',
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      state_code INTEGER,
      pincode TEXT,
      pan TEXT,
      opening_balance REAL DEFAULT 0,
      balance_type TEXT CHECK(balance_type IN ('Dr', 'Cr')) DEFAULT 'Dr',
      credit_limit REAL DEFAULT 0,
      credit_days INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('Active', 'Inactive')) DEFAULT 'Active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE
    ) STRICT;
  `);

  // 3. Create party_gsts table (multiple GST support per party)
  console.log('Creating party_gsts table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS party_gsts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      party_id INTEGER NOT NULL,
      gstin TEXT NOT NULL,
      state TEXT NOT NULL,
      state_code INTEGER NOT NULL,
      address TEXT,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE
    ) STRICT;
  `);

  // 4. Create stocks table (inventory items)
  console.log('Creating stocks table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS stocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firm_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      item_code TEXT,
      hsn_code TEXT,
      unit TEXT DEFAULT 'PCS',
      category TEXT,
      opening_stock REAL DEFAULT 0,
      current_stock REAL DEFAULT 0,
      min_stock REAL DEFAULT 0,
      max_stock REAL DEFAULT 0,
      purchase_rate REAL DEFAULT 0,
      sale_rate REAL DEFAULT 0,
      gst_rate REAL DEFAULT 0,
      cess_rate REAL DEFAULT 0,
      description TEXT,
      status TEXT CHECK(status IN ('Active', 'Inactive')) DEFAULT 'Active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
      UNIQUE(firm_id, item_code)
    ) STRICT;
  `);

  // 5. Create bills table (sales/purchase/CN/DN/DLN)
  console.log('Creating bills table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firm_id INTEGER NOT NULL,
      bill_no TEXT NOT NULL,
      bill_type TEXT CHECK(bill_type IN ('SALES', 'PURCHASE', 'CREDIT_NOTE', 'DEBIT_NOTE', 'DELIVERY_NOTE')) NOT NULL,
      bill_date TEXT NOT NULL,
      due_date TEXT,
      party_id INTEGER NOT NULL,
      party_name TEXT NOT NULL,
      party_gstin TEXT,
      party_address TEXT,
      party_state_code INTEGER,
      gross_total REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      cgst REAL DEFAULT 0,
      sgst REAL DEFAULT 0,
      igst REAL DEFAULT 0,
      cess REAL DEFAULT 0,
      round_off REAL DEFAULT 0,
      net_total REAL DEFAULT 0,
      items_json TEXT NOT NULL,
      other_charges_json TEXT,
      terms_conditions TEXT,
      notes TEXT,
      status TEXT CHECK(status IN ('Draft', 'Pending', 'Paid', 'Cancelled')) DEFAULT 'Pending',
      payment_status TEXT CHECK(payment_status IN ('Unpaid', 'Partial', 'Paid')) DEFAULT 'Unpaid',
      paid_amount REAL DEFAULT 0,
      created_by INTEGER NOT NULL,
      updated_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
      FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE RESTRICT,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT,
      UNIQUE(firm_id, bill_no)
    ) STRICT;
  `);

  // 6. Create stock_reg table (stock movements/register)
  console.log('Creating stock_reg table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_reg (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firm_id INTEGER NOT NULL,
      stock_id INTEGER NOT NULL,
      ref_type TEXT CHECK(ref_type IN ('BILL', 'ADJUSTMENT', 'OPENING')) NOT NULL,
      ref_id INTEGER,
      ref_no TEXT,
      movement_date TEXT NOT NULL,
      movement_type TEXT CHECK(movement_type IN ('IN', 'OUT')) NOT NULL,
      qty REAL NOT NULL,
      rate REAL DEFAULT 0,
      amount REAL DEFAULT 0,
      balance_qty REAL NOT NULL,
      remarks TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
      FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE
    ) STRICT;
  `);

  // Create indexes for performance
  console.log('Creating indexes...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bill_sequences_firm_fy 
    ON bill_sequences(firm_id, financial_year);

    CREATE INDEX IF NOT EXISTS idx_parties_firm_id 
    ON parties(firm_id);

    CREATE INDEX IF NOT EXISTS idx_parties_party_type 
    ON parties(party_type);

    CREATE INDEX IF NOT EXISTS idx_party_gsts_party_id 
    ON party_gsts(party_id);

    CREATE INDEX IF NOT EXISTS idx_stocks_firm_id 
    ON stocks(firm_id);

    CREATE INDEX IF NOT EXISTS idx_stocks_item_name 
    ON stocks(item_name);

    CREATE INDEX IF NOT EXISTS idx_bills_firm_id 
    ON bills(firm_id);

    CREATE INDEX IF NOT EXISTS idx_bills_bill_type 
    ON bills(bill_type);

    CREATE INDEX IF NOT EXISTS idx_bills_bill_date 
    ON bills(bill_date);

    CREATE INDEX IF NOT EXISTS idx_bills_party_id 
    ON bills(party_id);

    CREATE INDEX IF NOT EXISTS idx_stock_reg_firm_id 
    ON stock_reg(firm_id);

    CREATE INDEX IF NOT EXISTS idx_stock_reg_stock_id 
    ON stock_reg(stock_id);

    CREATE INDEX IF NOT EXISTS idx_stock_reg_movement_date 
    ON stock_reg(movement_date);
  `);

  // Commit transaction
  db.exec('COMMIT');

  console.log('✅ Migration completed successfully: Inventory Tables');
  process.exit(0);

} catch (error) {
  // Rollback on error
  db.exec('ROLLBACK');
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
