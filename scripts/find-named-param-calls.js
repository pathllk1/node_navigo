import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const controllersDir = path.join(__dirname, '../server/controllers');

console.log('🔍 Searching for .run({ calls in controllers...\n');

try {
    // Use grep to find all .run({ calls
    const result = execSync(`grep -r "\\.run({" "${controllersDir}" --include="*.js"`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
    }).split('\n').filter(line => line.trim());
    
    if (result.length === 0) {
        console.log('✅ No .run({ calls found!');
        console.log('   All controllers are already using positional parameters.\n');
        process.exit(0);
    }
    
    console.log(`Found ${result.length} .run({ calls:\n`);
    
    const fileMap = {};
    result.forEach(line => {
        const [file, ...rest] = line.split(':');
        if (!fileMap[file]) fileMap[file] = [];
        fileMap[file].push(rest.join(':'));
    });
    
    Object.entries(fileMap).forEach(([file, lines]) => {
        console.log(`📄 ${file}`);
        lines.forEach(line => {
            console.log(`   ${line.substring(0, 100)}`);
        });
        console.log();
    });
    
    console.log(`\n⚠️  ${Object.keys(fileMap).length} file(s) need to be updated.\n`);
    console.log('To update, convert from:');
    console.log('  stmt.run({ param1: val1, param2: val2 })');
    console.log('To:');
    console.log('  stmt.run(val1, val2)');
    
} catch (err) {
    // grep returns non-zero if no matches found
    console.log('✅ No .run({ calls found!');
    console.log('   All controllers are already using positional parameters.\n');
}
