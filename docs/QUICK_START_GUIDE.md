# Quick Start Guide - Admin System

## 🚀 Getting Started

### 1. Start the Application
```bash
npm start
```
Server will run at: http://localhost:3001

### 2. Login as Super Admin
- Navigate to: http://localhost:3001/auth
- **Email:** `superadmin@system.com`
- **Password:** `SuperAdmin@123`
- ⚠️ **CHANGE THIS PASSWORD IMMEDIATELY!**

### 3. Access Admin Panel
- After login, click "Admin Panel" in sidebar
- Or navigate to: http://localhost:3001/admin

## 📋 Common Tasks

### Create a New Firm
1. Go to Admin Panel
2. Click "Create Firm" tab
3. Fill in:
   - Firm Name (e.g., "ABC Corporation")
   - Firm Code (e.g., "ABC123")
   - Admin Full Name
   - Admin Username
   - Admin Email
   - Admin Password
4. Click "Create Firm & Admin"
5. ✅ Firm and admin are created and auto-approved

### Approve a User Registration
1. User registers at /auth with firm code
2. Go to Admin Panel → "Pending Users" tab
3. Find the user in the list
4. Click "Approve" or "Reject"
5. ✅ User can now login (if approved)

### Manage Firms
1. Go to Admin Panel → "Manage Firms" tab
2. View all firms with their status
3. Approve/Reject/Revoke as needed
4. See user counts per firm

## 👥 User Roles

### Super Admin
- **Access:** Everything
- **Can:**
  - Create firms
  - Approve/reject firms
  - Approve/reject users
  - View all data
- **Cannot:** Belong to a firm

### Firm Admin
- **Access:** Their firm only
- **Can:**
  - Manage master rolls
  - Manage wages
  - View firm users
- **Cannot:** Create firms or approve users

### Manager
- **Access:** Their firm only
- **Can:**
  - Manage master rolls
  - Manage wages
  - View firm users

### User
- **Access:** Their firm only
- **Can:**
  - View data (based on permissions)

## 🔐 Registration Flow

### For New Firms
```
Super Admin → Admin Panel → Create Firm
→ Firm created (approved)
→ Admin account created (approved)
→ Admin can login immediately
```

### For New Users
```
User → Register with firm code
→ Account created (pending)
→ Super Admin approves
→ User can login
```

## ⚠️ Important Rules

1. **Only Super Admin can create firms**
2. **All user registrations need approval**
3. **Users must belong to an approved firm**
4. **Super Admin doesn't belong to any firm**
5. **Change default super admin password!**

## 🔍 Checking Status

### Check Your Role
```javascript
// In browser console
JSON.parse(localStorage.getItem('currentUser')).role
```

### Check User Status
```javascript
// In browser console
JSON.parse(localStorage.getItem('currentUser')).status
```

## 🐛 Troubleshooting

### "Access Denied" when accessing /admin
- You must be logged in as super_admin
- Regular admins cannot access admin panel

### "Account pending approval"
- Your account needs super admin approval
- Contact system administrator

### "Firm is not approved yet"
- The firm needs super admin approval
- Contact system administrator

### Cannot see Admin Panel link
- Only super_admin role can see it
- Check your role in localStorage

### Super admin not created
```bash
npm run seed-admin
```

## 📊 Admin Panel Features

### Dashboard
- Total firms count
- Pending firms count
- Pending users count

### Create Firm Tab
- Create new firm with admin account
- All fields required
- Firm code must be unique
- Auto-approved when created by super admin

### Manage Firms Tab
- View all firms
- See user counts
- Approve/Reject/Revoke access
- Filter by status

### Pending Users Tab
- View all pending registrations
- See user details and firm
- Approve or reject
- Real-time updates

## 🎯 Testing Workflow

1. **Login as super admin**
   ```
   Email: superadmin@system.com
   Password: SuperAdmin@123
   ```

2. **Create a test firm**
   ```
   Firm: Test Corp
   Code: TEST123
   Admin: Test Admin / testadmin / test@test.com / password123
   ```

3. **Logout and register as user**
   ```
   Firm Code: TEST123
   Name: Test User
   Username: testuser
   Email: user@test.com
   Password: password123
   ```

4. **Login as super admin again**
   - Go to Pending Users
   - Approve the test user

5. **Login as test user**
   - Should work now
   - Can access master roll and wages

## 📱 UI Navigation

### Sidebar Links (Conditional)
- **Home** - Everyone
- **Admin Panel** - Super admin only
- **Master Roll** - Firm users only
- **Wages** - Firm users only
- **About/Contact/Services** - Everyone
- **Auth** - Everyone
- **Logout** - Logged in users only

## 🔒 Security Checklist

- [ ] Changed super admin password
- [ ] Using HTTPS in production
- [ ] JWT secrets in environment variables
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Database backed up
- [ ] Audit logging enabled (optional)
- [ ] Email notifications configured (optional)

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs
3. Verify database schema is updated
4. Review ADMIN_SYSTEM_README.md
5. Check IMPLEMENTATION_SUMMARY.md

## 🎉 Success!

You now have a fully functional admin-controlled registration system where:
- ✅ Only super admin can create firms
- ✅ All users need approval
- ✅ Proper access control is enforced
- ✅ Admin panel for management
- ✅ Secure authentication flow
