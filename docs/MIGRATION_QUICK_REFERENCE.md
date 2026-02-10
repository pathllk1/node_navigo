# Migration Quick Reference

## What We're Migrating

**From**: node_ejs (Express + EJS + SQLite)
**To**: Current Navigo SPA app

## Core Modules to Migrate

### 1. Inventory System (5 sub-modules)
- Sales (SLS)
- Purchase (PRS)
- Credit Note (CNT)
- Debit Note (DNT)
- Delivery Note (DLN)

### 2. Ledger/Accounts
- Chart of Accounts
- Ledger Entries
- Trial Balance
- General Ledger
- Financial Reports

### 3. Vouchers
- Payment Vouchers
- Receipt Vouchers
- Journal Vouchers

### 4. Banking
- Bank Accounts
- Transactions
- Reconciliation

### 5. Party Management
- Customers/Suppliers
- Multiple GST support
- Party Ledger

### 6. Stock Management
- Items
- Batches
- Movements
- Register

### 7. Reports
- Sales Reports
- Purchase Reports
- Stock Reports
- GST Reports
- Financial Reports

## Implementation Approach

### Backend Strategy
✅ Keep Express.js
✅ Add new routes/controllers
✅ Use existing SQLite database
✅ Maintain JWT authentication
✅ Add firm-based authorization

### Frontend Strategy
✅ Keep Navigo routing
✅ Use .js file components (like WagesDashboard.js)
✅ Maintain Tailwind CSS styling
✅ Follow existing patterns
✅ Event delegation for CSP compliance

### Database Strategy
✅ Extend existing schema
✅ Add new tables (bill_sequences, vouchers, etc.)
✅ Enhance existing tables
✅ Migration scripts for data

## Key Files to Create

### Backend
```
server/routes/
  - inventory.routes.js
  - ledger.routes.js
  - vouchers.routes.js
  - parties.routes.js
  - banks.routes.js
  - reports.routes.js

server/controllers/
  - inventory/ (sales, purchase, etc.)
  - ledger.controller.js
  - vouchers.controller.js
  - parties.controller.js
  - banks.controller.js
  - reports.controller.js

server/utils/
  - billNumberGenerator.js
  - gstCalculator.js
  - pdfGenerator.js
  - ledgerHelper.js
```

### Frontend
```
public/pages/
  - inventory/
    - InventoryDashboard.js
    - SalesBills.js
    - PurchaseBills.js
    - StockManagement.js
  - ledger/
    - LedgerDashboard.js
    - ChartOfAccounts.js
    - TrialBalance.js
  - vouchers/
    - VouchersDashboard.js
    - PaymentVoucher.js
    - ReceiptVoucher.js
  - parties/
    - PartiesDashboard.js
  - banking/
    - BanksDashboard.js
  - reports/
    - ReportsDashboard.js

public/components/
  - inventory/
  - ledger/
  - common/
```

## Estimated Effort

**Total**: 15-20 weeks (3.5-5 months)

**Phase Breakdown**:
1. Foundation (2 weeks)
2. Party Management (1 week)
3. Stock Management (1 week)
4. Sales Module (2 weeks)
5. Purchase Module (1 week)
6. Ledger System (2 weeks)
7. Voucher System (1 week)
8. Banking Module (1 week)
9. Reports Module (2 weeks)
10. Additional Modules (2 weeks)
11. Testing (2 weeks)
12. Documentation (1 week)

## API Endpoints Count

- Inventory: ~40 endpoints
- Ledger: ~15 endpoints
- Vouchers: ~12 endpoints
- Parties: ~10 endpoints
- Banking: ~8 endpoints
- Reports: ~15 endpoints

**Total**: ~100 new API endpoints

## UI Pages Count

- Inventory: ~8 pages
- Ledger: ~5 pages
- Vouchers: ~4 pages
- Parties: ~3 pages
- Banking: ~3 pages
- Reports: ~6 pages

**Total**: ~30 new pages

## Database Tables

**New Tables**:
- bill_sequences
- firm_settings
- party_gsts
- bank_accounts
- vouchers
- settings
- request_logs
- migrations_log

**Enhanced Tables**:
- bills
- parties
- stocks
- ledger
- firms

## Key Features

### Inventory
- Multi-type bills (Sales, Purchase, CN, DN, DLN)
- Auto bill numbering per firm/FY
- GST calculations (CGST, SGST, IGST)
- Stock auto-update
- PDF generation
- Batch tracking

### Ledger
- Double-entry bookkeeping
- Auto-posting from bills/vouchers
- Trial balance
- General ledger
- Account statements
- Financial reports

### Vouchers
- Payment vouchers
- Receipt vouchers
- Journal vouchers
- Auto voucher numbering
- Ledger integration

### Banking
- Multiple bank accounts per firm
- Bank transactions
- Reconciliation
- Balance tracking

### Reports
- Sales summary
- Purchase summary
- Stock summary
- GST reports
- P&L statement
- Balance sheet
- Cash flow

## Migration Principles

1. ✅ **100% Feature Parity**: All features from node_ejs
2. ✅ **No Breaking Changes**: Existing features work
3. ✅ **Incremental**: Module by module
4. ✅ **Tested**: Each module fully tested
5. ✅ **Documented**: Comprehensive docs
6. ✅ **Secure**: CSP/XSS compliant
7. ✅ **Performant**: Optimized queries
8. ✅ **Consistent**: Follow current app patterns

## Success Criteria

- [ ] All features working
- [ ] UI consistent with current app
- [ ] Performance < 2s page load
- [ ] No security vulnerabilities
- [ ] All tests passing
- [ ] Documentation complete
- [ ] User acceptance achieved

## Next Steps

1. Review plan with team
2. Prioritize modules
3. Set up dev environment
4. Create detailed tasks for Phase 1
5. Begin implementation

---

**Status**: PLANNING PHASE
**No implementation yet - awaiting approval**
