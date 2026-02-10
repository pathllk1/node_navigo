# Deployment Checklist

## ✅ Pre-Deployment Checklist

### Database
- [ ] Database schema updated with new fields
- [ ] Super admin seeded successfully
- [ ] Existing users have status set to 'approved' (if migrating)
- [ ] Existing firms have status set to 'approved' (if migrating)
- [ ] Database backup created

### Security
- [ ] Super admin password changed from default
- [ ] JWT_SECRET set in environment variables
- [ ] JWT_REFRESH_SECRET set in environment variables
- [ ] Passwords are hashed with bcrypt (salt rounds: 12)
- [ ] HTTPS enabled in production
- [ ] CORS configured properly
- [ ] CSP headers configured

### Code
- [ ] All files created successfully
- [ ] No syntax errors (run diagnostics)
- [ ] All routes registered in server/index.js
- [ ] Middleware applied correctly
- [ ] Error handling implemented

### Testing
- [ ] Super admin can login
- [ ] Super admin can access /admin
- [ ] Super admin can create firms
- [ ] Super admin can approve users
- [ ] Regular users cannot access /admin
- [ ] Pending users cannot login
- [ ] Approved users can login
- [ ] Firm users can access their data
- [ ] Users cannot access other firms' data

## 🚀 Deployment Steps

### 1. Environment Setup
```bash
# Create .env file
JWT_SECRET=your_super_secret_key_here
JWT_REFRESH_SECRET=your_super_refresh_secret_here
NODE_ENV=production
PORT=3001
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Initialization
```bash
# Database will auto-initialize on first run
# Super admin will be auto-created
npm start
```

### 4. Verify Super Admin
```bash
# Or manually seed if needed
npm run seed-admin
```

### 5. Change Default Password
- Login as super admin
- Navigate to profile/settings
- Change password immediately

### 6. Create First Firm
- Login as super admin
- Go to Admin Panel
- Create a test firm
- Verify firm and admin are created

### 7. Test User Registration
- Logout
- Register as new user
- Login as super admin
- Approve the user
- Login as new user
- Verify access

## 📋 Post-Deployment Verification

### Functional Tests
- [ ] Login page loads
- [ ] Registration page loads
- [ ] Admin panel loads (super admin only)
- [ ] Master roll dashboard loads (firm users)
- [ ] Wages dashboard loads (firm users)
- [ ] Sidebar shows correct links based on role
- [ ] Logout works correctly

### Security Tests
- [ ] Cannot access /admin without super_admin role
- [ ] Cannot access firm data from different firm
- [ ] Pending users cannot login
- [ ] Rejected users cannot login
- [ ] Token expiration works
- [ ] Token refresh works
- [ ] Invalid tokens are rejected

### API Tests
```bash
# Test login
curl -X POST http://localhost:3001/auth/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"superadmin@system.com","password":"SuperAdmin@123"}'

# Test admin stats (with token)
curl -X GET http://localhost:3001/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test user registration
curl -X POST http://localhost:3001/auth/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firmCode":"TEST123","username":"testuser","email":"test@test.com","fullname":"Test User","password":"password123"}'
```

## 🔧 Configuration

### Production Settings

#### server/index.js
```javascript
// Ensure these are set
const PORT = process.env.PORT || 3001;
```

#### JWT Configuration
```javascript
// In auth routes and middleware
const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your_super_refresh_secret";
```

#### Database
```javascript
// Ensure database path is correct
const dbPath = path.join(__dirname, '..', 'data.sqlite');
```

### Optional Enhancements

#### Email Notifications
- [ ] Configure email service (SendGrid, AWS SES, etc.)
- [ ] Send email on user registration
- [ ] Send email on approval/rejection
- [ ] Send email on firm creation

#### Rate Limiting
```javascript
// Install express-rate-limit
npm install express-rate-limit

// Add to server/index.js
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/auth/', limiter);
```

#### Logging
```javascript
// Install winston
npm install winston

// Add logging for admin actions
// Log all approvals/rejections
// Log all firm creations
```

#### Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Set up performance monitoring
- [ ] Set up uptime monitoring
- [ ] Set up database monitoring

## 🐛 Troubleshooting

### Common Issues

#### Super Admin Not Created
**Problem:** Super admin doesn't exist in database
**Solution:**
```bash
npm run seed-admin
```

#### Cannot Access Admin Panel
**Problem:** Getting 403 error
**Solution:**
- Verify you're logged in as super_admin
- Check localStorage: `JSON.parse(localStorage.getItem('currentUser')).role`
- Clear localStorage and login again

#### Users Cannot Login After Approval
**Problem:** Approved users still cannot login
**Solution:**
- Check user status in database: `SELECT status FROM users WHERE email = 'user@example.com'`
- Check firm status: `SELECT status FROM firms WHERE id = X`
- Verify both are 'approved'

#### Token Errors
**Problem:** Token expired or invalid errors
**Solution:**
- Check JWT_SECRET is set correctly
- Verify token expiration times
- Clear localStorage and login again

#### Database Errors
**Problem:** Column doesn't exist errors
**Solution:**
- Database schema may not be updated
- Restart server to trigger migrations
- Check server/utils/db.js for column additions

## 📊 Monitoring

### Key Metrics to Track
- [ ] Number of pending users
- [ ] Number of pending firms
- [ ] Login success/failure rate
- [ ] API response times
- [ ] Error rates
- [ ] Active users per firm

### Database Queries for Monitoring
```sql
-- Pending users count
SELECT COUNT(*) FROM users WHERE status = 'pending';

-- Pending firms count
SELECT COUNT(*) FROM firms WHERE status = 'pending';

-- Users per firm
SELECT f.name, COUNT(u.id) as user_count 
FROM firms f 
LEFT JOIN users u ON u.firm_id = f.id 
GROUP BY f.id;

-- Recent registrations
SELECT * FROM users 
WHERE created_at > datetime('now', '-7 days') 
ORDER BY created_at DESC;
```

## 🔒 Security Hardening

### Production Security Checklist
- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS only
- [ ] Set secure cookie flags
- [ ] Implement rate limiting
- [ ] Add CAPTCHA to registration
- [ ] Enable SQL injection protection
- [ ] Sanitize all user inputs
- [ ] Implement CSP headers
- [ ] Enable CORS with whitelist
- [ ] Add request logging
- [ ] Implement audit trail
- [ ] Regular security audits
- [ ] Keep dependencies updated

### Recommended Security Headers
```javascript
// Add to server/index.js
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

## 📝 Documentation

### User Documentation
- [ ] Create user guide for registration
- [ ] Create admin guide for firm management
- [ ] Create admin guide for user approval
- [ ] Document common workflows
- [ ] Create FAQ document

### Technical Documentation
- [ ] API documentation
- [ ] Database schema documentation
- [ ] Architecture documentation
- [ ] Deployment guide
- [ ] Troubleshooting guide

## 🎯 Success Criteria

### Functional Requirements
✅ Only super admin can create firms
✅ All user registrations require approval
✅ Users cannot login until approved
✅ Firms must be approved for users to login
✅ Admin panel accessible only to super admin
✅ Proper error messages displayed
✅ UI reflects user permissions
✅ Data isolation per firm

### Non-Functional Requirements
✅ Fast response times (<500ms)
✅ Secure authentication
✅ Proper error handling
✅ Clean code structure
✅ Comprehensive documentation
✅ Easy to maintain
✅ Scalable architecture

## 📞 Support Contacts

### For Issues
- Technical Lead: [contact info]
- Database Admin: [contact info]
- Security Team: [contact info]

### Documentation
- ADMIN_SYSTEM_README.md - Complete system documentation
- IMPLEMENTATION_SUMMARY.md - Implementation details
- QUICK_START_GUIDE.md - Quick reference
- SYSTEM_ARCHITECTURE.md - Architecture diagrams

## ✨ Final Steps

1. [ ] Review all checklist items
2. [ ] Test all functionality
3. [ ] Verify security measures
4. [ ] Update documentation
5. [ ] Train administrators
6. [ ] Monitor for issues
7. [ ] Collect feedback
8. [ ] Plan improvements

## 🎉 Deployment Complete!

Once all items are checked:
- System is ready for production use
- Super admin can start creating firms
- Users can register and be approved
- All security measures are in place
- Documentation is complete

**Remember:** Security is an ongoing process. Regularly review and update security measures, monitor for issues, and keep the system updated.
