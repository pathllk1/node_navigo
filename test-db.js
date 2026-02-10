import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'server', 'data.sqlite');
const db = new Database(dbPath);

console.log('📊 Database Test\n');

// Check users table
try {
  const users = db.prepare('SELECT id, username, email, role, status FROM users').all();
  console.log('✅ Users in database:');
  console.table(users);
} catch (err) {
  console.error('❌ Error querying users:', err.message);
}

// Check firms table
try {
  const firms = db.prepare('SELECT id, name, code, status FROM firms').all();
  console.log('\n✅ Firms in database:');
  console.table(firms);
} catch (err) {
  console.error('❌ Error querying firms:', err.message);
}

db.close();
