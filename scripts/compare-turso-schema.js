import 'dotenv/config.js';
import Database from 'libsql';

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
    console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env');
    process.exit(1);
}

const db = new Database(tursoUrl, { authToken: tursoToken });

async function getTableStructure() {
    try {
        console.log('Connecting to Turso database...\n');
        
        // Get all tables
        const tablesResult = db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' 
            AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `).all();
        
        const tables = tablesResult.map(row => row.name);
        console.log(`Found ${tables.length} tables:\n`);
        
        const schema = {};
        
        for (const tableName of tables) {
            console.log(`\n========== TABLE: ${tableName} ==========`);
            
            // Get table structure
            const structureResult = db.prepare(`PRAGMA table_info(${tableName})`).all();
            
            schema[tableName] = {
                columns: structureResult.map(row => ({
                    name: row.name,
                    type: row.type,
                    notnull: row.notnull,
                    dflt_value: row.dflt_value,
                    pk: row.pk
                }))
            };
            
            // Print columns
            console.log('Columns:');
            structureResult.forEach(row => {
                const constraints = [];
                if (row.pk) constraints.push('PRIMARY KEY');
                if (row.notnull) constraints.push('NOT NULL');
                if (row.dflt_value) constraints.push(`DEFAULT ${row.dflt_value}`);
                
                console.log(`  - ${row.name}: ${row.type}${constraints.length ? ' (' + constraints.join(', ') + ')' : ''}`);
            });
            
            // Get indexes
            const indexResult = db.prepare(`
                SELECT name, sql FROM sqlite_master 
                WHERE type='index' 
                AND tbl_name='${tableName}'
                AND name NOT LIKE 'sqlite_%'
            `).all();
            
            if (indexResult.length > 0) {
                console.log('Indexes:');
                indexResult.forEach(row => {
                    console.log(`  - ${row.name}: ${row.sql}`);
                });
            }
            
            // Get foreign keys
            const fkResult = db.prepare(`PRAGMA foreign_key_list(${tableName})`).all();
            if (fkResult.length > 0) {
                console.log('Foreign Keys:');
                fkResult.forEach(row => {
                    console.log(`  - ${row.from} -> ${row.table}.${row.to}`);
                });
            }
        }
        
        // Save schema to file
        const fs = await import('fs').then(m => m.promises);
        await fs.writeFile('turso-schema.json', JSON.stringify(schema, null, 2));
        console.log('\n\nSchema saved to turso-schema.json');
        
    } catch (err) {
        console.error('Error fetching schema:', err);
    }
}

getTableStructure();
