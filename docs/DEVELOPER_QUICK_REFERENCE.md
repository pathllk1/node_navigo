# Developer Quick Reference Guide

## 🚀 Quick Start

### Setup
```bash
# Install dependencies
npm install

# Run migrations
node tests/run-migrations.js

# Start development server
npm run dev
```

### Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3000/api
- **Default Admin**: username: admin, password: admin123

---

## 📁 Project Structure

```
├── server/              # Backend
│   ├── controllers/     # Business logic
│   ├── routes/          # API routes
│   ├── middleware/      # Auth, validation
│   └── utils/           # Helper functions
├── public/              # Frontend
│   ├── pages/           # Page components
│   ├── components/      # Reusable components
│   ├── app.js           # Router
│   └── layout.js        # Sidebar/Layout
├── tests/               # Database migrations & tests
└── docs/                # Documentation
```

---

## 🔌 API Endpoints Quick Reference

### Authentication
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me
```

### Parties
```
GET    /api/parties              # List all
GET    /api/parties/:id          # Get one
POST   /api/parties              # Create
PUT    /api/parties/:id          # Update
DELETE /api/parties/:id          # Delete
GET    /api/parties/search/:q    # Search
```

### Stocks
```
GET    /api/stocks               # List all
GET    /api/stocks/:id           # Get one
POST   /api/stocks               # Create
PUT    /api/stocks/:id           # Update
DELETE /api/stocks/:id           # Delete
POST   /api/stocks/:id/adjust    # Adjust stock
```

### Sales
```
GET    /api/sales                # List all
GET    /api/sales/:id            # Get one
POST   /api/sales                # Create
PUT    /api/sales/:id            # Update
DELETE /api/sales/:id            # Delete
GET    /api/sales/:id/pdf        # Generate PDF
```

### Purchase
```
GET    /api/purchase             # List all
GET    /api/purchase/:id         # Get one
POST   /api/purchase             # Create
PUT    /api/purchase/:id         # Update
DELETE /api/purchase/:id         # Delete
```

### Ledger
```
GET    /api/ledger/accounts      # List accounts
POST   /api/ledger/accounts      # Create account
GET    /api/ledger/trial-balance # Trial balance
GET    /api/ledger/accounts/:name/ledger  # Account ledger
```

### Vouchers
```
GET    /api/vouchers/payment     # Payment vouchers
POST   /api/vouchers/payment     # Create payment
GET    /api/vouchers/receipt     # Receipt vouchers
POST   /api/vouchers/receipt     # Create receipt
GET    /api/vouchers/journal     # Journal vouchers
POST   /api/vouchers/journal     # Create journal
```

### Banking
```
GET    /api/banking/accounts     # Bank accounts
POST   /api/banking/accounts     # Create account
GET    /api/banking/transactions # Transactions
POST   /api/banking/transactions # Create transaction
```

### Reports
```
GET    /api/reports/sales/summary
GET    /api/reports/stock/valuation
GET    /api/reports/gst/gstr1
GET    /api/reports/financial/profit-loss
```

---

## 🎨 Frontend Patterns

### Creating a New Dashboard

```javascript
// public/pages/example/ExampleDashboard.js
import { DataTable, setupDataTableListeners } from '../../components/common/DataTable.js';
import { showSuccess, showError } from '../../components/common/Toast.js';

export function ExampleDashboard() {
  let data = [];
  let currentPage = 1;

  const container = document.createElement('div');
  container.className = 'example-dashboard p-6';

  async function loadData() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/example', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to load');
      
      data = await response.json();
      render();
    } catch (error) {
      showError('Failed to load data');
    }
  }

  function render() {
    container.innerHTML = `
      <div class="max-w-7xl mx-auto">
        <h1 class="text-3xl font-bold mb-6">Example Dashboard</h1>
        
        <!-- Stats Cards -->
        <div class="grid grid-cols-4 gap-4 mb-6">
          ${renderStatsCards()}
        </div>
        
        <!-- Data Table -->
        <div class="bg-white rounded-lg shadow">
          ${renderTable()}
        </div>
      </div>
    `;
    
    setupEventListeners();
  }

  function renderStatsCards() {
    return `
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="text-sm text-blue-600 font-medium">Total</div>
        <div class="text-2xl font-bold text-blue-900 mt-1">${data.length}</div>
      </div>
    `;
  }

  function renderTable() {
    const columns = [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'value', label: 'Value', sortable: true },
      { key: 'actions', label: 'Actions', sortable: false, render: (row) => `
        <button data-action="edit" data-id="${row.id}">Edit</button>
      `}
    ];

    return DataTable({ columns, data, currentPage, totalPages: 1 });
  }

  function setupEventListeners() {
    setupDataTableListeners(container, {
      onSort: (column) => { /* handle sort */ },
      onPageChange: (page) => { currentPage = page; loadData(); }
    });

    container.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-action="edit"]');
      if (editBtn) {
        const id = editBtn.dataset.id;
        // Handle edit
      }
    });
  }

  loadData();
  return container;
}
```

### Creating a Form Component

```javascript
// public/components/example/ExampleForm.js
export function ExampleForm({ itemId = null }) {
  return `
    <form id="example-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input type="text" id="name" required
               class="w-full px-3 py-2 border border-gray-300 rounded-md">
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Value</label>
        <input type="number" id="value"
               class="w-full px-3 py-2 border border-gray-300 rounded-md">
      </div>
    </form>
  `;
}
```

### Adding a Route

```javascript
// public/app.js
import { ExampleDashboard } from "./pages/example/ExampleDashboard.js";

router
  .on("/example", () => renderPage({ 
    html: '<div id="example-dashboard"></div>', 
    scripts: () => {
      const container = document.getElementById('example-dashboard');
      container.appendChild(ExampleDashboard());
    }
  }))
```

### Adding Sidebar Menu Item

```javascript
// public/layout.js
<li>
  <a href="/example" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Example">
    <svg><!-- icon --></svg>
    <span class="ml-3 sidebar-text">Example</span>
  </a>
</li>
```

---

## 🔧 Backend Patterns

### Creating a Controller

```javascript
// server/controllers/example.controller.js
import db from '../config/turso.js';

export async function getAll(req, res) {
  try {
    const firmId = req.user.firm_id;
    
    const result = await db.execute({
      sql: 'SELECT * FROM examples WHERE firm_id = ? ORDER BY created_at DESC',
      args: [firmId]
    });
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}

export async function getById(req, res) {
  try {
    const { id } = req.params;
    const firmId = req.user.firm_id;
    
    const result = await db.execute({
      sql: 'SELECT * FROM examples WHERE id = ? AND firm_id = ?',
      args: [id, firmId]
    });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}

export async function create(req, res) {
  try {
    const { name, value } = req.body;
    const firmId = req.user.firm_id;
    const userId = req.user.id;
    
    // Validation
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const result = await db.execute({
      sql: `INSERT INTO examples (firm_id, name, value, created_by) 
            VALUES (?, ?, ?, ?)`,
      args: [firmId, name, value || 0, userId]
    });
    
    res.status(201).json({ 
      id: result.lastInsertRowid,
      message: 'Created successfully' 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to create' });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const { name, value } = req.body;
    const firmId = req.user.firm_id;
    
    await db.execute({
      sql: `UPDATE examples SET name = ?, value = ? 
            WHERE id = ? AND firm_id = ?`,
      args: [name, value, id, firmId]
    });
    
    res.json({ message: 'Updated successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to update' });
  }
}

export async function deleteItem(req, res) {
  try {
    const { id } = req.params;
    const firmId = req.user.firm_id;
    
    await db.execute({
      sql: 'DELETE FROM examples WHERE id = ? AND firm_id = ?',
      args: [id, firmId]
    });
    
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to delete' });
  }
}
```

### Creating Routes

```javascript
// server/routes/example.routes.js
import express from 'express';
import * as exampleController from '../controllers/example.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', exampleController.getAll);
router.get('/:id', exampleController.getById);
router.post('/', exampleController.create);
router.put('/:id', exampleController.update);
router.delete('/:id', exampleController.deleteItem);

export default router;
```

### Registering Routes

```javascript
// server/index.js
import exampleRoutes from './routes/example.routes.js';

app.use('/api/example', exampleRoutes);
```

---

## 🗄️ Database Patterns

### Creating a Migration

```javascript
// tests/005-create-example-table.js
import db from '../server/config/turso.js';

async function up() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS examples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firm_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      value REAL DEFAULT 0,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (firm_id) REFERENCES firms(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);
  
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_examples_firm 
    ON examples(firm_id)
  `);
}

async function down() {
  await db.execute('DROP TABLE IF EXISTS examples');
}

export { up, down };
```

### Running Migrations

```javascript
// tests/run-migrations.js
import { up as migration005 } from './005-create-example-table.js';

await migration005();
```

---

## 🎯 Common Tasks

### Add Authentication to Endpoint
```javascript
import { authenticateToken } from '../middleware/auth.js';
router.use(authenticateToken);
```

### Get Current User
```javascript
const userId = req.user.id;
const firmId = req.user.firm_id;
const role = req.user.role;
```

### Show Toast Notification
```javascript
import { showSuccess, showError } from '../../components/common/Toast.js';

showSuccess('Operation successful');
showError('Operation failed');
```

### Navigate to Page
```javascript
window.router.navigate('/example');
```

### Format Currency
```javascript
const formatted = `₹${amount.toFixed(2)}`;
```

### Format Date
```javascript
const formatted = new Date(dateStr).toLocaleDateString('en-IN');
```

---

## 🐛 Debugging Tips

### Check Console
```javascript
console.log('Debug:', data);
console.error('Error:', error);
```

### Check Network Tab
- Look for failed API calls
- Check request/response data
- Verify authentication headers

### Check Database
```bash
# Connect to SQLite
sqlite3 config/app.db

# View tables
.tables

# Query data
SELECT * FROM examples;
```

### Common Issues

**401 Unauthorized**
- Token expired or invalid
- Check localStorage for token
- Try logging in again

**403 Forbidden**
- User doesn't have permission
- Check firm_id filtering
- Verify user role

**404 Not Found**
- Route not registered
- Check URL spelling
- Verify route in app.js

**500 Internal Server Error**
- Check server console
- Look for SQL errors
- Verify database schema

---

## 📚 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run test             # Run tests

# Database
node tests/run-migrations.js  # Run migrations
sqlite3 config/app.db         # Open database

# Git
git status               # Check status
git add .                # Stage changes
git commit -m "message"  # Commit
git push                 # Push to remote

# Production
npm run build            # Build for production
npm start                # Start production server
```

---

## 🔗 Important Links

- **Documentation**: `/docs/`
- **API Tests**: `/tests/api-tests.js`
- **Migrations**: `/tests/`
- **Components**: `/public/components/`
- **Pages**: `/public/pages/`

---

## 💡 Best Practices

### Frontend
1. Use event delegation (data-action)
2. No inline scripts (CSP compliance)
3. Use Tailwind CSS classes
4. Handle errors gracefully
5. Show loading states
6. Validate user input

### Backend
1. Always authenticate requests
2. Filter by firm_id
3. Validate input data
4. Use transactions for complex operations
5. Handle errors properly
6. Log important events

### Database
1. Use indexes for performance
2. Use foreign keys for integrity
3. Use transactions for consistency
4. Backup regularly
5. Test migrations

---

## 🎓 Learning Resources

### Tailwind CSS
- https://tailwindcss.com/docs

### Navigo Router
- https://github.com/krasimir/navigo

### SQLite
- https://www.sqlite.org/docs.html

### Express.js
- https://expressjs.com/

---

**Last Updated**: February 2026
**Version**: 1.0.0
**Status**: Production Ready
