# Node Navigo Application Documentation

## Overview

Node Navigo is a Single Page Application (SPA) built with Node.js, Express, and modern frontend technologies. It serves as a comprehensive business management system for firms, handling user authentication, firm management, inventory, wages, and various administrative functions.

## Architecture

### Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: Turso (SQLite-compatible via libsql)
- **Frontend**: Vanilla JavaScript with Navigo for routing
- **Styling**: Tailwind CSS
- **Authentication**: JWT with refresh tokens
- **Security**: Content Security Policy (CSP) with strict 'self' origins

### Project Structure

```
node_navigo/
├── server/                 # Backend code
│   ├── controllers/       # Business logic controllers
│   ├── middleware/        # Authentication and authorization
│   ├── routes/           # API route definitions
│   ├── utils/            # Database setup and utilities
│   └── index.js          # Server entry point
├── public/                # Frontend static files
│   ├── pages/            # Page components
│   ├── components/       # Reusable UI components
│   ├── api.js            # API client functions
│   ├── app.js            # Main application logic
│   ├── sidebar.js        # Sidebar component
│   ├── layout.js         # Layout template
│   └── index.html        # Main HTML template
├── scripts/               # Utility scripts
├── tests/                 # Test files
├── data/                  # Sample data files
└── doc/                   # Documentation (this folder)
```

## Key Features

1. **User Authentication & Authorization**
   - JWT-based authentication with automatic token refresh
   - Role-based access control (super_admin, admin, manager, user)
   - Firm-based data isolation

2. **Firm Management**
   - Create, read, update, delete firms
   - Assign users to firms
   - Firm-specific settings and configurations

3. **Dashboard System**
   - User dashboard with role-based features
   - Admin panel for super administrators
   - Settings management

4. **Business Modules**
   - Wages management
   - Inventory system
   - Master roll management

## Security Features

- Strict CSP headers allowing only 'self' origins
- XSS protection
- Clickjacking prevention
- Secure JWT token handling with refresh mechanisms
- Password hashing with bcrypt
- Role-based middleware for API access control

## Database

Uses Turso (distributed SQLite) with the following main tables:
- `users` - User accounts with roles and firm associations
- `firms` - Firm/company information
- `refresh_tokens` - JWT refresh token storage
- Various business data tables (stocks, bills, parties, etc.)

## Development

### Setup
```bash
npm install
npm run dev  # Start development server with nodemon
```

### Build CSS
```bash
npm run build:css
npm run watch:css  # Watch mode for CSS changes
```

### Database
Database is automatically initialized on server start via `server/utils/db.js`

## API Structure

- `/auth/*` - Authentication endpoints
- `/admin/*` - Administrative functions (super_admin only)
- `/api/*` - Main API endpoints with JWT authentication
- `/tst/*` - Test/development endpoints

## Client-Side Routing

Uses Navigo for SPA routing with the following main routes:
- `/` - Home
- `/auth` - Login/Register
- `/admin` - Admin panel
- `/settings` - User settings
- `/wages` - Wages dashboard
- `/masterroll` - Master roll management
- `/inventory/*` - Inventory system pages
