import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'server', 'data.sqlite');
const db = new Database(dbPath);

console.log('🔄 Fixing firm_id to be nullable...\n');

try {
  // Disable foreign keys temporarily
  db.pragma('foreign_keys = OFF');

  // Backup existing data
  console.log('1️⃣  Backing up users data...');
  const existingUsers = db.prepare('SELECT * FROM users').all();
  console.log(`   ✅ Backed up ${existingUsers.length} users\n`);

  // Drop old table
  console.log('2️⃣  Dropping old users table...');
  db.exec('DROP TABLE IF EXISTS users');
  console.log('   ✅ Dropped\n');

  // Create new table with nullable firm_id
  console.log('3️⃣  Creating new users table with nullable firm_id...');
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      fullname TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('user','manager','admin','super_admin')) DEFAULT 'user',
      firm_id INTEGER,
      status TEXT CHECK(status IN ('pending','approved','rejected')) DEFAULT 'pending',
      last_mail_sent TEXT,
      last_login TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE
    ) STRICT;
  `);
  console.log('   ✅ Created\n');

  // Restore data
  console.log('4️⃣  Restoring users data...');
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, email, fullname, password, role, firm_id, status, last_mail_sent, last_login, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const user of existingUsers) {
    insertUser.run(
      user.id,
      user.username,
      user.email,
      user.fullname,
      user.password,
      user.role,
      user.firm_id,
      user.status || 'approved',
      user.last_mail_sent,
      user.last_login,
      user.created_at,
      user.updated_at
    );
  }
  console.log(`   ✅ Restored ${existingUsers.length} users\n`);

  // Create super admin
  console.log('5️⃣  Creating super admin...');
  const password = 'SuperAdmin@123';
  const hashedPassword = await bcrypt.hash(password, 12);

  const createSuperAdmin = db.prepare(`
    INSERT INTO users (username, email, fullname, password, role, firm_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  createSuperAdmin.run(
    'superadmin',
    'superadmin@system.com',
    'Super Administrator',
    hashedPassword,
    'super_admin',
    null,
    'approved'
  );
  console.log('   ✅ Super admin created\n');

  // Re-enable foreign keys
  db.pragma('foreign_keys = ON');

  // Verify
  console.log('6️⃣  Verifying...');
  const users = db.prepare('SELECT id, username, email, role, status, firm_id FROM users').all();
  console.log(`   ✅ Total users: ${users.length}\n`);

  console.log('✅ Migration complete!\n');
  console.log('📊 Users:');
  console.table(users);

  console.log('\n🔐 Super Admin Credentials:');
  console.log('   Email: superadmin@system.com');
  console.log('   Password: SuperAdmin@123');

} catch (err) {
  console.error('❌ Error:', err.message);
  console.error(err);
  process.exit(1);
} finally {
  db.close();
}
