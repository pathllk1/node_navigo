import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFilePath = path.join(__dirname, '../server/utils/db.js');

console.log('📊 Analyzing db.js prepared statements...\n');

const content = fs.readFileSync(dbFilePath, 'utf-8');

// Find all prepared statements
const stmtPattern = /(\w+):\s*db\.prepare\(`([^`]+)`\)/g;
let match;
const statements = [];

while ((match = stmtPattern.exec(content)) !== null) {
    const name = match[1];
    const sql = match[2];
    
    const hasNamed = /@\w+/.test(sql);
    const hasPositional = /\?/.test(sql);
    const paramCount = (sql.match(/\?/g) || []).length;
    const namedParams = (sql.match(/@\w+/g) || []).length;
    
    statements.push({
        name,
        sql: sql.substring(0, 100).replace(/\n/g, ' '),
        hasNamed,
        hasPositional,
        paramCount,
        namedParams,
        type: sql.includes('INSERT') ? 'INSERT' : 
              sql.includes('UPDATE') ? 'UPDATE' : 
              sql.includes('DELETE') ? 'DELETE' : 'SELECT'
    });
}

// Group by type
const byType = {};
statements.forEach(stmt => {
    if (!byType[stmt.type]) byType[stmt.type] = [];
    byType[stmt.type].push(stmt);
});

console.log('📈 Summary:\n');
console.log(`Total prepared statements: ${statements.length}`);
console.log(`  - INSERT: ${byType.INSERT?.length || 0}`);
console.log(`  - UPDATE: ${byType.UPDATE?.length || 0}`);
console.log(`  - DELETE: ${byType.DELETE?.length || 0}`);
console.log(`  - SELECT: ${byType.SELECT?.length || 0}\n`);

// Check for named parameters
const withNamed = statements.filter(s => s.hasNamed);
const withPositional = statements.filter(s => s.hasPositional);

console.log(`Using named parameters (@param): ${withNamed.length}`);
console.log(`Using positional parameters (?): ${withPositional.length}\n`);

if (withNamed.length > 0) {
    console.log('⚠️  Statements still using named parameters:\n');
    withNamed.forEach(stmt => {
        console.log(`  ${stmt.name} (${stmt.type})`);
        console.log(`    SQL: ${stmt.sql}...`);
        console.log(`    Named params: ${stmt.namedParams}\n`);
    });
}

console.log('\n✅ Analysis complete!');
if (withNamed.length === 0) {
    console.log('✓ All prepared statements are using positional parameters!');
} else {
    console.log(`⚠️  ${withNamed.length} statements still need to be converted.`);
}
