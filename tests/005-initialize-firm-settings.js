/**
 * Migration Script: Initialize Firm Settings
 * Populates firm_settings table with default data for existing firms
 */

import { db } from '../server/utils/db.js';

console.log('Starting migration: Initialize Firm Settings...');

try {
  // Start transaction
  db.exec('BEGIN TRANSACTION');

  // Insert default firm settings for all firms that don't have settings yet
  console.log('Inserting default firm settings...');
  
  const firms = db.prepare('SELECT id, name FROM firms').all();
  
  for (const firm of firms) {
    // Check if settings already exist
    const existing = db.prepare('SELECT id FROM firm_settings WHERE firm_id = ?').get(firm.id);
    
    if (!existing) {
      console.log(`Creating settings for firm: ${firm.name} (ID: ${firm.id})`);
      
      db.prepare(`
        INSERT INTO firm_settings (
          firm_id,
          invoice_prefix,
          invoice_terms,
          bank_details,
          financial_year_start,
          gst_enabled,
          cess_enabled,
          tds_enabled,
          multi_currency,
          decimal_places,
          date_format
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        firm.id,
        'INV',
        'Payment due within 30 days',
        '',
        '04-01',
        1, // GST enabled
        0, // CESS disabled
        0, // TDS disabled
        0, // Multi-currency disabled
        2, // 2 decimal places
        'DD-MM-YYYY'
      );
    } else {
      console.log(`Settings already exist for firm: ${firm.name} (ID: ${firm.id})`);
    }
  }

  // Log this migration
  console.log('Logging migration...');
  db.prepare(`
    INSERT OR IGNORE INTO migrations_log (migration_name, status)
    VALUES ('005-initialize-firm-settings', 'SUCCESS')
  `).run();

  // Commit transaction
  db.exec('COMMIT');

  console.log('✅ Migration completed successfully: Initialize Firm Settings');
  console.log(`   Processed ${firms.length} firm(s)`);
  process.exit(0);

} catch (error) {
  // Rollback on error
  db.exec('ROLLBACK');
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
