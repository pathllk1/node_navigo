import { db, Firm, User } from './db.js';
import bcrypt from 'bcrypt';

/**
 * Seed script to create initial firms and admin users
 * Run this once to set up test data
 */

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Create default firm 1 (approved)
    const firm1 = Firm.create.run({
      name: 'Acme Corporation',
      code: 'ACME',
      description: 'Leading construction company',
      status: 'approved'
    });
    console.log('✅ Created firm: Acme Corporation (ACME)');

    // Create admin user for firm 1
    const hashedPassword1 = await bcrypt.hash('admin123', 12);
    const admin1 = User.create.run({
      username: 'admin',
      email: 'admin@acme.com',
      fullname: 'Admin User',
      password: hashedPassword1,
      role: 'admin',
      firm_id: firm1.lastInsertRowid
    });
    console.log('✅ Created admin user: admin@acme.com (password: admin123)');

    // Create manager user for firm 1
    const hashedPassword2 = await bcrypt.hash('manager123', 12);
    const manager1 = User.create.run({
      username: 'manager',
      email: 'manager@acme.com',
      fullname: 'Manager User',
      password: hashedPassword2,
      role: 'manager',
      firm_id: firm1.lastInsertRowid
    });
    console.log('✅ Created manager user: manager@acme.com (password: manager123)');

    // Create regular user for firm 1
    const hashedPassword3 = await bcrypt.hash('user123', 12);
    const user1 = User.create.run({
      username: 'user',
      email: 'user@acme.com',
      fullname: 'Regular User',
      password: hashedPassword3,
      role: 'user',
      firm_id: firm1.lastInsertRowid
    });
    console.log('✅ Created regular user: user@acme.com (password: user123)');

    // Create default firm 2 (pending approval)
    const firm2 = Firm.create.run({
      name: 'BuildTech Industries',
      code: 'BUILD',
      description: 'Modern construction solutions',
      status: 'pending'
    });
    console.log('✅ Created firm: BuildTech Industries (BUILD) - PENDING');

    // Create admin user for firm 2
    const hashedPassword4 = await bcrypt.hash('build123', 12);
    const admin2 = User.create.run({
      username: 'buildadmin',
      email: 'admin@buildtech.com',
      fullname: 'Build Admin',
      password: hashedPassword4,
      role: 'admin',
      firm_id: firm2.lastInsertRowid
    });
    console.log('✅ Created admin user: admin@buildtech.com (password: build123) - PENDING APPROVAL');

    // Create default firm 3 (approved)
    const firm3 = Firm.create.run({
      name: 'Metro Constructions',
      code: 'METRO',
      description: 'Urban development specialists',
      status: 'approved'
    });
    console.log('✅ Created firm: Metro Constructions (METRO)');

    // Create admin user for firm 3
    const hashedPassword5 = await bcrypt.hash('metro123', 12);
    const admin3 = User.create.run({
      username: 'metroadmin',
      email: 'admin@metro.com',
      fullname: 'Metro Admin',
      password: hashedPassword5,
      role: 'admin',
      firm_id: firm3.lastInsertRowid
    });
    console.log('✅ Created admin user: admin@metro.com (password: metro123)');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Firm: ACME (Approved)');
    console.log('  Admin:   admin@acme.com / admin123');
    console.log('  Manager: manager@acme.com / manager123');
    console.log('  User:    user@acme.com / user123');
    console.log('');
    console.log('Firm: BUILD (Pending Approval)');
    console.log('  Admin:   admin@buildtech.com / build123');
    console.log('  (Cannot login until firm is approved)');
    console.log('');
    console.log('Firm: METRO (Approved)');
    console.log('  Admin:   admin@metro.com / metro123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (err) {
    console.error('❌ Seed failed:', err);
    throw err;
  }
}

// Run seed
seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));