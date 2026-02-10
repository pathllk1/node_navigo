# Admin System Implementation

## Overview
This document describes the new admin-controlled registration and firm management system implemented in the application.

## Key Changes

### 1. User Registration Flow
**BEFORE:**
- Anyone could create a new firm and become an admin
- Users could register directly and access the system immediately

**AFTER:**
- Only Super Admin can create firms
- User registration requires admin approval
- All new users start with 'pending' status

### 2. Database Schema Updates

#### Users Table
- Added `status` field: 'pending', 'approved', 'rejected' (default: 'pending')
- Added `super_admin` role type
- Made `firm_id` nullable (super admin doesn't belong to any firm)

#### Firms Table
- Existing `status` field: 'pending', 'approved', 'rejected'

### 3. Super Admin System

#### Default Super Admin Credentials
```
Email: superadmin@system.com
Password: SuperAdmin@123
```

**⚠️ IMPORTANT: Change the password after first login!**

#### Super Admin Capabilities
- Create new firms with admin accounts
- Approve/reject firm registrations
- Approve/reject user registrations
- View all firms and users
- Access admin panel at `/admin`

### 4. New Routes

#### Admin Routes (Super Admin Only)
- `GET /admin/stats` - Dashboard statistics
- `GET /admin/firms` - List all firms
- `POST /admin/firms` - Create new firm with admin
- `PATCH /admin/firms/:id/status` - Approve/reject firm
- `GET /admin/users` - List all users
- `GET /admin/users/pending` - List pending users
- `PATCH /admin/users/:id/status` - Approve/reject user

#### Updated Auth Routes
- `POST /auth/register` - User registration (requires approval)
- Removed `POST /auth/register-firm` (moved to admin panel)

### 5. Admin Panel Features

Access at: `/admin` (Super Admin only)

**Dashboard:**
- Total firms, pending firms, pending users statistics

**Create Firm Tab:**
- Create new firm with admin account
- Firms created by super admin are auto-approved

**Manage Firms Tab:**
- View all firms with user counts
- Approve/reject/revoke firm access
- See pending user counts per firm

**Pending Users Tab:**
- View all pending user registrations
- Approve/reject user accounts
- See user details and firm association

### 6. Updated UI

#### Registration Page
- Removed "Register Firm" tab
- Single "Register" tab for user registration
- Clear message about pending approval

#### Sidebar
- Admin Panel link (visible only to super admin)
- Master Roll and Wages links (visible only to firm users)
- Logout button (visible when logged in)

### 7. Security Enhancements

#### Authentication Checks
- Firm approval status checked on login
- User approval status checked on login
- Token refresh validates both firm and user status
- Middleware validates user status on every request

#### Access Control
- Super admin can access all routes
- Firm admins can only manage their firm
- Users can only access their firm's data

## Setup Instructions

### 1. Database Migration
The database will automatically update when you start the server. The super admin will be created automatically.

### 2. Manual Super Admin Creation (if needed)
```bash
npm run seed-admin
```

### 3. Start the Server
```bash
npm start
# or for development
npm run dev
```

### 4. First Login
1. Navigate to `/auth`
2. Login with super admin credentials
3. Change the password immediately
4. Access admin panel at `/admin`

## Workflow

### Creating a New Firm
1. Super admin logs in
2. Goes to Admin Panel → Create Firm tab
3. Fills in firm details and admin account info
4. Firm and admin are created with 'approved' status

### User Registration
1. User goes to registration page
2. Enters firm code and personal details
3. Account created with 'pending' status
4. Super admin approves/rejects from Admin Panel
5. User can login after approval

### Managing Firms
1. Super admin can view all firms
2. Can approve/reject pending firms
3. Can revoke access to approved firms
4. Can see user counts per firm

### Managing Users
1. Super admin can view all pending users
2. Can approve/reject user registrations
3. Users receive appropriate status
4. Rejected users cannot login

## API Authentication

All protected routes require:
- Valid JWT access token in `Authorization: Bearer <token>` header
- User must have 'approved' status
- User's firm (if applicable) must have 'approved' status

## Error Messages

### Login Errors
- "Your firm is not approved yet" - Firm pending/rejected
- "Your account is pending approval" - User pending approval
- "Invalid credentials" - Wrong email/password

### Registration Errors
- "Firm is not approved yet" - Trying to join unapproved firm
- "Email already registered" - Duplicate email
- "Username already taken" - Duplicate username
- "Invalid firm code" - Firm doesn't exist

## Testing

### Test Super Admin Access
1. Login as super admin
2. Verify admin panel is accessible
3. Create a test firm
4. Verify firm appears in manage firms

### Test User Registration
1. Register a new user with valid firm code
2. Verify user appears in pending users
3. Approve user from admin panel
4. Login with new user credentials

### Test Access Control
1. Try accessing `/admin` as regular user (should fail)
2. Try accessing firm data from different firm (should fail)
3. Verify super admin can access all data

## Troubleshooting

### Super Admin Not Created
Run: `npm run seed-admin`

### Cannot Access Admin Panel
- Verify you're logged in as super admin
- Check role in localStorage: `JSON.parse(localStorage.getItem('currentUser')).role`
- Should be 'super_admin'

### Users Cannot Login After Approval
- Check user status in database
- Verify firm status is 'approved'
- Check JWT token is valid

## Future Enhancements

Potential improvements:
- Email notifications for approvals/rejections
- Bulk user approval
- Firm admin can approve users in their firm
- User role management by firm admin
- Audit log for admin actions
- Password reset functionality
- Two-factor authentication for super admin

## Security Notes

1. **Change default super admin password immediately**
2. Store JWT secrets in environment variables
3. Use HTTPS in production
4. Implement rate limiting on auth endpoints
5. Add CAPTCHA to registration form
6. Log all admin actions
7. Regular security audits
8. Backup database regularly

## Support

For issues or questions:
1. Check this documentation
2. Review error messages in browser console
3. Check server logs
4. Verify database schema is up to date
