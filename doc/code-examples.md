# Code Examples and Usage Patterns

This document provides practical code examples and usage patterns for common operations in the Node Navigo application.

## Authentication Examples

### User Registration

**Client-side registration:**
```javascript
// From public/pages/AuthPage.js
async function handleRegistration(formData) {
  try {
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firmCode: formData.firmCode.toUpperCase(),
        username: formData.username,
        email: formData.email,
        fullname: formData.fullname,
        password: formData.password
      })
    });

    const data = await response.json();

    if (data.success) {
      alert('Registration successful! Your account is pending approval.');
      // Redirect to login
      window.router.navigate('/auth');
    } else {
      alert('Registration failed: ' + data.error);
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert('Network error. Please try again.');
  }
}
```

**Server-side registration validation:**
```javascript
// From server/routes/auth.js
router.post("/auth/register", async (req, res) => {
  const { firmCode, username, email, fullname, password } = req.body;

  // Validation
  if (!firmCode || !username || !email || !fullname || !password) {
    return res.status(400).json({
      success: false,
      error: "All fields are required"
    });
  }

  // Check if firm exists and is approved
  const firm = getFirmByCode.get(firmCode.toUpperCase());
  if (!firm) {
    return res.status(400).json({
      success: false,
      error: "Invalid firm code"
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user with pending status
  const result = createUser.run(
    username, email, fullname, hashedPassword, 'user', firm.id, 'pending'
  );

  res.status(201).json({
    success: true,
    message: "Registration successful! Your account is pending approval.",
    user: {
      id: result.lastInsertRowid,
      username, email, fullname,
      firm_name: firm.name,
      firm_code: firm.code,
      status: 'pending'
    }
  });
});
```

### JWT Authentication Flow

**Middleware authentication:**
```javascript
// From server/middleware/auth.js
export async function authenticateJWT(req, res, next) {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  // Try access token first
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (accessErr) {
      console.log('Access token invalid, trying refresh');
    }
  }

  // Try refresh token
  if (refreshToken) {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = getUserById.get(payload.id);

    if (user && user.status === 'approved') {
      // Issue new access token
      const newAccessToken = jwt.sign(user, JWT_SECRET, { expiresIn: "15m" });
      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000
      });
      req.user = jwt.decode(newAccessToken);
      return next();
    }
  }

  return res.status(401).json({ error: "Unauthorized" });
}
```

## Wage Management Examples

### Bulk Wage Creation

**Client-side wage submission:**
```javascript
// From WagesDashboard.js
async function createWagesBulk(month, wagesData) {
  try {
    const response = await fetch('/api/wages/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, wages: wagesData })
    });

    const result = await response.json();

    if (result.success) {
      const successCount = result.meta.success;
      const failureCount = result.meta.failed;

      alert(`Wages created successfully!\nSuccess: ${successCount}\nFailed: ${failureCount}`);

      // Refresh the display
      loadExistingWages(month);
    } else {
      alert('Failed to create wages: ' + result.message);
    }
  } catch (error) {
    console.error('Error creating wages:', error);
    alert('Network error. Please try again.');
  }
}
```

**Server-side bulk processing:**
```javascript
// From server/controllers/wages.controller.js
export async function createWagesBulk(req, res) {
  const { month, wages } = req.body;
  const userId = req.user.id;
  const firmId = req.user.firm_id;

  // Validate input
  if (!month || !wages || !Array.isArray(wages)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid wage data'
    });
  }

  const results = [];

  for (const wage of wages) {
    try {
      // Check for duplicates
      const existing = checkWageExistsStmt.get(firmId, wage.master_roll_id, month);
      if (existing) {
        results.push({
          master_roll_id: wage.master_roll_id,
          success: false,
          message: 'Wage already exists'
        });
        continue;
      }

      // Calculate derived values
      const perDayWage = calculatePerDayWage(wage.gross_salary, wage.wage_days);
      const netSalary = calculateNetSalary(
        wage.gross_salary,
        wage.epf_deduction,
        wage.esic_deduction,
        wage.other_deduction,
        wage.other_benefit
      );

      // Insert wage
      const result = insertWageStmt.run(
        firmId, wage.master_roll_id, perDayWage, wage.wage_days,
        wage.gross_salary, wage.epf_deduction || 0, wage.esic_deduction || 0,
        wage.other_deduction || 0, wage.other_benefit || 0, netSalary,
        month, userId, userId
      );

      results.push({
        master_roll_id: wage.master_roll_id,
        wage_id: result.lastInsertRowid,
        success: true
      });

    } catch (error) {
      results.push({
        master_roll_id: wage.master_roll_id,
        success: false,
        message: error.message
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  res.json({
    success: true,
    message: `Wages created: ${successCount} success, ${results.length - successCount} failed`,
    results,
    meta: { total: wages.length, success: successCount, failed: results.length - successCount }
  });
}
```

### Employee Eligibility Check

**Business logic for wage eligibility:**
```javascript
// From server/controllers/wages.controller.js
function isEmployeeEligible(employee, yearMonth) {
  const monthStart = getMonthStartDate(yearMonth);
  const monthEnd = getMonthEndDate(yearMonth);

  // Check joining date (employee must have joined before or during the month)
  if (employee.date_of_joining > monthEnd) {
    return false; // Joined after month end
  }

  // Check exit date (employee must not have exited before month start)
  if (employee.date_of_exit && employee.date_of_exit < monthStart) {
    return false; // Exited before month start
  }

  return true;
}

// Usage in controller
const eligibleEmployees = employees.filter(emp =>
  emp.status === 'Active' &&
  isEmployeeEligible(emp, month) &&
  !paidEmployeeIdsSet.has(emp.id)
);
```

## Inventory Management Examples

### Stock Item Creation

**Creating stock with validation:**
```javascript
// From inventory controller
export async function createStock(req, res) {
  try {
    const {
      item, pno, oem, hsn, qty, uom, rate, grate, total, mrp, batches, user
    } = req.body;

    const firmId = req.user.firm_id;

    // Validate required fields
    if (!item || !hsn || qty === undefined || !uom) {
      return res.status(400).json({
        success: false,
        message: 'Item name, HSN, quantity, and UOM are required'
      });
    }

    // Check for duplicate items within firm
    const existingStock = db.prepare(`
      SELECT id FROM stocks WHERE firm_id = ? AND item = ?
    `).get(firmId, item);

    if (existingStock) {
      return res.status(409).json({
        success: false,
        message: 'Stock item already exists for this firm'
      });
    }

    // Insert stock
    const result = db.prepare(`
      INSERT INTO stocks (firm_id, item, pno, oem, hsn, qty, uom, rate, grate, total, mrp, batches, user)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(firmId, item, pno, oem, hsn, qty, uom, rate || 0, grate || 0, total || 0, mrp, JSON.stringify(batches || []), user || req.user.username);

    res.status(201).json({
      success: true,
      message: 'Stock item created successfully',
      stockId: result.lastInsertRowid
    });

  } catch (error) {
    console.error('Error creating stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create stock item'
    });
  }
}
```

### Bill Creation with GST Calculation

**Sales bill creation:**
```javascript
// From inventory controller
export async function createBill(req, res) {
  try {
    const billData = req.body;
    const firmId = req.user.firm_id;

    // Start transaction for bill and stock updates
    const db = require('../utils/db').db;

    // Insert bill header
    const billResult = db.prepare(`
      INSERT INTO bills (
        firm_id, bno, bdate, supply, addr, gstin, state, pin, state_code,
        gtot, ntot, rof, btype, usern, firm, party_id, oth_chg_json,
        order_no, vehicle_no, dispatch_through, narration, reverse_charge,
        cgst, sgst, igst, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      firmId,
      billData.bno,
      billData.bdate,
      billData.supply,
      billData.addr,
      billData.gstin,
      billData.state,
      billData.pin,
      billData.state_code,
      billData.gtot,
      billData.ntot,
      billData.rof || 0,
      billData.btype || 'SALES',
      req.user.username,
      billData.firm,
      billData.party_id,
      JSON.stringify(billData.oth_chg_json || {}),
      billData.order_no,
      billData.vehicle_no,
      billData.dispatch_through,
      billData.narration,
      billData.reverse_charge || 0,
      billData.cgst || 0,
      billData.sgst || 0,
      billData.igst || 0,
      'ACTIVE'
    );

    const billId = billResult.lastInsertRowid;

    // Process bill items and update stock
    for (const item of billData.items) {
      // Insert bill item
      db.prepare(`
        INSERT INTO bill_items (bill_id, item, hsn, qty, uom, rate, amount, disc, taxable, gst_rate, cgst, sgst, igst, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(billId, item.item, item.hsn, item.qty, item.uom, item.rate, item.amount, item.disc, item.taxable, item.gst_rate, item.cgst, item.sgst, item.igst, item.total);

      // Update stock quantity
      if (billData.btype === 'SALES') {
        db.prepare(`
          UPDATE stocks SET qty = qty - ? WHERE firm_id = ? AND item = ?
        `).run(item.qty, firmId, item.item);
      }
    }

    res.json({
      success: true,
      message: 'Bill created successfully',
      billId: billId
    });

  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bill'
    });
  }
}
```

## Settings Management Examples

### Global Settings CRUD

**Update setting:**
```javascript
// Client-side
async function updateSetting(key, value, description) {
  try {
    const response = await fetch(`/api/settings/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setting_value: value, description })
    });

    if (response.ok) {
      alert('Setting updated successfully');
      loadSettings(); // Refresh display
    } else {
      alert('Failed to update setting');
    }
  } catch (error) {
    console.error('Error updating setting:', error);
    alert('Network error');
  }
}

// Server-side
export async function updateGlobalSetting(req, res) {
  try {
    const { key } = req.params;
    const { setting_value, description } = req.body;

    // Check if setting exists
    const existing = db.prepare('SELECT * FROM settings WHERE setting_key = ?').get(key);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Setting not found' });
    }

    // Update setting
    db.prepare(`
      UPDATE settings
      SET setting_value = ?, description = ?, updated_at = datetime('now')
      WHERE setting_key = ?
    `).run(setting_value, description, key);

    res.json({ success: true, message: 'Setting updated successfully' });

  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ success: false, message: 'Failed to update setting' });
  }
}
```

### Firm Settings Management

**Firm-specific settings:**
```javascript
// Get firm settings
export async function getFirmSettings(req, res) {
  try {
    const firmId = req.user.firm_id;

    const settings = db.prepare(`
      SELECT setting_key, setting_value, description
      FROM firm_settings
      WHERE firm_id = ?
      ORDER BY setting_key
    `).all(firmId);

    res.json({
      success: true,
      settings: settings
    });

  } catch (error) {
    console.error('Error fetching firm settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
}

// Update firm setting
export async function updateFirmSetting(req, res) {
  try {
    const { key } = req.params;
    const { setting_value, description } = req.body;
    const firmId = req.user.firm_id;

    db.prepare(`
      INSERT OR REPLACE INTO firm_settings (firm_id, setting_key, setting_value, description, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(firmId, key, setting_value, description);

    res.json({ success: true, message: 'Firm setting updated successfully' });

  } catch (error) {
    console.error('Error updating firm setting:', error);
    res.status(500).json({ success: false, message: 'Failed to update setting' });
  }
}
```

## Error Handling Patterns

### Client-side Error Handling

**Consistent error display:**
```javascript
// Utility function for error handling
function handleApiError(error, defaultMessage = 'An error occurred') {
  console.error('API Error:', error);

  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || error.response.data?.error || defaultMessage;
    alert(`Error: ${message}`);
  } else if (error.request) {
    // Network error
    alert('Network error. Please check your connection and try again.');
  } else {
    // Other error
    alert(defaultMessage);
  }
}

// Usage in async functions
async function performAction() {
  try {
    const result = await apiCall();
    // Handle success
  } catch (error) {
    handleApiError(error, 'Failed to perform action');
  }
}
```

### Server-side Error Handling

**Structured error responses:**
```javascript
// Error response utility
function sendError(res, statusCode, message, details = null) {
  const errorResponse = {
    success: false,
    message: message,
    ...(details && { details })
  };

  // Log server errors
  if (statusCode >= 500) {
    console.error('Server Error:', message, details);
  }

  res.status(statusCode).json(errorResponse);
}

// Usage in controllers
export async function someControllerFunction(req, res) {
  try {
    // Business logic
    if (!validData) {
      return sendError(res, 400, 'Invalid data provided');
    }

    // Success response
    res.json({ success: true, data: result });

  } catch (error) {
    console.error('Controller error:', error);
    sendError(res, 500, 'Internal server error');
  }
}
```

## Database Query Patterns

### Prepared Statements

**Parameterized queries for security:**
```javascript
// ✅ SECURE: Using prepared statements
const getUserById = db.prepare(`
  SELECT u.*, f.name as firm_name
  FROM users u
  LEFT JOIN firms f ON u.firm_id = f.id
  WHERE u.id = ?
`);

const user = getUserById.get(userId);

// ✅ SECURE: Multiple parameters
const getWagesByMonth = db.prepare(`
  SELECT * FROM wages
  WHERE firm_id = ? AND salary_month = ?
  ORDER BY employee_name
`);

const wages = getWagesByMonth.all(firmId, month);
```

### Transaction Handling

**Multi-step operations:**
```javascript
// Complex operation with transaction
export async function createComplexRecord(req, res) {
  const db = require('../utils/db').db;

  try {
    // Start transaction
    db.exec('BEGIN TRANSACTION');

    // Step 1: Insert main record
    const mainResult = db.prepare('INSERT INTO main_table (field) VALUES (?)').run(value);
    const mainId = mainResult.lastInsertRowid;

    // Step 2: Insert related records
    for (const related of relatedData) {
      db.prepare('INSERT INTO related_table (main_id, data) VALUES (?, ?)').run(mainId, related);
    }

    // Step 3: Update related data
    db.prepare('UPDATE other_table SET status = ? WHERE id = ?').run('processed', otherId);

    // Commit transaction
    db.exec('COMMIT');

    res.json({ success: true, id: mainId });

  } catch (error) {
    // Rollback on error
    db.exec('ROLLBACK');
    console.error('Transaction failed:', error);
    res.status(500).json({ success: false, message: 'Operation failed' });
  }
}
```

## Frontend Component Patterns

### Modal Management

**Reusable modal pattern:**
```javascript
// Modal component
class Modal {
  constructor(modalId) {
    this.modal = document.getElementById(modalId);
    this.setupEventListeners();
  }

  show() {
    this.modal.classList.remove('hidden');
  }

  hide() {
    this.modal.classList.add('hidden');
  }

  setupEventListeners() {
    // Close on background click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        this.hide();
      }
    });
  }
}

// Usage
const editModal = new Modal('edit-modal');
editModal.show();
```

### Form Validation

**Client-side validation:**
```javascript
function validateForm(formData) {
  const errors = {};

  // Required field validation
  if (!formData.name?.trim()) {
    errors.name = 'Name is required';
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (formData.email && !emailRegex.test(formData.email)) {
    errors.email = 'Invalid email format';
  }

  // Number validation
  if (formData.amount !== undefined && (isNaN(formData.amount) || formData.amount < 0)) {
    errors.amount = 'Amount must be a positive number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Usage
const { isValid, errors } = validateForm(formData);
if (!isValid) {
  displayErrors(errors);
  return;
}
// Proceed with submission
```

## SPA Navigation and Iframe Communication Examples

### Edit Bill SPA Navigation

**Iframe to Parent Communication:**
```javascript
// From public/pages/inventory/sls-rpt.js (iframe content)
// Edit Bill function that communicates with parent SPA
window.editBill = function() {
  if (!currentBillId) {
    alert('No bill selected');
    return;
  }
  // Send message to parent page for SPA routing
  window.parent.postMessage({
    action: 'EDIT_BILL',
    billId: currentBillId
  }, '*');
};
```

**Parent SPA Message Handler:**
```javascript
// From public/pages/inventory/sls-rpt.js (parent page)
// Handle EDIT_BILL request from iframe for SPA navigation
if (event.data?.action === 'EDIT_BILL') {
  const billId = event.data.billId;
  console.log('[EDIT_BILL] Received edit request for bill ID:', billId);
  
  // Store billId in sessionStorage for SPA routing timing issues
  sessionStorage.setItem('editBillId', billId.toString());
  
  // Use SPA router to navigate to SLS system in edit mode
  window.router.navigate('/inventory/sls?edit=' + billId);
  return;
}
```

### SessionStorage State Management

**Fallback Edit Mode Detection:**
```javascript
// From public/components/inventory/sls/index.js
// Check for edit mode with URL params and sessionStorage fallback
console.log('SLS: Current URL:', window.location.href);
console.log('SLS: window.location.search:', window.location.search);
const urlParams = new URLSearchParams(window.location.search);
const editBillIdParam = urlParams.get('edit');
console.log('SLS: editBillIdParam from URL:', editBillIdParam);

// Also check sessionStorage as fallback for SPA routing timing issues
const sessionEditId = sessionStorage.getItem('editBillId');
console.log('SLS: editBillId from sessionStorage:', sessionEditId);

// Use URL param if available, otherwise sessionStorage
const finalEditParam = editBillIdParam || sessionEditId;
console.log('SLS: final edit param:', finalEditParam);
```

**SessionStorage Cleanup:**
```javascript
// Clear sessionStorage after successful bill loading to prevent persistence
loadExistingBillData(state, editBillId).then(() => {
  // Clear sessionStorage after successful loading to prevent persistence
  sessionStorage.removeItem('editBillId');
  
  // Continue with data loading and rendering
  fetchData(state).then(() => {
    renderMainLayout(isEditMode);
  });
}).catch(err => {
  console.error("Failed to load bill data:", err);
  // Clear sessionStorage on error to prevent stale data
  sessionStorage.removeItem('editBillId');
  showEditError(container, err.message, editBillId);
});
```
