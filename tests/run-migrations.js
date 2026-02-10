/**
 * Master Migration Runner
 * Runs all database migrations in order
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('═══════════════════════════════════════════════════════════');
console.log('  DATABASE MIGRATION RUNNER');
console.log('═══════════════════════════════════════════════════════════\n');

const migrations = [
  '001-create-inventory-tables.js',
  '002-create-ledger-tables.js',
  '003-create-banking-tables.js',
  '004-create-settings-tables.js'
];

let successCount = 0;
let failCount = 0;

for (const [index, migration] of migrations.entries()) {
  const migrationPath = path.join(__dirname, migration);
  
  if (!fs.existsSync(migrationPath)) {
    console.log(`⚠️  Migration file not found: ${migration}`);
    failCount++;
    continue;
  }

  console.log(`\n[${index + 1}/${migrations.length}] Running: ${migration}`);
  console.log('─'.repeat(60));

  try {
    execSync(`node "${migrationPath}"`, { 
      stdio: 'inherit',
      cwd: __dirname
    });
    successCount++;
  } catch (error) {
    console.error(`\n❌ Failed to run migration: ${migration}`);
    failCount++;
  }
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  MIGRATION SUMMARY');
console.log('═══════════════════════════════════════════════════════════');
console.log(`Total migrations: ${migrations.length}`);
console.log(`✅ Successful: ${successCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log('═══════════════════════════════════════════════════════════\n');

if (failCount > 0) {
  console.error('⚠️  Some migrations failed. Please check the errors above.');
  process.exit(1);
} else {
  console.log('🎉 All migrations completed successfully!');
  process.exit(0);
}
