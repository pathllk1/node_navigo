# Business Logic and Workflows

## Overview

Node Navigo implements comprehensive business workflows for firm management, employee payroll, and inventory operations. This document details the business rules, workflows, and logic patterns used throughout the application.

## User Management Workflow

### Firm Creation Process

**Actors**: Super Admin
**Purpose**: Create new firms and initial admin accounts

**Workflow Steps**:
1. **Super Admin Access**: Login with super_admin role
2. **Firm Creation**: Fill firm details form
   - Legal information (name, registration, GST, etc.)
   - Contact details (address, phone, email)
   - Banking information
   - Business configuration (currency, timezone, fiscal year)
3. **Admin Account Creation**: Optionally create initial admin user
4. **Firm Code Generation**: Auto-generate unique 6-character firm code
5. **Database Record**: Create firm record with `status = 'approved'`
6. **Notification**: Provide firm code to new firm admin

**Business Rules**:
- Firm names must be unique
- GST numbers validated for Indian firms
- Currency defaults to INR
- Timezone defaults to Asia/Kolkata

### User Registration Process

**Actors**: New Employees, Firm Admin
**Purpose**: Onboard new users to existing firms

**Workflow Steps**:
1. **Registration Request**: User visits `/auth` and selects "Register"
2. **Firm Code Validation**: Enter firm code provided by admin
3. **User Details**: Fill personal information
   - Username, email, fullname, password
   - Firm code verification
4. **Account Creation**: Create user with `status = 'pending'`
5. **Admin Approval**: Firm admin receives notification
6. **Approval Process**: Admin reviews and approves/rejects
7. **Account Activation**: User can login after approval

**Business Rules**:
- Firm code must exist and be approved
- Email and username must be unique
- Password minimum 8 characters
- Users start with 'user' role
- Pending status requires admin approval

### Role-Based Access Control

**Role Hierarchy**:
```
super_admin (System Level)
├── Can create/manage all firms
├── Can approve firm registrations
├── Can assign users to firms
└── Full system access

admin (Firm Level)
├── Can manage users within firm
├── Can approve user registrations
├── Full access to firm data
└── Can create managers and users

manager (Department Level)
├── Can view firm data
├── Can manage assigned employees
├── Limited user management
└── Read-only access to some admin functions

user (Employee Level)
├── Can view own data
├── Limited access to assigned tasks
└── Basic system functions
```

## Payroll Management System

### Employee Master Roll Creation

**Actors**: Admin/Manager
**Purpose**: Create employee records for payroll processing

**Required Fields**:
- **Personal Information**:
  - Employee name, father's/husband's name
  - Date of birth, Aadhar number, PAN
  - Phone number, address
- **Employment Details**:
  - Date of joining, date of exit (optional)
  - Category (UNSKILLED/SKILLED/ etc.)
  - Per day wage rate
  - Project and site assignment
- **Banking Information**:
  - Bank name, account number, IFSC code
  - Branch name
- **Statutory Compliance**:
  - UAN (EPF), ESIC number
  - S-Kalyan number

**Business Rules**:
- Aadhar number unique per firm (prevents duplicate employees)
- Date of joining cannot be in future
- Date of exit must be after joining date if provided
- Per day wage must be positive number
- Status defaults to 'Active'

### Wage Calculation Workflow

**Actors**: Admin/Manager
**Purpose**: Process monthly payroll for eligible employees

**Eligibility Criteria**:
```javascript
function isEmployeeEligible(employee, yearMonth) {
  const monthStart = `${yearMonth}-01`;
  const monthEnd = getMonthEndDate(yearMonth);

  // Employee joined before or during month
  if (employee.date_of_joining > monthEnd) return false;

  // Employee not exited before month start
  if (employee.date_of_exit && employee.date_of_exit < monthStart) return false;

  return true;
}
```

**Wage Creation Process**:
1. **Month Selection**: Choose payroll month (YYYY-MM)
2. **Employee Filtering**: Get eligible active employees
3. **Duplicate Prevention**: Exclude employees already paid for month
4. **Data Preparation**: Include last month's wage data for reference
5. **Bulk Entry**: Enter wage details for multiple employees
6. **Calculation**: Auto-calculate per-day wage and net salary

**Wage Calculation Formula**:
```javascript
// Per day wage calculation
const perDayWage = wageDays > 0 ? (grossSalary / wageDays).toFixed(2) : 0;

// Net salary calculation
const totalDeductions = (epfDeduction || 0) + (esicDeduction || 0) + (otherDeduction || 0);
const totalBenefits = otherBenefit || 0;
const netSalary = grossSalary - totalDeductions + totalBenefits;
```

**Business Rules**:
- One wage record per employee per month
- Gross salary and wage days required
- Per day wage auto-calculated
- Deductions cannot exceed gross salary
- Historical wage data preserved (no updates to past months)

### Payment Processing

**Payment Recording**:
- Payment date (when actually paid)
- Cheque number (for cheque payments)
- Paid from bank account
- Payment status tracking

**Payment Workflow**:
1. **Wage Creation**: Create wage records with calculated amounts
2. **Payment Processing**: Record actual payment details
3. **Bank Reconciliation**: Track payment source accounts
4. **Audit Trail**: Maintain payment history

## Inventory Management System

### Stock Management

**Stock Item Creation**:
**Required Fields**:
- Item name and description
- Part number (PNO), OEM
- HSN code (for GST)
- Unit of measure (UOM)
- Current quantity and rate

**Stock Movement Types**:
- **Opening Stock**: Initial inventory entry
- **Purchase**: Stock received from suppliers
- **Sale**: Stock sold to customers
- **Adjustment**: Stock corrections
- **Transfer**: Inter-location transfers

**Stock Valuation**:
```javascript
// Weighted average cost calculation
const totalValue = (existingQty * existingRate) + (newQty * newRate);
const totalQty = existingQty + newQty;
const newAvgRate = totalValue / totalQty;
```

### Party Management

**Party Types**:
- **Customers**: Businesses that purchase goods
- **Suppliers**: Businesses that provide goods

**Party Information**:
- Firm name and GSTIN
- Contact details (phone, email)
- Billing and shipping addresses
- State code (for GST)
- Credit terms and limits

**GST Validation**:
- GSTIN format validation for Indian parties
- State code extraction from GSTIN
- Interstate/intrastate classification

### Bill Processing

**Bill Types**:
- **Sales Bills**: Outgoing invoices to customers
- **Purchase Bills**: Incoming invoices from suppliers

**Bill Creation Workflow**:
1. **Party Selection**: Choose customer/supplier
2. **Item Addition**: Add stock items with quantities
3. **GST Calculation**: Auto-calculate CGST, SGST, IGST
4. **Total Calculation**: Compute gross total and round-off
5. **Bill Generation**: Create bill with unique number

**GST Calculation Logic**:
```javascript
// GST rate determination based on HSN and party location
const gstRate = getGSTRate(item.hsn, party.stateCode);
const taxableValue = item.qty * item.rate;

// For intra-state (same state)
if (party.stateCode === firmStateCode) {
  cgst = (taxableValue * gstRate / 100) / 2;
  sgst = (taxableValue * gstRate / 100) / 2;
  igst = 0;
} else {
  // Inter-state
  cgst = 0;
  sgst = 0;
  igst = taxableValue * gstRate / 100;
}
```

### Edit Bill Workflow

**Actors**: Admin/Manager
**Purpose**: Modify existing sales bills while maintaining data integrity

**Edit Bill Process**:
1. **Access Sales Report**: Navigate to sales report page with AG Grid
2. **Select Bill**: Click edit button on desired bill row
3. **SPA Navigation**: Iframe communicates with parent for SPA routing
4. **Bill Loading**: Fetch existing bill data from API
5. **Form Population**: Pre-fill all bill fields with existing data
6. **Edit Session**: Modify bill details, items, parties, charges
7. **Save Changes**: Update bill via PUT request
8. **State Cleanup**: Clear temporary sessionStorage data

**Business Rules for Edit Mode**:
- Bill number cannot be changed (prevents sequence conflicts)
- Bill date can be modified within current financial year
- Party information can be updated (triggers GST recalculation)
- Items can be added, removed, or modified
- Other charges can be adjusted
- Stock levels updated only on final save
- Audit trail maintained with user and timestamp

**SessionStorage State Management**:
```javascript
// Critical for SPA routing - prevents navigation timing issues
function handleEditBillNavigation(billId) {
  // Store in sessionStorage as fallback for SPA routing
  sessionStorage.setItem('editBillId', billId.toString());
  
  // Navigate using Navigo router
  window.router.navigate('/inventory/sls?edit=' + billId);
}

// Clear sessionStorage after successful data loading
function cleanupEditState() {
  // Prevents persistence across navigation
  sessionStorage.removeItem('editBillId');
}
```

**Data Integrity Safeguards**:
- Bill number preservation in edit mode
- Stock quantity validation before save
- GST recalculation on party/item changes
- Transaction rollback on save failure
- Audit logging of all changes

## Accounting Integration

### Ledger Entries

**Automatic Journal Entries**:
- **Sales**: Debit customer, Credit sales revenue, Credit GST output
- **Purchase**: Debit purchase expense, Debit GST input, Credit supplier
- **Payments**: Debit bank, Credit customer/supplier

**Double-Entry Principle**:
```sql
-- Sales transaction
INSERT INTO ledger (firm_id, account_head, debit_amount, credit_amount, narration, bill_id)
VALUES
  (?, 'Customer A', 11800, 0, 'Sales invoice', ?),           -- Debit customer
  (?, 'Sales Revenue', 0, 10000, 'Sales invoice', ?),        -- Credit revenue
  (?, 'Output GST', 0, 1800, 'GST on sales', ?);             -- Credit GST
```

### Financial Reporting

**Period-based Reports**:
- Monthly profit & loss
- Balance sheet
- GST returns (GSTR-1, GSTR-3B)
- Trial balance

**GST Compliance**:
- Automatic GST calculation
- HSN-wise summary
- Intra-state vs Inter-state tracking
- Reverse charge mechanism

## Data Integrity and Validation

### Business Rule Enforcement

**Database Constraints**:
```sql
-- Unique constraints
CREATE UNIQUE INDEX idx_master_rolls_aadhar_firm ON master_rolls(aadhar, firm_id);
CREATE UNIQUE INDEX idx_wages_unique_firm_employee_month ON wages(firm_id, master_roll_id, salary_month);

-- Check constraints
status TEXT CHECK(status IN ('pending','approved','rejected')) DEFAULT 'pending'
role TEXT CHECK(role IN ('user','manager','admin','super_admin')) DEFAULT 'user'
```

**Application-Level Validation**:
```javascript
// Date validation
if (dateOfJoining > new Date().toISOString()) {
  throw new Error('Joining date cannot be in future');
}

// Amount validation
if (grossSalary <= 0) {
  throw new Error('Gross salary must be positive');
}

// Relationship validation
const employee = MasterRoll.getById.get(masterRollId, firmId);
if (!employee) {
  throw new Error('Employee not found in this firm');
}
```

### Audit Trail

**Change Tracking**:
- All business records include `created_by`, `updated_by`
- Timestamps for `created_at`, `updated_at`
- User action logging

**Audit Query Example**:
```sql
SELECT
  w.*,
  mr.employee_name,
  cu.fullname as created_by_name,
  uu.fullname as updated_by_name
FROM wages w
JOIN master_rolls mr ON mr.id = w.master_roll_id
LEFT JOIN users cu ON cu.id = w.created_by
LEFT JOIN users uu ON uu.id = w.updated_by
WHERE w.firm_id = ?
ORDER BY w.updated_at DESC
```

## Workflow Automation

### Scheduled Processes

**Monthly Payroll Processing**:
1. Identify eligible employees
2. Calculate wage components
3. Generate payroll reports
4. Notify approvers

**GST Filing Reminders**:
1. Track bill creation dates
2. Calculate filing deadlines
3. Send notification alerts

### Batch Operations

**Bulk Wage Creation**:
- Process multiple employees simultaneously
- Validate all data before committing
- Provide detailed success/failure reports

**Bulk Payments**:
- Process salary payments in batches
- Generate bank transfer files
- Track payment status

## Error Handling and Recovery

### Business Logic Errors

**Validation Error Handling**:
```javascript
try {
  // Business logic
  validateWageData(wageData);
  createWageRecord(wageData);
  res.json({ success: true });
} catch (error) {
  console.error('Wage creation error:', error);
  res.status(400).json({
    success: false,
    error: error.message,
    code: error.code || 'VALIDATION_ERROR'
  });
}
```

**Recovery Mechanisms**:
- Transaction rollbacks for multi-step operations
- Partial success handling for bulk operations
- Data consistency checks
- Manual correction workflows

This comprehensive business logic ensures data integrity, regulatory compliance, and operational efficiency across all modules of the Node Navigo application.
