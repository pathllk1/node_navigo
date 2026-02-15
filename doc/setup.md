# Setup and Installation Guide

## Prerequisites

Before setting up Node Navigo, ensure you have the following installed:

### System Requirements
- **Node.js**: Version 18.x or higher (ES modules support required)
- **npm**: Latest version (comes with Node.js)
- **SQLite**: Database engine (built-in with better-sqlite3)
- **Git**: For version control

### Database Requirements
- **Turso Account**: For hosted SQLite database
  - Sign up at [turso.tech](https://turso.tech)
  - Create a database instance
  - Obtain database URL and auth token

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd node_navigo
```

### 2. Install Dependencies
```bash
npm install
```

This will install all required packages including:
- **express**: Web framework
- **better-sqlite3**: SQLite database driver
- **jsonwebtoken**: JWT token handling
- **bcrypt**: Password hashing
- **libsql**: Turso database client
- **@tailwindcss/cli**: CSS framework
- **navigo**: Client-side routing

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration (Turso)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here

# JWT Secrets (Generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# Server Configuration
NODE_ENV=development
PORT=3001
```

### 4. Database Setup

The database is automatically initialized when the server starts. The application includes:

- **Automatic Schema Creation**: Tables are created on first run
- **Migration System**: Handles schema updates safely
- **Seed Data**: Optional super admin account creation

### 5. Build CSS Assets
```bash
# For development (watch mode)
npm run watch:css

# For production (minified)
npm run build:css
```

## Running the Application

### Development Mode
```bash
npm run dev
```
- Starts server with nodemon for auto-restart
- Enables development features
- Access at: http://localhost:3001

### Production Mode
```bash
npm start
```
- Starts server in production mode
- Optimizes performance
- Enables production security features

## Initial Setup

### 1. Create Super Admin Account
```bash
npm run seed-admin
```

### 2. Access Admin Panel
1. Navigate to `/auth`
2. Login with super admin credentials
3. Access admin panel at `/admin`

### 3. Create First Firm
1. Go to Admin Panel
2. Create a new firm with admin account
3. The system will generate a firm code for user registration

## User Registration Flow

### For New Firms
1. **Super Admin** creates firm via Admin Panel
2. **Firm Admin** receives firm code
3. **Employees** register using firm code at `/auth`
4. **Firm Admin** approves pending user registrations

### Firm Code Format
- Auto-generated 6-character alphanumeric code
- Case-insensitive
- Unique across all firms

## Directory Structure

```
node_navigo/
├── server/                 # Backend application
│   ├── controllers/       # Business logic controllers
│   ├── middleware/        # Authentication & authorization
│   ├── routes/           # API route definitions
│   ├── utils/            # Database setup & utilities
│   └── index.js          # Express server entry point
├── public/                # Frontend static files
│   ├── pages/            # Page components
│   ├── components/       # Reusable UI components
│   ├── js/               # Client-side JavaScript
│   ├── css/              # Compiled CSS
│   └── index.html        # SPA entry point
├── scripts/               # Utility scripts
├── tests/                 # Test suites
├── data/                  # Sample data & fixtures
├── doc/                   # Documentation
├── node_modules/         # Dependencies
├── package.json          # Project configuration
├── tailwind.config.js    # CSS framework config
└── .env                  # Environment variables
```

## Configuration Options

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `TURSO_DATABASE_URL` | Turso database URL | Yes | - |
| `TURSO_AUTH_TOKEN` | Turso authentication token | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | Yes | - |
| `NODE_ENV` | Environment mode | No | development |
| `PORT` | Server port | No | 3001 |

### Database Configuration

The application uses Turso for distributed SQLite:

- **Connection**: Automatic via libsql
- **Schema**: Auto-migration on startup
- **Backup**: Manual export via Turso dashboard

## Troubleshooting

### Common Issues

#### Database Connection Failed
```
Error: Unable to connect to database
```
**Solution**:
1. Verify TURSO_DATABASE_URL is correct
2. Check TURSO_AUTH_TOKEN validity
3. Ensure network connectivity to Turso

#### CSS Not Loading
```
Tailwind classes not applied
```
**Solution**:
1. Run `npm run build:css`
2. Check `public/output.css` exists
3. Verify browser cache

#### Authentication Issues
```
JWT token invalid
```
**Solution**:
1. Clear browser cookies
2. Restart server
3. Check JWT secrets in .env

### Development Tips

#### Database Reset
To reset database during development:
1. Delete `server/data.sqlite` (local) or drop via Turso dashboard
2. Restart server (auto-creates schema)
3. Run seed scripts if needed

#### Debug Mode
Enable detailed logging:
```bash
DEBUG=* npm run dev
```

## Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use production database URL
3. Configure proper JWT secrets
4. Set up process manager (PM2 recommended)

### Build Process
```bash
npm run build:css
npm start
```

### Security Checklist
- [ ] Strong JWT secrets (256-bit random)
- [ ] HTTPS enabled
- [ ] Secure cookie settings
- [ ] Database access restricted
- [ ] Regular security updates

## Support

For setup issues:
1. Check application logs
2. Verify environment configuration
3. Test database connectivity
4. Review firewall settings

See detailed documentation in other files for specific module setup.
