# Database Schema Fixes Applied

## Date: February 10, 2026

## Issues Fixed

### 1. Banking Controller - Transaction Type Column ✅

**Problem**: Controller was using `type` column in one query, but database schema has `transaction_type`

**File**: `server/controllers/banking.controller.js`

**Fix**: Changed the query filter from `bt.type = ?` to `bt.transaction_type = ?`

**Location**: Line ~280 in `getAllTransactions` function

---

### 2. Settings Controller - Firm Settings Schema Mismatch ✅

**Problem**: Controller was querying `firm_settings` table with non-existent `setting_type` column

**Database Schema**: The `firm_settings` table has individual columns:
- `gst_enabled`
- `cess_enabled`
- `tds_enabled`
- `decimal_places`
- `date_format`
- `multi_currency`
- `invoice_prefix`
- `invoice_terms`
- etc.

**NOT**: A generic `setting_type` and `setting_value` structure

**Files Fixed**: `server/controllers/settings.controller.js`

**Functions Updated**:
1. `getInvoiceSettings()` - Now queries `firm_settings` directly and returns individual columns
2. `updateInvoiceSettings()` - Now updates `invoice_prefix` and `invoice_terms` columns
3. `getNumberFormatSettings()` - Now returns `decimal_places`, `date_format`, `multi_currency`
4. `updateNumberFormatSettings()` - Now updates individual columns
5. `getTaxSettings()` - Now returns `gst_enabled`, `cess_enabled`, `tds_enabled`
6. `updateTaxSettings()` - Now updates individual tax columns
7. `getSystemSettings()` - Now queries `settings` table by `setting_key`
8. `updateSystemSettings()` - Now updates settings by `setting_key`

---

### 3. Settings Table Structure ✅

**Global Settings Table** (`settings`):
- Uses `setting_key` (unique) for identification
- Has `setting_value` for the value
- Has `setting_type` for data type (STRING, NUMBER, BOOLEAN, JSON)
- Has `description` for documentation

**Firm Settings Table** (`firm_settings`):
- Has individual columns for each setting
- One row per firm (UNIQUE constraint on firm_id)
- No generic key-value structure

---

## Testing Required

### Banking Module
- [x] Fixed transaction type query
- [ ] Test transaction filtering by type
- [ ] Test all banking endpoints

### Settings Module
- [x] Fixed invoice settings queries
- [x] Fixed tax settings queries
- [x] Fixed number format settings queries
- [x] Fixed system settings queries
- [ ] Test all settings endpoints
- [ ] Verify settings save correctly

---

## Database Schema Reference

### firm_settings Table
```sql
CREATE TABLE firm_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firm_id INTEGER NOT NULL UNIQUE,
  gstin TEXT,
  pan TEXT,
  tan TEXT,
  cin TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  state_code INTEGER,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  invoice_prefix TEXT,
  invoice_terms TEXT,
  bank_details TEXT,
  financial_year_start TEXT DEFAULT '04-01',
  gst_enabled INTEGER DEFAULT 1,
  cess_enabled INTEGER DEFAULT 0,
  tds_enabled INTEGER DEFAULT 0,
  multi_currency INTEGER DEFAULT 0,
  decimal_places INTEGER DEFAULT 2,
  date_format TEXT DEFAULT 'DD-MM-YYYY',
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (firm_id) REFERENCES firms(id)
);
```

### settings Table
```sql
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type TEXT CHECK(setting_type IN ('STRING', 'NUMBER', 'BOOLEAN', 'JSON')),
  description TEXT,
  created_at TEXT,
  updated_at TEXT
);
```

### bank_transactions Table
```sql
CREATE TABLE bank_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firm_id INTEGER NOT NULL,
  bank_account_id INTEGER NOT NULL,
  transaction_date TEXT NOT NULL,
  transaction_type TEXT CHECK(transaction_type IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER')) NOT NULL,
  amount REAL NOT NULL,
  balance_after REAL NOT NULL,
  ref_type TEXT,
  ref_id INTEGER,
  ref_no TEXT,
  narration TEXT,
  cheque_no TEXT,
  cheque_date TEXT,
  transfer_to_account_id INTEGER,
  reconciled INTEGER DEFAULT 0,
  reconciled_date TEXT,
  created_by INTEGER NOT NULL,
  created_at TEXT,
  FOREIGN KEY (firm_id) REFERENCES firms(id),
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
  FOREIGN KEY (transfer_to_account_id) REFERENCES bank_accounts(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

---

## Summary

**Total Fixes**: 9 functions updated
**Files Modified**: 2 files
**Status**: ✅ All database schema mismatches fixed

All controllers now correctly query the database schema as defined in the migration scripts.

---

## Next Steps

1. Test all banking endpoints
2. Test all settings endpoints
3. Verify data saves correctly
4. Continue with form page implementation

