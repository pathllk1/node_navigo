import 'dotenv/config.js';
import Database from 'libsql';

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
    console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env');
    process.exit(1);
}

const db = new Database(tursoUrl, { authToken: tursoToken });

async function diagnose() {
    try {
        console.log('🔍 Diagnosing firm_id issues...\n');
        
        // 1. Check all users and their firm associations
        console.log('📋 Users and their firm associations:');
        console.log('─'.repeat(80));
        
        const users = db.prepare(`
            SELECT 
                u.id,
                u.username,
                u.email,
                u.firm_id,
                u.status,
                f.name as firm_name,
                f.status as firm_status
            FROM users u
            LEFT JOIN firms f ON f.id = u.firm_id
            ORDER BY u.id
        `).all();
        
        if (users.length === 0) {
            console.log('⚠️  No users found in database');
        } else {
            users.forEach(user => {
                const firmStatus = user.firm_id 
                    ? `✓ Firm: ${user.firm_name} (${user.firm_status})`
                    : '❌ NO FIRM ASSIGNED';
                console.log(`  ID: ${user.id} | ${user.username} | ${user.email} | ${user.status} | ${firmStatus}`);
            });
        }
        
        // 2. Check users without firm_id
        console.log('\n⚠️  Users WITHOUT firm_id:');
        console.log('─'.repeat(80));
        
        const usersWithoutFirm = db.prepare(`
            SELECT id, username, email, status FROM users WHERE firm_id IS NULL
        `).all();
        
        if (usersWithoutFirm.length === 0) {
            console.log('✓ All users have firm_id assigned');
        } else {
            console.log(`Found ${usersWithoutFirm.length} users without firm_id:`);
            usersWithoutFirm.forEach(user => {
                console.log(`  - ${user.username} (${user.email}) - Status: ${user.status}`);
            });
            
            console.log('\n💡 Fix: Assign a firm to these users:');
            usersWithoutFirm.forEach(user => {
                console.log(`  UPDATE users SET firm_id = 1 WHERE id = ${user.id};`);
            });
        }
        
        // 3. Check available firms
        console.log('\n🏢 Available firms:');
        console.log('─'.repeat(80));
        
        const firms = db.prepare(`
            SELECT id, name, code, status FROM firms ORDER BY id
        `).all();
        
        if (firms.length === 0) {
            console.log('⚠️  No firms found! Create a firm first.');
        } else {
            firms.forEach(firm => {
                console.log(`  ID: ${firm.id} | ${firm.name} (${firm.code}) | Status: ${firm.status}`);
            });
        }
        
        // 4. Check stocks table
        console.log('\n📦 Stocks in database:');
        console.log('─'.repeat(80));
        
        const stocks = db.prepare(`
            SELECT id, firm_id, item, qty, rate FROM stocks ORDER BY created_at DESC LIMIT 10
        `).all();
        
        if (stocks.length === 0) {
            console.log('No stocks found');
        } else {
            console.log(`Found ${stocks.length} stocks:`);
            stocks.forEach(stock => {
                console.log(`  ID: ${stock.id} | Firm: ${stock.firm_id} | Item: ${stock.item} | Qty: ${stock.qty} | Rate: ${stock.rate}`);
            });
        }
        
        // 5. Summary and recommendations
        console.log('\n' + '═'.repeat(80));
        console.log('📊 SUMMARY & RECOMMENDATIONS');
        console.log('═'.repeat(80));
        
        const totalUsers = users.length;
        const usersWithFirmCount = users.filter(u => u.firm_id).length;
        const usersWithoutFirmCount = users.filter(u => !u.firm_id).length;
        
        console.log(`\n✓ Total Users: ${totalUsers}`);
        console.log(`✓ Users with firm: ${usersWithFirmCount}`);
        console.log(`❌ Users without firm: ${usersWithoutFirmCount}`);
        console.log(`✓ Total Firms: ${firms.length}`);
        console.log(`✓ Total Stocks: ${stocks.length}`);
        
        if (usersWithoutFirmCount > 0) {
            console.log('\n⚠️  ACTION REQUIRED:');
            console.log('   Users without firm_id cannot create stocks.');
            console.log('   Run these SQL commands to fix:');
            usersWithoutFirm.forEach(user => {
                console.log(`   UPDATE users SET firm_id = 1 WHERE id = ${user.id};`);
            });
        } else {
            console.log('\n✓ All users have firm_id assigned.');
            console.log('✓ Stock creation should work properly.');
        }
        
        if (firms.length === 0) {
            console.log('\n⚠️  ACTION REQUIRED:');
            console.log('   No firms exist in database.');
            console.log('   Create a firm first before assigning users.');
        }
        
    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err);
    }
}

diagnose();
