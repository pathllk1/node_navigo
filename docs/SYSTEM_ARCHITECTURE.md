# System Architecture - Admin-Controlled Registration

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         PUBLIC ACCESS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │   Login      │         │  Register    │                      │
│  │   Page       │         │   Page       │                      │
│  └──────┬───────┘         └──────┬───────┘                      │
│         │                        │                               │
│         │                        │ (with firm code)              │
│         │                        ▼                               │
│         │                 ┌─────────────┐                        │
│         │                 │   Create    │                        │
│         │                 │   User      │                        │
│         │                 │ (pending)   │                        │
│         │                 └─────────────┘                        │
│         │                                                         │
└─────────┼─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION CHECK                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐       │
│  │  1. Valid credentials?                                │       │
│  │  2. User status = 'approved'?                         │       │
│  │  3. Firm status = 'approved'? (if applicable)         │       │
│  └──────────────────────────────────────────────────────┘       │
│                          │                                        │
│                          ▼                                        │
│                    ┌─────────┐                                   │
│                    │  Grant  │                                   │
│                    │ Access  │                                   │
│                    └────┬────┘                                   │
└─────────────────────────┼─────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
┌──────────────────────┐      ┌──────────────────────┐
│   SUPER ADMIN        │      │   FIRM USER          │
│   (no firm)          │      │   (has firm)         │
├──────────────────────┤      ├──────────────────────┤
│                      │      │                      │
│  ┌────────────────┐  │      │  ┌────────────────┐ │
│  │ Admin Panel    │  │      │  │ Master Roll    │ │
│  │ - Create Firms │  │      │  │ Dashboard      │ │
│  │ - Approve      │  │      │  └────────────────┘ │
│  │   Firms        │  │      │                      │
│  │ - Approve      │  │      │  ┌────────────────┐ │
│  │   Users        │  │      │  │ Wages          │ │
│  │ - View Stats   │  │      │  │ Management     │ │
│  └────────────────┘  │      │  └────────────────┘ │
│                      │      │                      │
└──────────────────────┘      └──────────────────────┘
```

## User Roles Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                     SUPER ADMIN                          │
│  • System-wide access                                    │
│  • No firm association                                   │
│  • Can create firms                                      │
│  • Can approve/reject firms and users                    │
│  • Access to /admin panel                                │
└─────────────────────────────────────────────────────────┘
                          │
                          │ creates
                          ▼
┌─────────────────────────────────────────────────────────┐
│                        FIRM                              │
│  • Has unique code                                       │
│  • Has status (pending/approved/rejected)                │
│  • Contains users                                        │
└─────────────────────────────────────────────────────────┘
                          │
                          │ contains
                          ▼
        ┌─────────────────┴─────────────────┬─────────────┐
        │                                    │             │
        ▼                                    ▼             ▼
┌──────────────┐                  ┌──────────────┐  ┌──────────────┐
│ FIRM ADMIN   │                  │   MANAGER    │  │     USER     │
│              │                  │              │  │              │
│ • Firm owner │                  │ • Mid-level  │  │ • Basic      │
│ • Full firm  │                  │ • Firm data  │  │   access     │
│   access     │                  │   access     │  │ • View only  │
└──────────────┘                  └──────────────┘  └──────────────┘
```

## Registration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIRM CREATION FLOW                            │
└─────────────────────────────────────────────────────────────────┘

Super Admin Login
      │
      ▼
Admin Panel → Create Firm Tab
      │
      ▼
Fill Firm Details + Admin Account
      │
      ▼
Submit
      │
      ├─────────────────────────────────────┐
      │                                     │
      ▼                                     ▼
Create Firm                          Create Admin User
(status: approved)                   (status: approved)
      │                                     │
      └─────────────┬───────────────────────┘
                    ▼
              ✅ Complete
         Admin can login immediately


┌─────────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

User visits /auth
      │
      ▼
Click "Register" tab
      │
      ▼
Enter firm code + details
      │
      ▼
Submit
      │
      ▼
Create User (status: pending)
      │
      ▼
Show: "Pending approval"
      │
      ▼
Super Admin reviews in Admin Panel
      │
      ├─────────────┬─────────────┐
      │             │             │
      ▼             ▼             ▼
  Approve       Reject        Ignore
      │             │             │
      ▼             ▼             ▼
status:       status:       status:
approved      rejected      pending
      │             │             │
      ▼             ▼             ▼
✅ Can login  ❌ Cannot    ⏳ Cannot
              login        login
```

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      LOGIN PROCESS                               │
└─────────────────────────────────────────────────────────────────┘

User enters credentials
      │
      ▼
┌─────────────────┐
│ Find user by    │
│ email/username  │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ Found? │──── No ──→ ❌ Invalid credentials
    └───┬────┘
        │ Yes
        ▼
┌─────────────────┐
│ Verify password │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ Match? │──── No ──→ ❌ Invalid credentials
    └───┬────┘
        │ Yes
        ▼
┌─────────────────────┐
│ Check user status   │
└────────┬────────────┘
         │
         ▼
    ┌──────────┐
    │ Approved?│──── No ──→ ❌ Pending approval
    └────┬─────┘
         │ Yes
         ▼
┌─────────────────────┐
│ Check firm status   │
│ (if user has firm)  │
└────────┬────────────┘
         │
         ▼
    ┌──────────┐
    │ Approved?│──── No ──→ ❌ Firm not approved
    └────┬─────┘
         │ Yes
         ▼
┌─────────────────────┐
│ Generate tokens     │
│ - Access token      │
│ - Refresh token     │
└────────┬────────────┘
         │
         ▼
    ✅ Login successful
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FIRMS TABLE                              │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)                                                          │
│ name (UNIQUE)                                                    │
│ code (UNIQUE)                                                    │
│ description                                                      │
│ status (pending/approved/rejected)                               │
│ created_at                                                       │
│ updated_at                                                       │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ 1:N
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         USERS TABLE                              │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)                                                          │
│ username (UNIQUE)                                                │
│ email (UNIQUE)                                                   │
│ fullname                                                         │
│ password (hashed)                                                │
│ role (user/manager/admin/super_admin)                            │
│ firm_id (FK, nullable for super_admin)                           │
│ status (pending/approved/rejected)                               │
│ last_login                                                       │
│ created_at                                                       │
│ updated_at                                                       │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ 1:N
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MASTER_ROLLS TABLE                            │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)                                                          │
│ firm_id (FK)                                                     │
│ employee_name                                                    │
│ ... (employee details)                                           │
│ created_by (FK → users)                                          │
│ updated_by (FK → users)                                          │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ 1:N
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       WAGES TABLE                                │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)                                                          │
│ firm_id (FK)                                                     │
│ master_roll_id (FK)                                              │
│ ... (wage details)                                               │
│ created_by (FK → users)                                          │
│ updated_by (FK → users)                                          │
└─────────────────────────────────────────────────────────────────┘
```

## API Routes Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         PUBLIC ROUTES                            │
├─────────────────────────────────────────────────────────────────┤
│ POST /auth/auth/login          - Login                          │
│ POST /auth/auth/register       - User registration (pending)    │
│ POST /auth/auth/refresh        - Refresh access token           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATED ROUTES                          │
├─────────────────────────────────────────────────────────────────┤
│ GET  /auth/auth/me             - Get current user               │
│ POST /auth/auth/logout         - Logout                         │
│ GET  /auth/users               - Get all users (admin)          │
│ GET  /auth/users/firm          - Get firm users (manager+)      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   SUPER ADMIN ONLY ROUTES                        │
├─────────────────────────────────────────────────────────────────┤
│ GET    /admin/stats            - Dashboard statistics           │
│ GET    /admin/firms            - List all firms                 │
│ POST   /admin/firms            - Create firm with admin         │
│ PATCH  /admin/firms/:id/status - Approve/reject firm            │
│ GET    /admin/users            - List all users                 │
│ GET    /admin/users/pending    - List pending users             │
│ PATCH  /admin/users/:id/status - Approve/reject user            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      FIRM USER ROUTES                            │
├─────────────────────────────────────────────────────────────────┤
│ GET    /api/master-rolls       - List master rolls              │
│ POST   /api/master-rolls       - Create master roll             │
│ PUT    /api/master-rolls/:id   - Update master roll             │
│ DELETE /api/master-rolls/:id   - Delete master roll             │
│                                                                   │
│ GET    /api/wages              - List wages                     │
│ POST   /api/wages              - Create wage                    │
│ PUT    /api/wages/:id          - Update wage                    │
│ DELETE /api/wages/:id          - Delete wage                    │
└─────────────────────────────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                             │
└─────────────────────────────────────────────────────────────────┘

Layer 1: JWT Authentication
├─ Valid access token required
├─ Token contains user info
└─ Automatic refresh with refresh token

Layer 2: User Status Check
├─ User must have status = 'approved'
├─ Checked on login
└─ Checked on token refresh

Layer 3: Firm Status Check
├─ Firm must have status = 'approved'
├─ Checked on login
└─ Checked on token refresh

Layer 4: Role-Based Access Control
├─ Super admin: All routes
├─ Firm admin: Firm routes only
├─ Manager: Firm routes only
└─ User: Limited firm routes

Layer 5: Firm Isolation
├─ Users can only access their firm data
├─ Enforced by middleware
└─ Super admin can access all firms

Layer 6: Middleware Validation
├─ Every request validates token
├─ Every request checks status
└─ Every request checks permissions
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENTS                           │
└─────────────────────────────────────────────────────────────────┘

app.js (Router)
    │
    ├─→ AuthPage.js (Login/Register)
    │       │
    │       └─→ Calls /auth/auth/login or /auth/auth/register
    │
    ├─→ AdminPanel.js (Super Admin Only)
    │       │
    │       ├─→ Calls /admin/firms
    │       ├─→ Calls /admin/users/pending
    │       └─→ Calls /admin/stats
    │
    ├─→ MasterRollDashboard.js (Firm Users)
    │       │
    │       └─→ Calls /api/master-rolls
    │
    └─→ WagesDashboard.js (Firm Users)
            │
            └─→ Calls /api/wages

layout.js (Sidebar)
    │
    ├─→ Conditional rendering based on user role
    ├─→ Shows Admin Panel link (super_admin only)
    ├─→ Shows Master Roll/Wages (firm users only)
    └─→ Shows Logout button (logged in users)

api.js (HTTP Client)
    │
    ├─→ Adds Authorization header
    ├─→ Handles token refresh
    └─→ Manages token expiration
```

## Status State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER STATUS STATES                            │
└─────────────────────────────────────────────────────────────────┘

        ┌─────────┐
        │ pending │ ←─── Initial state on registration
        └────┬────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
┌──────────┐  ┌──────────┐
│ approved │  │ rejected │
└──────────┘  └──────────┘
      │             │
      │             │
      └──────┬──────┘
             │
             ▼
      Can transition
      back to any state
      (by super admin)


┌─────────────────────────────────────────────────────────────────┐
│                    FIRM STATUS STATES                            │
└─────────────────────────────────────────────────────────────────┘

        ┌─────────┐
        │ pending │ ←─── (Not used when created by super admin)
        └────┬────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
┌──────────┐  ┌──────────┐
│ approved │  │ rejected │ ←─── Firms created by super admin
└──────────┘  └──────────┘      start as 'approved'
      │             │
      │             │
      └──────┬──────┘
             │
             ▼
      Can transition
      back to any state
      (by super admin)
```

This architecture ensures:
- ✅ Centralized admin control
- ✅ Secure authentication
- ✅ Proper access control
- ✅ Data isolation per firm
- ✅ Scalable design
- ✅ Clear separation of concerns
