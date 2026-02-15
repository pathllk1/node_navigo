# Frontend Documentation

## Overview

The frontend is a Single Page Application (SPA) built with vanilla JavaScript, using Navigo for routing and Tailwind CSS for styling. It follows a modular architecture with separate files for pages, components, and utilities.

## Architecture

### Core Files

#### app.js
Main application entry point handling:
- SPA routing with Navigo
- User authentication state management
- Page rendering and layout
- Token timer management
- Polling for session refresh

#### layout.js
Provides the main application layout:
- Fixed top navbar with token timer
- Collapsible sidebar with navigation menu
- Main content area
- Footer
- User-specific menu items based on roles

#### sidebar.js
Handles sidebar functionality:
- Collapse/expand behavior
- Tooltips on hover
- User info display
- Role-based menu visibility

#### api.js
Client-side API utilities:
- Token timer management
- Session timeout handling

## Pages

### Authentication Pages

#### AuthPage.js
Combined login/register page with user dashboard:
- Login form with email/username authentication
- Registration form with firm code validation
- User dashboard showing:
  - Welcome header with user avatar
  - User information grid (firm, role, email)
  - Admin panel link (super_admin only)
  - Settings and user management cards
  - Super admin features banner

### Dashboard Pages

#### WagesDashboard.js
Comprehensive wage management system:
- Create mode: Monthly wage creation with employee selection
- Manage mode: Existing wage records management
- Employee master roll integration
- Bulk operations support

#### MasterRollDashboard.js
Employee master roll management:
- Employee information management
- Firm-based data isolation
- Search and filtering capabilities

#### AdminPanel.js
Super administrator panel:
- Firm creation and management
- User approval and management
- System-wide administrative functions

### Settings Pages

#### settings.js
Application settings management:
- Global settings: Key-value pair configuration
- GST configuration: Enable/disable GST calculations
- Modal-based editing interface
- Real-time status updates

### Inventory Pages

#### Sales Dashboard (inventory/sls-dash.js)
Sales system overview with dashboard metrics.

#### Sales Reports (inventory/sls-rpt.js)
Detailed sales reporting and analytics.

#### Stock Reports (inventory/sts-rpt.js)
Inventory stock level reporting.

#### Stock Movements (inventory/sts-mov.js)
Stock transaction history and movements.

## Components

### Layout Components

- **Layout**: Main application wrapper with sidebar and content areas
- **Sidebar**: Navigation menu with role-based visibility
- **Navbar**: Top navigation bar with session timer

### Page Components

- **AuthPage**: Authentication and user dashboard
- **WagesDashboard**: Wage management interface
- **MasterRollDashboard**: Employee records management
- **AdminPanel**: Administrative functions
- **SettingsPage**: Configuration management

## Routing

Uses Navigo for client-side routing with the following routes:

```javascript
router
  .on("/", () => renderPage(home))
  .on("/auth", () => renderPage(AuthPage()))
  .on("/admin", () => renderPage(AdminPanel()))  // super_admin only
  .on("/settings", () => renderPage(SettingsPage()))
  .on("/wages", () => renderPage(WagesDashboard()))
  .on("/masterroll", () => renderPage(MasterRollDashboard()))
  .on("/inventory/sls", () => renderPage(salesSystem))
  .on("/inventory/sls/dash", () => renderPage(SlsDashPage()))
  .on("/inventory/sls/rpt", () => renderPage(SlsRptPage()))
  .on("/inventory/sls/sts", () => renderPage(StockPage()))
  .on("/inventory/sls/mov", () => renderPage(StcMovementPage()))
```

## State Management

### Global State
- `currentUser`: Current authenticated user object
- `currentUser` properties: id, username, email, fullname, role, firm_id, firm_name, firm_code, last_login

### Session Management
- JWT tokens stored in HttpOnly cookies
- Automatic token refresh via polling
- Session timeout visualization with countdown timer
- Graceful logout on session expiration

## Security Features

### Content Security Policy
- Strict CSP allowing only 'self' origins
- Inline event handlers avoided in favor of addEventListener
- CSS classes used instead of inline styles

### Authentication
- JWT-based authentication with refresh tokens
- Automatic token refresh before expiration
- Role-based UI element visibility
- Protected routes with authentication checks

## UI/UX Features

### Responsive Design
- Tailwind CSS utility classes for responsive layouts
- Mobile-friendly navigation with collapsible sidebar
- Adaptive content areas

### Interactive Elements
- Modal dialogs for forms and confirmations
- Tabbed interfaces for multi-section pages
- Loading states and progress indicators
- Toast notifications for user feedback

### Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly elements
- High contrast color schemes

## Styling

### Tailwind CSS
- Utility-first CSS framework
- Custom color palette (purple/indigo gradients)
- Consistent spacing and typography
- Dark mode ready (though not implemented)

### Icons
- Heroicons SVG icons (CSP compliant)
- Inline SVG for better performance
- Consistent sizing and styling

## Performance

### Code Splitting
- ES6 modules for lazy loading
- Separate files for pages and components
- On-demand script execution

### Optimization
- Minimal bundle size with vanilla JS
- Efficient DOM manipulation
- Debounced API calls where appropriate

## Development

### File Structure
```
public/
├── pages/          # Page components
├── components/     # Reusable components
├── api.js         # API utilities
├── app.js         # Main application
├── sidebar.js     # Sidebar component
├── layout.js      # Layout template
└── index.html     # HTML entry point
```

### Build Process
- Tailwind CSS compilation via CLI
- Watch mode for development
- Minified production builds

### Browser Support
- Modern browsers with ES6 module support
- Progressive enhancement approach
- Graceful degradation for older browsers
