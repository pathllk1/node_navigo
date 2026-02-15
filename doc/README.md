# Node Navigo Documentation

This documentation provides comprehensive analysis and reference for the Node Navigo application - a full-stack business management system.

## Table of Contents

### Application Overview
- [Overview](overview.md) - High-level application summary, architecture, and features

### Technical Documentation
- [Setup and Installation](setup.md) - Complete setup guide with prerequisites and configuration
- [Security Implementation](security.md) - Detailed security measures, authentication, and CSP
- [Business Logic and Workflows](business-logic.md) - Business rules, workflows, and data integrity
- [Frontend Architecture](frontend.md) - Client-side components, routing, and UI patterns
- [API Reference](api.md) - Complete REST API documentation with endpoints and authentication
- [Database Schema](database.md) - Database structure, tables, relationships, and constraints

### Development Guide
- [Contributing Guidelines](contributing.md) - Development workflow and best practices
- [Troubleshooting](troubleshooting.md) - Common issues and solutions

## Quick Start

1. **Prerequisites**: Node.js 18+, npm, Turso account
2. **Install**: `npm install`
3. **Configure**: Create `.env` with database credentials
4. **Build CSS**: `npm run build:css`
5. **Run**: `npm run dev`
6. **Access**: http://localhost:3001

## Architecture Overview

### Backend (Node.js + Express)
- **Authentication**: JWT with refresh tokens
- **Database**: Turso (SQLite-compatible)
- **Security**: Strict CSP, role-based access control
- **API**: RESTful endpoints with validation

### Frontend (Vanilla JS + Navigo)
- **Routing**: Client-side SPA routing
- **Styling**: Tailwind CSS with utility classes
- **Icons**: Heroicons (CSP-compliant)
- **State**: Session-based user management

### Business Modules
- **User Management**: Multi-tenant firm-based access
- **Payroll**: Employee master rolls and wage processing
- **Inventory**: Stock management with GST compliance
- **Accounting**: Double-entry ledger system

## Key Features

- **Multi-tenant Architecture**: Firm-based data isolation
- **Role-Based Security**: super_admin, admin, manager, user roles
- **GST Compliance**: Automated tax calculations for Indian businesses
- **Payroll Management**: Complete employee lifecycle management
- **Inventory Control**: Stock tracking with batch support
- **Audit Trails**: Complete change history tracking

## Security Highlights

- Content Security Policy (CSP) with 'self' origins only
- JWT authentication with automatic refresh
- Bcrypt password hashing
- Prepared statements for SQL injection prevention
- Firm-based data isolation
- Role-based API access control

## Development

### Environment Setup
```bash
# Clone repository
git clone <repo-url>
cd node_navigo

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Turso credentials

# Build CSS
npm run build:css

# Start development server
npm run dev
```

### Project Structure
```
node_navigo/
├── server/                 # Backend application
│   ├── controllers/       # Business logic (CRUD operations)
│   ├── middleware/        # Auth & authorization middleware
│   ├── routes/           # API route definitions
│   ├── utils/            # Database setup & utilities
│   └── index.js          # Express server entry point
├── public/                # Frontend static files
│   ├── pages/            # Page components (AuthPage, WagesDashboard, etc.)
│   ├── components/       # Reusable UI components
│   └── index.html        # SPA entry point
├── scripts/               # Database migration & utility scripts
├── data/                  # Sample data for testing
├── doc/                   # This documentation
└── package.json          # Project configuration
```

## API Overview

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout

### Business Endpoints
- `/api/master-rolls` - Employee management
- `/api/wages` - Payroll processing
- `/api/inventory/*` - Stock and billing
- `/api/settings` - Application configuration

### Admin Endpoints
- `/admin/firms` - Firm management (super_admin only)
- `/admin/users` - User administration

## Database Schema

### Core Tables
- `firms` - Company/organization information
- `users` - User accounts with roles and firm associations
- `master_rolls` - Employee master records
- `wages` - Monthly payroll records

### Inventory Tables
- `stocks` - Inventory items with batch tracking
- `parties` - Customers and suppliers
- `bills` - Sales/purchase invoices
- `stock_reg` - Stock movement history

### Accounting Tables
- `ledger` - General ledger entries
- `bill_sequences` - Bill number generation

## Business Workflows

### Firm Onboarding
1. Super admin creates firm
2. Firm admin account generated
3. Employees register with firm code
4. Admin approves user accounts

### Payroll Processing
1. Create employee master records
2. Monthly wage calculation
3. Bulk wage entry with validations
4. Payment recording and tracking

### Inventory Management
1. Stock item creation with HSN codes
2. Party (customer/supplier) management
3. Bill creation with GST calculations
4. Automatic ledger entries

## Support

For technical questions or issues:
1. Check the detailed documentation in each section
2. Review server logs for error details
3. Verify environment configuration
4. Test database connectivity

---

**Version**: 1.0.0
**Last Updated**: February 2026
**Node.js**: 18.x+
**Database**: Turso (SQLite)
