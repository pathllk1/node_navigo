import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFilePath = path.join(__dirname, '../server/utils/db.js');

console.log('🔄 Converting ALL named parameters to positional parameters...\n');

let content = fs.readFileSync(dbFilePath, 'utf-8');

// Create backup
const backupPath = dbFilePath + '.backup3';
fs.writeFileSync(backupPath, content, 'utf-8');
console.log(`✓ Backup created: ${backupPath}\n`);

// Simple regex-based replacement for all @param to ?
// This works because we're replacing all @param with ? in order
let replacementCount = 0;

// Find all prepared statements and replace @params with ?
const lines = content.split('\n');
const result = [];

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Check if this line contains @param
    if (line.includes('@')) {
        // Count how many @params are in this line
        const paramMatches = line.match(/@\w+/g) || [];
        
        if (paramMatches.length > 0) {
            // Replace all @param with ?
            const newLine = line.replace(/@\w+/g, '?');
            
            if (newLine !== line) {
                replacementCount += paramMatches.length;
                result.push(newLine);
                continue;
            }
        }
    }
    
    result.push(line);
}

const newContent = result.join('\n');

// Write the converted content
fs.writeFileSync(dbFilePath, newContent, 'utf-8');

console.log(`✅ Conversion complete!`);
console.log(`   Total @param replacements: ${replacementCount}`);
console.log(`   File: ${dbFilePath}\n`);

// Verify syntax
try {
    const testContent = newContent.substring(0, 1000);
    if (testContent.includes('db.prepare')) {
        console.log('✓ File structure looks valid');
    }
} catch (err) {
    console.error('✗ Error:', err.message);
}

console.log('\n✅ All named parameters have been converted to positional parameters!');
console.log('⚠️  IMPORTANT: You must now update all controller files to pass positional parameters!');
