# Security Implementation Guide

## Overview

Node Navigo implements multiple layers of security to protect user data and prevent common web vulnerabilities. This document details the security measures, implementation patterns, and best practices used throughout the application.

## Architecture Security

### Content Security Policy (CSP)

**Implementation**: Strict CSP headers in `server/index.js`

```javascript
res.setHeader(
  "Content-Security-Policy",
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
);
```

**Benefits**:
- Prevents XSS attacks by restricting resource loading
- Blocks inline scripts and styles
- Only allows resources from same origin
- Prevents clickjacking with `frame-ancestors 'none'`

**CSP-Compliant Code Patterns**:
```javascript
// ❌ AVOID: Inline event handlers (blocked by CSP)
<button onclick="handleClick()">Click me</button>

// ✅ USE: addEventListener (allowed by CSP)
document.getElementById('myButton').addEventListener('click', handleClick);

// ❌ AVOID: Inline styles (blocked by CSP)
<div style="color: red;">Content</div>

// ✅ USE: CSS classes (allowed by CSP)
<div class="text-red-500">Content</div>
```

### Authentication System

#### JWT Token Management

**Access Tokens**:
- **Expiration**: 15 minutes
- **Storage**: HttpOnly cookies
- **Purpose**: API authentication

**Refresh Tokens**:
- **Expiration**: 30 days
- **Storage**: HttpOnly cookies
- **Purpose**: Access token renewal

**Implementation** (`server/middleware/auth.js`):

```javascript
export async function authenticateJWT(req, res, next) {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  // 1. Try access token first
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (accessErr) {
      // Access token invalid, try refresh
    }
  }

  // 2. Try refresh token
  if (refreshToken) {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = getUserById.get(payload.id);

    if (user && user.status === 'approved') {
      // Issue new access token
      const newAccessToken = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "15m" });
      res.cookie('accessToken', newAccessToken, { httpOnly: true, secure: true, sameSite: 'lax' });
      req.user = jwt.decode(newAccessToken);
      return next();
    }
  }

  return res.status(401).json({ error: "Unauthorized" });
}
```

#### Password Security

**Hashing Algorithm**: bcrypt with cost factor 12
```javascript
const hashedPassword = await bcrypt.hash(password, 12);
const isValid = await bcrypt.compare(password, hashedPassword);
```

**Password Requirements**:
- Minimum length: 8 characters (client-side validation)
- No complexity requirements (flexible for users)
- Secure storage with bcrypt

### Authorization & Access Control

#### Role-Based Access Control (RBAC)

**User Roles**:
- `super_admin`: Full system access
- `admin`: Firm management and user approval
- `manager`: Firm data access with limitations
- `user`: Basic access within firm

**Middleware Implementation**:

```javascript
// Role requirement middleware
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(" or ")}` });
    }

    next();
  };
};

// Firm ownership middleware
export const requireSameFirmOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const targetFirmId = req.params.firm_id || req.body.firm_id || req.query.firm_id;

  // Admin can access any firm
  if (req.user.role === 'admin') {
    return next();
  }

  // Non-admin must belong to same firm
  if (req.user.firm_id !== targetFirmId) {
    return res.status(403).json({ error: "Access denied. You can only access data from your firm." });
  }

  next();
};
```

#### Data Isolation

**Firm-Based Data Separation**:
- All business data includes `firm_id` foreign key
- Automatic filtering by `req.user.firm_id`
- Database-level constraints prevent cross-firm access

**Example Query Pattern**:
```javascript
// ✅ SECURE: Always filter by firm_id
const wages = db.prepare(`
  SELECT * FROM wages
  WHERE firm_id = ? AND salary_month = ?
`).all(req.user.firm_id, month);

// ❌ INSECURE: No firm filtering
const allWages = db.prepare('SELECT * FROM wages').all();
```

## Input Validation & Sanitization

### Server-Side Validation

**Request Validation Patterns**:
```javascript
export async function createWage(req, res) {
  const { month, master_roll_id, gross_salary } = req.body;

  // Type validation
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
  }

  // Required field validation
  if (!master_roll_id || gross_salary === undefined) {
    return res.status(400).json({ error: 'master_roll_id and gross_salary are required' });
  }

  // Business logic validation
  const existingWage = checkWageExistsStmt.get(req.user.firm_id, master_roll_id, month);
  if (existingWage) {
    return res.status(409).json({ error: 'Wage already exists for this employee in this month' });
  }

  // ... rest of logic
}
```

### SQL Injection Prevention

**Prepared Statements**: All database queries use prepared statements
```javascript
// ✅ SECURE: Parameterized queries
const getUserById = db.prepare(`
  SELECT * FROM users WHERE id = ?
`);

// ❌ INSECURE: String concatenation
const query = `SELECT * FROM users WHERE id = ${userId}`;
```

**Positional Parameters**: Converted from named parameters for better performance
```javascript
// ✅ SECURE: Positional parameters
const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
stmt.run(name, email);

// ❌ INSECURE: Named parameters (vulnerable in some contexts)
const stmt = db.prepare('INSERT INTO users (name, email) VALUES (:name, :email)');
stmt.run({ name, email });
```

## Session Management

### Cookie Security

**Access Token Cookie**:
```javascript
res.cookie('accessToken', token, {
  httpOnly: true,           // Prevents JavaScript access
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
  sameSite: 'lax',          // CSRF protection
  maxAge: 15 * 60 * 1000    // 15 minutes
});
```

**Refresh Token Cookie**:
```javascript
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000  // 30 days
});
```

### Session Timeout Handling

**Client-Side Session Monitoring**:
```javascript
// Automatic logout on session expiration
function startAccessTokenTimer(expMs) {
  const remaining = expMs - Date.now();

  if (remaining <= 0) {
    clearAccessTokenTimer();
    // Redirect to login
    window.location.href = '/auth';
    return;
  }

  // Visual countdown timer
  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  timerEl.textContent = `${m}:${s}`;
}
```

## Data Protection

### Database Security

**Connection Security**:
- Turso (hosted SQLite) with authentication tokens
- Encrypted connections (TLS)
- No direct database file access

**Data Encryption**:
- Passwords: bcrypt hashing
- Refresh tokens: bcrypt hashing in database
- No sensitive data stored in plain text

### API Security

**Rate Limiting**: Not implemented (consider adding for production)

**Request Size Limits**: Express default limits apply

**Error Handling**: Sanitized error responses
```javascript
// ✅ SECURE: Generic error messages
catch (error) {
  console.error('Error:', error);  // Log full error server-side
  res.status(500).json({ error: 'Internal server error' });  // Generic client response
}

// ❌ INSECURE: Detailed error exposure
catch (error) {
  res.status(500).json({ error: error.message, stack: error.stack });
}
```

## Frontend Security

### XSS Prevention

**Template Literal Safety**:
```javascript
// ✅ SECURE: Proper escaping with textContent
const div = document.createElement('div');
div.textContent = userInput;  // Automatically escapes HTML
element.appendChild(div);

// ✅ SECURE: Template literals for safe content
const html = `<div>${escapeHtml(userInput)}</div>`;
```

**Event Handler Security**:
```javascript
// ✅ SECURE: Proper event delegation
document.addEventListener('click', (e) => {
  if (e.target.matches('.delete-btn')) {
    const id = e.target.dataset.id;
    deleteItem(id);
  }
});
```

### CSRF Protection

**SameSite Cookies**: `lax` setting prevents CSRF
**Origin Validation**: CSP restricts cross-origin requests
**Token Validation**: JWT tokens prevent unauthorized API calls

## Security Monitoring

### Logging

**Authentication Events**:
```javascript
console.log(`🔐 Login attempt: ${emailOrUsername}`);
console.log(`✅ User found: ${user.username} (role: ${user.role})`);
console.log(`❌ Password mismatch for user: ${user.username}`);
```

**Authorization Failures**:
```javascript
console.log(`❌ Firm not approved: ${user.firm_status}`);
console.log(`❌ User not approved: ${user.status}`);
```

### Audit Trail

**Database Auditing**:
- `created_by`, `updated_by` fields on all business tables
- `created_at`, `updated_at` timestamps
- User action tracking

**Example**:
```sql
-- All business tables include audit fields
CREATE TABLE wages (
  -- ... business fields
  created_by INTEGER NOT NULL,
  updated_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);
```

## Security Best Practices

### Development Guidelines

1. **Never Trust User Input**: Always validate and sanitize
2. **Use Prepared Statements**: Prevent SQL injection
3. **Implement Least Privilege**: Minimal permissions per role
4. **Log Security Events**: Monitor authentication attempts
5. **Regular Updates**: Keep dependencies updated
6. **Environment Separation**: Different configs for dev/prod

### Production Checklist

- [ ] Strong, random JWT secrets (256-bit)
- [ ] HTTPS enabled with valid certificate
- [ ] Secure cookie settings (`secure: true`)
- [ ] Database access restricted by IP/firewall
- [ ] Regular security dependency updates
- [ ] CSP headers verified
- [ ] Rate limiting implemented
- [ ] Security monitoring enabled

## Incident Response

### Security Breach Protocol

1. **Immediate Actions**:
   - Revoke compromised JWT secrets
   - Clear all refresh tokens
   - Force password resets for affected users

2. **Investigation**:
   - Review authentication logs
   - Check for unusual access patterns
   - Audit recent database changes

3. **Recovery**:
   - Rotate all secrets
   - Update security configurations
   - Notify affected users

### Monitoring & Alerts

**Key Metrics to Monitor**:
- Failed authentication attempts
- Unusual API call patterns
- Database connection errors
- CSP violation reports

## Compliance Considerations

### Data Protection
- User data isolated by firm boundaries
- Secure password storage with bcrypt
- Audit trails for data changes
- Secure deletion of sensitive data

### Privacy
- Minimal data collection
- Clear data retention policies
- User consent for data processing
- Right to data deletion

This security implementation provides multiple layers of protection while maintaining usability. Regular security reviews and updates are essential for maintaining the application's security posture.
