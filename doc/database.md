# Database Schema Documentation

## Overview

Node Navigo uses Turso (SQLite-compatible database via libsql) with a comprehensive schema supporting multi-firm operations, user management, business modules, and inventory management.

## Core Tables

### firms
Business/company information with comprehensive details.
- **id**: Primary key
- **name**: Firm name (unique)
- **code**: Firm code for identification
- **description**: Firm description
- **legal_name, address, city, state, country, pincode**: Contact details
- **phone_number, secondary_phone, email, website**: Communication
- **business_type, industry_type, establishment_year, employee_count**: Business info
- **registration_number, registration_date, cin_number, pan_number, gst_number**: Legal
- **tax_id, vat_number, bank_account_number, bank_name, bank_branch, ifsc_code**: Financial
- **payment_terms, status, license_numbers, insurance_details**: Operations
- **currency, timezone, fiscal_year_start, invoice_prefix, quote_prefix, po_prefix**: Config
- **logo_url, invoice_template, enable_e_invoice**: Branding/Prefs
- **created_at, updated_at**: Timestamps

### users
User accounts with role-based access and firm association.
- **id**: Primary key
- **username**: Unique username
- **email**: Unique email address
- **fullname**: Full name
- **password**: Hashed password
- **role**: user/manager/admin/super_admin
- **firm_id**: Associated firm (nullable for super_admin)
- **status**: pending/approved/rejected
- **last_login**: Last login timestamp
- **created_at, updated_at**: Timestamps

### refresh_tokens
JWT refresh token storage for session management.
- **id**: Primary key
- **user_id**: Associated user
- **token_hash**: Hashed refresh token
- **expires_at**: Expiration timestamp
- **created_at**: Creation timestamp

## Business Modules

### master_rolls
Employee master records for wage management.
- **id**: Primary key
- **firm_id**: Associated firm
- **employee_name, father_husband_name, date_of_birth, aadhar, pan, phone_no, address**: Personal
- **bank, account_no, ifsc, branch, uan, esic_no, s_kalyan_no**: Banking/Insurance
- **category, p_day_wage, project, site, date_of_joining, date_of_exit, doe_rem**: Employment
- **status**: Active/Inactive
- **created_by, updated_by**: Audit trail
- **created_at, updated_at**: Timestamps

### wages
Monthly wage records for employees.
- **id**: Primary key
- **firm_id**: Associated firm
- **master_roll_id**: Employee reference
- **p_day_wage, wage_days, gross_salary, net_salary**: Salary calculation
- **epf_deduction, esic_deduction, other_deduction, other_benefit**: Deductions/Benefits
- **salary_month**: Month of salary (YYYY-MM)
- **paid_date, cheque_no, paid_from_bank_ac**: Payment details
- **created_by, updated_by**: Audit trail
- **created_at, updated_at**: Timestamps

## Inventory System

### stocks
Stock item inventory with batch support.
- **id**: Primary key
- **firm_id**: Associated firm
- **item**: Item name
- **pno**: Part number
- **oem**: Original equipment manufacturer
- **hsn**: HSN/SAC code
- **qty, uom**: Quantity and unit of measure
- **rate, grate, total**: Pricing
- **mrp**: Maximum retail price
- **batches**: JSON batch information
- **user**: Last modified user
- **created_at, updated_at**: Timestamps

### parties
Customer and supplier information.
- **id**: Primary key
- **firm_id**: Associated firm
- **firm**: Party name
- **gstin**: GST number
- **contact, state, state_code, addr, pin, pan**: Contact details
- **usern**: User reference
- **supply**: Supply type
- **created_at, updated_at**: Timestamps

### bills
Sales/purchase invoices with GST support.
- **id**: Primary key
- **firm_id**: Associated firm
- **bno**: Bill number
- **bdate**: Bill date
- **supply**: Supply type (INTRA/INTER)
- **addr, gstin, state, pin, state_code**: Party details
- **gtot, ntot, rof**: Total amounts
- **btype**: Bill type
- **usern**: User reference
- **party_id**: Party reference
- **oth_chg_json**: Other charges JSON
- **order_no, vehicle_no, dispatch_through, narration**: Additional details
- **reverse_charge, cgst, sgst, igst**: GST calculations
- **status**: ACTIVE/CANCELLED
- **cancellation_reason, cancelled_at, cancelled_by**: Cancellation tracking
- **consignee_* fields**: Consignee information
- **created_at, updated_at**: Timestamps

### stock_reg
Stock movement register.
- **id**: Primary key
- **firm_id**: Associated firm
- **type**: Movement type
- **bno, bdate**: Bill reference
- **supply**: Supply type
- **item, item_narration, batch, hsn**: Item details
- **qty, uom**: Quantity
- **rate, grate, disc, total**: Pricing
- **stock_id, bill_id**: References
- **user**: User reference
- **qtyh**: Historical quantity
- **created_at, updated_at**: Timestamps

## Accounting

### ledger
General ledger entries.
- **id**: Primary key
- **firm_id**: Associated firm
- **voucher_id, voucher_type, voucher_no**: Voucher reference
- **account_head, account_type**: Account details
- **debit_amount, credit_amount**: Double-entry amounts
- **narration**: Entry description
- **bill_id, party_id**: References
- **tax_type, tax_rate**: Tax information
- **transaction_date**: Entry date
- **created_by**: User reference
- **created_at, updated_at**: Timestamps

### bill_sequences
Bill number generation sequences.
- **id**: Primary key
- **firm_id**: Associated firm
- **financial_year**: Financial year
- **last_sequence**: Last used sequence number
- **voucher_type**: Type of voucher
- **created_at, updated_at**: Timestamps

## Settings

### settings
Global application settings.
- **id**: Primary key
- **setting_key**: Setting name (unique)
- **setting_value**: Setting value
- **description**: Setting description
- **created_at, updated_at**: Timestamps

### firm_settings
Firm-specific settings.
- **id**: Primary key
- **firm_id**: Associated firm
- **setting_key**: Setting name
- **setting_value**: Setting value
- **description**: Setting description
- **created_at, updated_at**: Timestamps

## Relationship Tables

### user_master_rolls
Many-to-many relationship between users and master rolls.
- **user_id, master_roll_id**: Composite primary key

### user_wages
Many-to-many relationship between users and wages.
- **user_id, wage_id**: Composite primary key

## Indexes

Comprehensive indexing for performance:
- Firm ID indexes on all tables
- Unique constraints on business keys
- Search indexes on names, codes, dates
- Foreign key indexes
- Composite indexes for common queries

## Data Integrity

- Foreign key constraints with CASCADE/SET NULL/RESTRICT
- CHECK constraints on enum fields
- UNIQUE constraints on business keys
- STRICT tables for type safety

## Migration Support

The database includes automatic schema migrations:
- Firm ID nullable migration for users table
- Dynamic column addition for schema evolution
- Index creation with error handling
