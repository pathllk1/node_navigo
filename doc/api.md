# API Documentation

## Overview

The Node Navigo application provides REST APIs for user authentication, firm management, master rolls, wages, inventory, and administrative functions. All APIs require JWT authentication except for authentication endpoints.

## Authentication

### POST /auth/register
Register a new user account.
- **Body**: `{ firmCode, username, email, fullname, password }`
- **Response**: User registration details
- **Status**: 201 on success, 400/409 on validation errors

### POST /auth/login
Authenticate user and issue JWT tokens.
- **Body**: `{ emailOrUsername, password }`
- **Response**: User data with tokens in cookies
- **Cookies**: `accessToken` (15min), `refreshToken` (30 days)

### POST /auth/refresh
Refresh access token using refresh token.
- **Response**: New access token in cookie

### POST /auth/logout
Logout user and clear tokens.

### GET /auth/users
Get all users (admin/super_admin only).

### GET /auth/users/firm
Get users from current user's firm (manager/admin).

### GET /me
Get current authenticated user profile.

### GET /auth/session
Get current session expiration time.

## Firm Management (Super Admin Only)

### POST /admin/firms
Create new firm with optional admin user.

### GET /admin/firms
Get all firms.

### GET /admin/firms/:id
Get firm by ID.

### PUT /admin/firms/:id
Update firm details.

### DELETE /admin/firms/:id
Delete firm (only if no associated data).

### POST /admin/firms/:firmId/users/:userId
Assign user to firm.

### GET /admin/users/firms
Get all users with their firm assignments.

## Settings

### GET /api/settings
Get global settings.

### PUT /api/settings/:key
Update global setting.

### GET /api/settings/firm
Get firm-specific settings.

### PUT /api/settings/firm/:key
Update firm-specific setting.

## Master Rolls

### POST /api/master-rolls
Create new master roll entry.

### GET /api/master-rolls
Get master rolls for current user's firm.

### GET /api/master-rolls/:id
Get specific master roll.

### PUT /api/master-rolls/:id
Update master roll.

### DELETE /api/master-rolls/:id
Delete master roll.

## Wages

### POST /api/wages
Create wage record.

### GET /api/wages
Get wages for current user's firm.

### GET /api/wages/month/:month
Get wages for specific month.

### PUT /api/wages/:id
Update wage record.

### DELETE /api/wages/:id
Delete wage record.

### POST /api/wages/bulk
Bulk operations on wages.

## Inventory

### Stocks
- POST /api/inventory/stocks - Create stock item
- GET /api/inventory/stocks - Get firm stocks
- PUT /api/inventory/stocks/:id - Update stock
- DELETE /api/inventory/stocks/:id - Delete stock

### Parties
- POST /api/inventory/parties - Create party (customer/supplier)
- GET /api/inventory/parties - Get firm parties
- PUT /api/inventory/parties/:id - Update party
- DELETE /api/inventory/parties/:id - Delete party

### Bills
- POST /api/inventory/bills - Create bill (invoice)
- GET /api/inventory/bills - Get firm bills
- PUT /api/inventory/bills/:id - Update bill
- DELETE /api/inventory/bills/:id - Delete bill

### Sales System
- GET /api/inventory/sales/dashboard - Sales dashboard data
- GET /api/inventory/sales/reports - Sales reports
- GET /api/inventory/sales/stock - Stock reports

## Security

All API endpoints (except auth) require JWT authentication via middleware. Role-based access control is enforced:

- **super_admin**: Full system access
- **admin**: Firm management, user approval
- **manager**: Firm data management
- **user**: Limited read access

## Error Handling

Standard HTTP status codes with JSON error responses:
- 400: Bad Request (validation errors)
- 401: Unauthorized (authentication required)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (duplicate data)
- 500: Internal Server Error

## Content Security Policy

All endpoints are protected by strict CSP allowing only 'self' origins for scripts, styles, and resources.
