import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFilePath = path.join(__dirname, '../server/utils/db.js');

console.log('🔄 Converting named parameters to positional parameters...\n');

// Read the file
let content = fs.readFileSync(dbFilePath, 'utf-8');

// Track changes
let changeCount = 0;
const changes = [];

// Function to convert a single prepared statement
function convertStatement(match) {
    const fullMatch = match[0];
    const beforeValues = match[1];
    const valuesClause = match[2];
    
    // Extract parameter names from VALUES clause
    const paramMatches = valuesClause.match(/@\w+/g) || [];
    const uniqueParams = [...new Set(paramMatches)];
    
    if (uniqueParams.length === 0) {
        return fullMatch; // No parameters to convert
    }
    
    // Create replacement with positional parameters
    const questionMarks = uniqueParams.map(() => '?').join(', ');
    const converted = `${beforeValues}VALUES (${questionMarks})`;
    
    changeCount++;
    changes.push({
        original: fullMatch.substring(0, 100) + '...',
        converted: converted.substring(0, 100) + '...',
        paramCount: uniqueParams.length
    });
    
    return converted;
}

// Pattern to match INSERT statements with VALUES clause
const insertPattern = /(INSERT INTO\s+\w+\s*\([^)]+\)\s*)(VALUES\s*\([^)]*@\w+[^)]*\))/gi;

content = content.replace(insertPattern, convertStatement);

// Pattern to match UPDATE statements with WHERE clause containing @params
const updatePattern = /(UPDATE\s+\w+\s+SET\s+[^W]+WHERE\s+[^;]+@\w+[^;]*);/gi;

// For UPDATE statements, we need to be more careful
// Let's handle them separately
const updateMatches = [...content.matchAll(/UPDATE\s+\w+\s+SET\s+([^W]+)WHERE\s+([^;]+);/gi)];

updateMatches.forEach(match => {
    const fullStatement = match[0];
    const setClause = match[1];
    const whereClause = match[2];
    
    // Extract all @param names
    const allParams = fullStatement.match(/@\w+/g) || [];
    const uniqueParams = [...new Set(allParams)];
    
    if (uniqueParams.length === 0) return;
    
    // For UPDATE, we need to replace @param with ? in order
    let converted = fullStatement;
    let paramIndex = 0;
    
    // Replace in SET clause first
    converted = converted.replace(/SET\s+([^W]+)WHERE/, (match) => {
        return match.replace(/@\w+/g, () => {
            paramIndex++;
            return '?';
        });
    });
    
    // Then replace in WHERE clause
    converted = converted.replace(/WHERE\s+([^;]+);/, (match) => {
        return match.replace(/@\w+/g, () => {
            paramIndex++;
            return '?';
        });
    });
    
    if (converted !== fullStatement) {
        content = content.replace(fullStatement, converted);
        changeCount++;
        changes.push({
            type: 'UPDATE',
            original: fullStatement.substring(0, 80) + '...',
            converted: converted.substring(0, 80) + '...',
            paramCount: uniqueParams.length
        });
    }
});

// Pattern to match DELETE statements
const deletePattern = /DELETE FROM\s+\w+\s+WHERE\s+[^;]*@\w+[^;]*;/gi;

content = content.replace(deletePattern, (match) => {
    const params = match.match(/@\w+/g) || [];
    if (params.length === 0) return match;
    
    const converted = match.replace(/@\w+/g, '?');
    changeCount++;
    changes.push({
        type: 'DELETE',
        original: match.substring(0, 80) + '...',
        converted: converted.substring(0, 80) + '...',
        paramCount: params.length
    });
    
    return converted;
});

// Pattern to match SELECT statements with WHERE clause
const selectPattern = /SELECT\s+[^F]+FROM\s+\w+\s+WHERE\s+[^;]*@\w+[^;]*;/gi;

content = content.replace(selectPattern, (match) => {
    const params = match.match(/@\w+/g) || [];
    if (params.length === 0) return match;
    
    const converted = match.replace(/@\w+/g, '?');
    changeCount++;
    changes.push({
        type: 'SELECT',
        original: match.substring(0, 80) + '...',
        converted: converted.substring(0, 80) + '...',
        paramCount: params.length
    });
    
    return converted;
});

// Write the converted content
fs.writeFileSync(dbFilePath, content, 'utf-8');

console.log(`✓ Conversion complete!\n`);
console.log(`📊 Statistics:`);
console.log(`   Total statements converted: ${changeCount}`);
console.log(`   File: ${dbFilePath}\n`);

if (changes.length > 0) {
    console.log(`📝 Changes made:\n`);
    changes.slice(0, 10).forEach((change, idx) => {
        console.log(`${idx + 1}. ${change.type || 'INSERT'} (${change.paramCount} params)`);
        console.log(`   Original: ${change.original}`);
        console.log(`   Converted: ${change.converted}\n`);
    });
    
    if (changes.length > 10) {
        console.log(`... and ${changes.length - 10} more changes\n`);
    }
}

console.log(`✅ All prepared statements have been converted to positional parameters!`);
console.log(`📦 Backup saved to: server/utils/db.js.backup\n`);
console.log(`⚠️  IMPORTANT: You must now update all controller files to pass positional parameters instead of objects!`);
console.log(`   Example: stmt.run({ param1: val1 }) → stmt.run(val1)\n`);
