import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'server', 'data.sqlite');
const db = new Database(dbPath);

console.log('🔄 Migrating database to admin system...\n');

try {
  // 1. Update all existing users to have 'approved' status
  console.log('1️⃣  Updating existing users to approved status...');
  const updateUsers = db.prepare(`
    UPDATE users SET status = 'approved' WHERE status IS NULL OR status = 'pending'
  `);
  const userResult = updateUsers.run();
  console.log(`   ✅ Updated ${userResult.changes} users\n`);

  // 2. Update all existing firms to have 'approved' status
  console.log('2️⃣  Updating existing firms to approved status...');
  const updateFirms = db.prepare(`
    UPDATE firms SET status = 'approved' WHERE status IS NULL OR status = 'pending'
  `);
  const firmResult = updateFirms.run();
  console.log(`   ✅ Updated ${firmResult.changes} firms\n`);

  // 3. Check if super admin exists
  console.log('3️⃣  Checking for super admin...');
  const existingSuperAdmin = db.prepare(`
    SELECT * FROM users WHERE role = 'super_admin'
  `).get();

  if (existingSuperAdmin) {
    console.log('   ✅ Super admin already exists\n');
  } else {
    // 4. Create super admin
    console.log('4️⃣  Creating super admin...');
    const password = 'SuperAdmin@123';
    const hashedPassword = await bcrypt.hash(password, 12);

    const createSuperAdmin = db.prepare(`
      INSERT INTO users (username, email, fullname, password, role, firm_id, status)
      VALUES (@username, @email, @fullname, @password, @role, @firm_id, @status)
    `);

    createSuperAdmin.run({
      username: 'superadmin',
      email: 'superadmin@system.com',
      fullname: 'Super Administrator',
      password: hashedPassword,
      role: 'super_admin',
      firm_id: null,
      status: 'approved'
    });

    console.log('   ✅ Super admin created\n');
    console.log('   📧 Email: superadmin@system.com');
    console.log('   🔑 Password: SuperAdmin@123\n');
  }

  // 5. Verify
  console.log('5️⃣  Verifying migration...');
  const users = db.prepare('SELECT id, username, email, role, status FROM users').all();
  const firms = db.prepare('SELECT id, name, code, status FROM firms').all();
  
  console.log(`   ✅ Total users: ${users.length}`);
  console.log(`   ✅ Total firms: ${firms.length}`);
  
  const superAdmins = users.filter(u => u.role === 'super_admin');
  console.log(`   ✅ Super admins: ${superAdmins.length}\n`);

  console.log('✅ Migration complete!\n');
  console.log('📊 Users:');
  console.table(users);
  console.log('\n📊 Firms:');
  console.table(firms);

} catch (err) {
  console.error('❌ Migration error:', err.message);
  process.exit(1);
} finally {
  db.close();
}
