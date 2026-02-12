import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFilePath = path.join(__dirname, '../server/utils/db.js');

console.log('🔄 Safe conversion of named parameters to positional parameters...\n');

// Read the file
let content = fs.readFileSync(dbFilePath, 'utf-8');

// Create a backup first
const backupPath = dbFilePath + '.backup2';
fs.writeFileSync(backupPath, content, 'utf-8');
console.log(`✓ Backup created: ${backupPath}\n`);

// List of specific conversions needed
const conversions = [
    {
        name: 'Firm.create',
        find: `create: db.prepare(\`
    INSERT INTO firms (name, code, description, legal_name, address, city, state, country, pincode, phone_number, secondary_phone, email, website, business_type, industry_type, establishment_year, employee_count, registration_number, registration_date, cin_number, pan_number, gst_number, tax_id, vat_number, bank_account_number, bank_name, bank_branch, ifsc_code, payment_terms, status, license_numbers, insurance_details, currency, timezone, fiscal_year_start, invoice_prefix, quote_prefix, po_prefix, logo_url, invoice_template, enable_e_invoice)
    VALUES (@name, @code, @description, @legal_name, @address, @city, @state, @country, @pincode, @phone_number, @secondary_phone, @email, @website, @business_type, @industry_type, @establishment_year, @employee_count, @registration_number, @registration_date, @cin_number, @pan_number, @gst_number, @tax_id, @vat_number, @bank_account_number, @bank_name, @bank_branch, @ifsc_code, @payment_terms, @status, @license_numbers, @insurance_details, @currency, @timezone, @fiscal_year_start, @invoice_prefix, @quote_prefix, @po_prefix, @logo_url, @invoice_template, @enable_e_invoice)
  \`)`,
        replace: `create: db.prepare(\`
    INSERT INTO firms (name, code, description, legal_name, address, city, state, country, pincode, phone_number, secondary_phone, email, website, business_type, industry_type, establishment_year, employee_count, registration_number, registration_date, cin_number, pan_number, gst_number, tax_id, vat_number, bank_account_number, bank_name, bank_branch, ifsc_code, payment_terms, status, license_numbers, insurance_details, currency, timezone, fiscal_year_start, invoice_prefix, quote_prefix, po_prefix, logo_url, invoice_template, enable_e_invoice)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  \`)`
    },
    {
        name: 'User.updateStatus',
        find: `updateStatus: db.prepare(\`
    UPDATE users 
    SET status = @status, updated_at = datetime('now')
    WHERE id = @id
  \`)`,
        replace: `updateStatus: db.prepare(\`
    UPDATE users 
    SET status = ?, updated_at = datetime('now')
    WHERE id = ?
  \`)`
    }
];

let convertedCount = 0;

conversions.forEach(conv => {
    if (content.includes(conv.find)) {
        content = content.replace(conv.find, conv.replace);
        convertedCount++;
        console.log(`✓ Converted: ${conv.name}`);
    } else {
        console.log(`⚠️  Not found: ${conv.name} (may already be converted)`);
    }
});

// Write the converted content
fs.writeFileSync(dbFilePath, content, 'utf-8');

console.log(`\n✅ Conversion complete!`);
console.log(`   Statements converted: ${convertedCount}`);
console.log(`   File: ${dbFilePath}\n`);

// Verify the file is valid JavaScript
try {
    await import(dbFilePath);
    console.log('✓ File syntax is valid!');
} catch (err) {
    console.error('✗ File has syntax errors:', err.message);
    console.log('\nRestoring from backup...');
    fs.copyFileSync(backupPath, dbFilePath);
    console.log('✓ Restored from backup');
    process.exit(1);
}
