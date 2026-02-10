'use strict';

/**
 * Complete Wages Table Migration Script
 * 
 * This script adds ALL missing columns to the wages table:
 * - created_by, updated_by (user tracking)
 * - paid_date, cheque_no, paid_from_bank_ac (payment tracking)
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data.sqlite');

const db = new Database(dbPath);

console.log('═══════════════════════════════════════════════════════');
console.log('    COMPLETE WAGES TABLE MIGRATION');
console.log('═══════════════════════════════════════════════════════\n');

const REQUIRED_COLUMNS = [
  {
    name: 'created_by',
    type: 'INTEGER',
    description: 'User who created the wage record',
    defaultValue: '1'  // Default to user ID 1 for existing records
  },
  {
    name: 'updated_by',
    type: 'INTEGER',
    description: 'User who last updated the wage record',
    defaultValue: '1'  // Default to user ID 1 for existing records
  },
  {
    name: 'paid_date',
    type: 'TEXT',
    description: 'Date when payment was made',
    defaultValue: null
  },
  {
    name: 'cheque_no',
    type: 'TEXT',
    description: 'Cheque number or transaction reference',
    defaultValue: null
  },
  {
    name: 'paid_from_bank_ac',
    type: 'TEXT',
    description: 'Bank account from which payment was made',
    defaultValue: null
  }
];

try {
  console.log('📊 Step 1: Checking current wages table structure...\n');

  // Get current columns
  const currentColumns = db.prepare("PRAGMA table_info(wages)").all();
  const existingColumnNames = currentColumns.map(col => col.name);

  console.log(`   Found ${currentColumns.length} existing columns\n`);

  // Find missing columns
  const missingColumns = REQUIRED_COLUMNS.filter(
    col => !existingColumnNames.includes(col.name)
  );

  if (missingColumns.length === 0) {
    console.log('✅ All required columns already exist!\n');
    displaySchema();
    process.exit(0);
  }

  console.log(`⚠️  Found ${missingColumns.length} missing column(s):\n`);
  missingColumns.forEach(col => {
    console.log(`   - ${col.name} (${col.type})`);
    console.log(`     ${col.description}`);
    if (col.defaultValue !== null) {
      console.log(`     Default: ${col.defaultValue}`);
    }
  });

  console.log('\n🔧 Step 2: Adding missing columns...\n');

  // Run migration in transaction
  const migration = db.transaction(() => {
    for (const column of missingColumns) {
      try {
        console.log(`   Adding ${column.name}...`);

        // For created_by and updated_by, we need to set a default
        if (column.defaultValue !== null) {
          // SQLite doesn't allow setting default in ALTER TABLE directly
          // We need to add the column, then update existing records
          db.prepare(`
            ALTER TABLE wages 
            ADD COLUMN ${column.name} ${column.type}
          `).run();

          // Update existing records with default value
          const updateCount = db.prepare(`
            UPDATE wages 
            SET ${column.name} = ? 
            WHERE ${column.name} IS NULL
          `).run(column.defaultValue);

          console.log(`   ✅ Added ${column.name} and updated ${updateCount.changes} existing records`);
        } else {
          // For nullable columns like paid_date
          db.prepare(`
            ALTER TABLE wages 
            ADD COLUMN ${column.name} ${column.type}
          `).run();

          console.log(`   ✅ Added ${column.name}`);
        }

      } catch (error) {
        console.error(`   ❌ Error adding ${column.name}: ${error.message}`);
        throw error;
      }
    }
  });

  migration();

  console.log('\n✅ All missing columns added successfully!\n');

  // Add indexes
  console.log('🗂️  Step 3: Creating indexes...\n');

  const indexes = [
    {
      name: 'idx_wages_paid_date',
      sql: 'CREATE INDEX IF NOT EXISTS idx_wages_paid_date ON wages(paid_date)'
    },
    {
      name: 'idx_wages_created_by',
      sql: 'CREATE INDEX IF NOT EXISTS idx_wages_created_by ON wages(created_by)'
    }
  ];

  const existingIndexes = db.prepare("PRAGMA index_list(wages)").all();
  const existingIndexNames = existingIndexes.map(idx => idx.name);

  for (const index of indexes) {
    if (!existingIndexNames.includes(index.name)) {
      console.log(`   Creating ${index.name}...`);
      db.prepare(index.sql).run();
      console.log(`   ✅ Index created`);
    } else {
      console.log(`   ℹ️  ${index.name} already exists`);
    }
  }

  console.log('\n📋 Step 4: Final schema:\n');
  displaySchema();

  console.log('🔍 Step 5: Verifying data...\n');
  verifyData();

  console.log('═══════════════════════════════════════════════════════');
  console.log('    ✅ MIGRATION COMPLETED SUCCESSFULLY');
  console.log('═══════════════════════════════════════════════════════\n');

} catch (error) {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('    ❌ MIGRATION FAILED');
  console.log('═══════════════════════════════════════════════════════\n');
  console.error('Error:', error.message);
  console.error(error);
  process.exit(1);
} finally {
  db.close();
}

function displaySchema() {
  const columns = db.prepare("PRAGMA table_info(wages)").all();

  console.log('┌─────┬────────────────────────┬──────────┬──────────┐');
  console.log('│ Pos │ Column Name            │ Type     │ Not Null │');
  console.log('├─────┼────────────────────────┼──────────┼──────────┤');

  columns.forEach(col => {
    const name = col.name.padEnd(22);
    const type = col.type.padEnd(8);
    const notNull = (col.notnull ? 'YES' : 'NO').padEnd(8);
    
    // Highlight newly added columns
    const isNew = REQUIRED_COLUMNS.some(rc => rc.name === col.name);
    const prefix = isNew ? '✓' : ' ';
    
    console.log(`│ ${String(col.cid).padStart(3)} │ ${prefix} ${name} │ ${type} │ ${notNull} │`);
  });

  console.log('└─────┴────────────────────────┴──────────┴──────────┘\n');

  // Show legend
  console.log('   ✓ = Newly added column\n');
}

function verifyData() {
  try {
    // Count total wages
    const totalWages = db.prepare("SELECT COUNT(*) as count FROM wages").get();
    console.log(`   Total wage records: ${totalWages.count}`);

    if (totalWages.count > 0) {
      // Check created_by distribution
      const createdByStats = db.prepare(`
        SELECT created_by, COUNT(*) as count 
        FROM wages 
        GROUP BY created_by
        ORDER BY count DESC
        LIMIT 5
      `).all();

      console.log('\n   Created by distribution:');
      createdByStats.forEach(stat => {
        console.log(`   - User ${stat.created_by}: ${stat.count} records`);
      });

      // Check payment data
      const paidWages = db.prepare(`
        SELECT COUNT(*) as count 
        FROM wages 
        WHERE paid_date IS NOT NULL
      `).get();

      console.log(`\n   Wages with payment date: ${paidWages.count}`);
    }

    console.log('\n   ✅ Data verification complete\n');
  } catch (error) {
    console.error(`   ❌ Error during verification: ${error.message}\n`);
  }
}