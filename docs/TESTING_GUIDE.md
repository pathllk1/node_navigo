# 🧪 Testing Guide - Admin System

## ✅ Login is Now Fixed!

The login issue has been resolved. You can now login and test the system.

## 🚀 Quick Test

### 1. Login as Super Admin
1. Open: http://localhost:3001
2. Click "Login/Signup" in sidebar
3. Enter credentials:
   - Email: `superadmin@system.com`
   - Password: `SuperAdmin@123`
4. Click "Login"
5. ✅ Should see welcome message and navigate to home

### 2. Access Admin Panel
1. After login, click "Admin Panel" in sidebar
2. ✅ Should see dashboard with statistics
3. ✅ Should see tabs: Create Firm, Manage Firms, Pending Users

### 3. Create a Test Firm
1. Go to Admin Panel → "Create Firm" tab
2. Fill in:
   - Firm Name: `Test Corporation`
   - Firm Code: `TEST123`
   - Admin Full Name: `Test Admin`
   - Admin Username: `testadmin`
   - Admin Email: `testadmin@test.com`
   - Admin Password: `TestPassword123`
3. Click "Create Firm & Admin"
4. ✅ Should see success message

### 4. Test User Registration
1. Logout (click Logout in sidebar)
2. Click "Register" tab
3. Fill in:
   - Firm Code: `TEST123`
   - Full Name: `Test User`
   - Username: `testuser`
   - Email: `testuser@test.com`
   - Password: `TestPassword123`
4. Click "Register"
5. ✅ Should see: "Registration successful! Pending approval"

### 5. Approve User
1. Login as super admin again
2. Go to Admin Panel → "Pending Users" tab
3. Find "Test User" in the list
4. Click "Approve"
5. ✅ User should be approved

### 6. Login as Test User
1. Logout
2. Login with testuser credentials
3. ✅ Should successfully login
4. ✅ Should see Master Roll and Wages in sidebar

## 📊 Test Scenarios

### Scenario 1: Super Admin Workflow
```
1. Login as super admin ✅
2. Access admin panel ✅
3. Create firm ✅
4. View pending users ✅
5. Approve user ✅
```

### Scenario 2: User Registration Workflow
```
1. Register with firm code ✅
2. See pending approval message ✅
3. Super admin approves ✅
4. User can login ✅
```

### Scenario 3: Firm Admin Workflow
```
1. Super admin creates firm with admin ✅
2. Firm admin receives credentials ✅
3. Firm admin can login ✅
4. Firm admin can access master roll ✅
5. Firm admin can access wages ✅
```

### Scenario 4: Access Control
```
1. Regular user cannot access /admin ✅
2. Pending user cannot login ✅
3. Rejected user cannot login ✅
4. User can only access their firm data ✅
```

## 🔍 Verification Checklist

### Authentication
- [ ] Super admin can login
- [ ] Firm admin can login
- [ ] Regular user can login
- [ ] Pending user cannot login
- [ ] Rejected user cannot login
- [ ] Invalid credentials show error

### Admin Panel
- [ ] Super admin can access /admin
- [ ] Regular user cannot access /admin
- [ ] Dashboard shows correct statistics
- [ ] Can create firms
- [ ] Can approve/reject firms
- [ ] Can approve/reject users

### User Registration
- [ ] Can register with valid firm code
- [ ] Cannot register with invalid firm code
- [ ] Cannot register with duplicate email
- [ ] Cannot register with duplicate username
- [ ] New users start as pending
- [ ] Super admin can approve users
- [ ] Super admin can reject users

### Firm Management
- [ ] Super admin can create firms
- [ ] Firms are auto-approved when created by super admin
- [ ] Admin accounts are auto-approved
- [ ] Can view all firms
- [ ] Can approve/reject/revoke firms

### Access Control
- [ ] Super admin can access all data
- [ ] Firm users can only access their firm
- [ ] Users cannot access other firms
- [ ] Pending users cannot access anything
- [ ] Rejected users cannot access anything

### UI/UX
- [ ] Sidebar shows correct links based on role
- [ ] Admin Panel link visible only to super admin
- [ ] Master Roll/Wages links visible only to firm users
- [ ] Logout button works
- [ ] Error messages display correctly
- [ ] Success messages display correctly

## 🐛 Troubleshooting

### Login Still Not Working
1. Check server logs: `npm start`
2. Verify super admin exists: `node test-db.js`
3. Check browser console for errors
4. Clear localStorage: `localStorage.clear()`
5. Refresh page

### Cannot Access Admin Panel
1. Verify you're logged in as super_admin
2. Check role in localStorage: `JSON.parse(localStorage.getItem('currentUser')).role`
3. Should be `'super_admin'`
4. Clear localStorage and login again

### Users Cannot Login After Approval
1. Check user status: `node test-db.js`
2. Check firm status: `node test-db.js`
3. Both should be `'approved'`
4. Verify user has correct firm_id

### Database Issues
1. Check database: `node test-db.js`
2. Verify super admin exists
3. Verify firms exist
4. Verify users have correct status

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Super Admin Login: ___________
Admin Panel Access: ___________
Create Firm: ___________
User Registration: ___________
User Approval: ___________
User Login: ___________
Access Control: ___________

Issues Found:
- ___________
- ___________

Notes:
___________
```

## 🎯 Success Criteria

All of the following should be true:

✅ Super admin can login
✅ Admin panel is accessible
✅ Firms can be created
✅ Users can register
✅ Users require approval
✅ Access control works
✅ UI reflects permissions
✅ No errors in console
✅ No errors in server logs
✅ All features functional

## 📞 Support

If you encounter issues:

1. Check **LOGIN_FIX_SUMMARY.md** for what was fixed
2. Check **ADMIN_SYSTEM_README.md** for complete documentation
3. Check server logs: `npm start`
4. Check browser console: F12 → Console
5. Run `node test-db.js` to verify database

## 🎉 Ready to Test!

The system is now ready for comprehensive testing. Start with the Quick Test above and work through the test scenarios.

**Happy testing!** 🚀
