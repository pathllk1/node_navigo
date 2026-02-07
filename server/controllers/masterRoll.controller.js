'use strict';

import { db } from '../utils/db.js';

/* --------------------------------------------------
   PREPARED STATEMENTS - WITH FIRM ISOLATION & USER TRACKING
-------------------------------------------------- */

const insertStmt = db.prepare(`
  INSERT INTO master_rolls (
    firm_id,
    employee_name,
    father_husband_name,
    date_of_birth,
    aadhar,
    pan,
    phone_no,
    address,
    bank,
    account_no,
    ifsc,
    branch,
    uan,
    esic_no,
    s_kalyan_no,
    category,
    p_day_wage,
    project,
    site,
    date_of_joining,
    date_of_exit,
    doe_rem,
    status,
    created_by,
    updated_by
  ) VALUES (
    @firm_id,
    @employee_name,
    @father_husband_name,
    @date_of_birth,
    @aadhar,
    @pan,
    @phone_no,
    @address,
    @bank,
    @account_no,
    @ifsc,
    @branch,
    @uan,
    @esic_no,
    @s_kalyan_no,
    @category,
    @p_day_wage,
    @project,
    @site,
    @date_of_joining,
    @date_of_exit,
    @doe_rem,
    @status,
    @created_by,
    @updated_by
  )
`);

// Get by ID with firm check and creator info
const getByIdStmt = db.prepare(`
  SELECT 
    mr.*, 
    f.name as firm_name, 
    f.code as firm_code,
    u_creator.fullname as created_by_name,
    u_creator.username as created_by_username,
    u_updater.fullname as updated_by_name,
    u_updater.username as updated_by_username
  FROM master_rolls mr
  JOIN firms f ON f.id = mr.firm_id
  LEFT JOIN users u_creator ON u_creator.id = mr.created_by
  LEFT JOIN users u_updater ON u_updater.id = mr.updated_by
  WHERE mr.id = ? AND mr.firm_id = ?
`);

// Get all for a specific firm with creator info
const getAllByFirmStmt = db.prepare(`
  SELECT 
    mr.*, 
    f.name as firm_name, 
    f.code as firm_code,
    u_creator.fullname as created_by_name,
    u_creator.username as created_by_username,
    u_updater.fullname as updated_by_name,
    u_updater.username as updated_by_username
  FROM master_rolls mr
  JOIN firms f ON f.id = mr.firm_id
  LEFT JOIN users u_creator ON u_creator.id = mr.created_by
  LEFT JOIN users u_updater ON u_updater.id = mr.updated_by
  WHERE mr.firm_id = ?
  ORDER BY mr.created_at DESC
`);

// Get all (admin only - across all firms) with creator info
const getAllStmt = db.prepare(`
  SELECT 
    mr.*, 
    f.name as firm_name, 
    f.code as firm_code,
    u_creator.fullname as created_by_name,
    u_creator.username as created_by_username,
    u_updater.fullname as updated_by_name,
    u_updater.username as updated_by_username
  FROM master_rolls mr
  JOIN firms f ON f.id = mr.firm_id
  LEFT JOIN users u_creator ON u_creator.id = mr.created_by
  LEFT JOIN users u_updater ON u_updater.id = mr.updated_by
  ORDER BY mr.created_at DESC
`);

// Delete with firm check
const deleteStmt = db.prepare(`
  DELETE FROM master_rolls 
  WHERE id = ? AND firm_id = ?
`);

// Check if master roll belongs to firm
const checkFirmOwnership = db.prepare(`
  SELECT id, created_by FROM master_rolls 
  WHERE id = ? AND firm_id = ?
`);

// Search master rolls by various criteria with creator info
const searchStmt = db.prepare(`
  SELECT 
    mr.*, 
    f.name as firm_name, 
    f.code as firm_code,
    u_creator.fullname as created_by_name,
    u_creator.username as created_by_username,
    u_updater.fullname as updated_by_name,
    u_updater.username as updated_by_username
  FROM master_rolls mr
  JOIN firms f ON f.id = mr.firm_id
  LEFT JOIN users u_creator ON u_creator.id = mr.created_by
  LEFT JOIN users u_updater ON u_updater.id = mr.updated_by
  WHERE mr.firm_id = ?
    AND (
      mr.employee_name LIKE @search
      OR mr.aadhar LIKE @search
      OR mr.phone_no LIKE @search
      OR mr.project LIKE @search
      OR mr.site LIKE @search
    )
  ORDER BY mr.created_at DESC
  LIMIT @limit OFFSET @offset
`);

// Get statistics by firm
const getStatsByFirmStmt = db.prepare(`
  SELECT 
    COUNT(*) as total_employees,
    COUNT(CASE WHEN date_of_exit IS NULL THEN 1 END) as active_employees,
    COUNT(CASE WHEN date_of_exit IS NOT NULL THEN 1 END) as exited_employees,
    COUNT(DISTINCT project) as total_projects,
    COUNT(DISTINCT site) as total_sites
  FROM master_rolls
  WHERE firm_id = ?
`);

// Get activity log for an employee
const getActivityLogStmt = db.prepare(`
  SELECT 
    'created' as action,
    mr.created_at as timestamp,
    u.fullname as user_name,
    u.username as username,
    u.role as user_role
  FROM master_rolls mr
  LEFT JOIN users u ON u.id = mr.created_by
  WHERE mr.id = ? AND mr.firm_id = ?
  
  UNION ALL
  
  SELECT 
    'updated' as action,
    mr.updated_at as timestamp,
    u.fullname as user_name,
    u.username as username,
    u.role as user_role
  FROM master_rolls mr
  LEFT JOIN users u ON u.id = mr.updated_by
  WHERE mr.id = ? AND mr.firm_id = ? AND mr.updated_at != mr.created_at
  
  ORDER BY timestamp DESC
`);

/* --------------------------------------------------
   CONTROLLER METHODS
-------------------------------------------------- */

// CREATE - with automatic firm_id and user tracking
export const createMasterRoll = (req, res) => {
  try {
    // Get firm_id and user_id from authenticated user
    const { firm_id, id: user_id, fullname, username } = req.user;

    // Validate required fields
    const requiredFields = [
      'employee_name', 'father_husband_name', 'date_of_birth',
      'aadhar', 'phone_no', 'address', 'bank', 'account_no',
      'ifsc', 'date_of_joining'
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }

    // Insert with firm_id and user tracking
    const result = insertStmt.run({
      firm_id,
      created_by: user_id,
      updated_by: user_id,
      status: req.body.status || 'Active',
      ...req.body
    });

    res.status(201).json({
      success: true,
      id: result.lastInsertRowid,
      message: 'Employee added to master roll',
      created_by: {
        id: user_id,
        name: fullname,
        username: username
      }
    });
  } catch (err) {
    // Handle duplicate aadhar
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({
        success: false,
        error: 'Employee with this Aadhar already exists in your firm'
      });
    }

    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// READ ALL - respects firm isolation
export const getAllMasterRolls = (req, res) => {
  try {
    const { role, firm_id } = req.user;
    let rows;

    // Admin can see all firms' data (optional - can be restricted)
    // For strict isolation, remove this and only use firm-based query
    if (role === 'admin' && req.query.all_firms === 'true') {
      rows = getAllStmt.all();
    } else {
      // Manager and User see only their firm's data
      rows = getAllByFirmStmt.all(firm_id);
    }

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// READ ONE - with firm check and audit trail
export const getMasterRollById = (req, res) => {
  try {
    const { firm_id } = req.user;
    const row = getByIdStmt.get(req.params.id, firm_id);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Master roll not found or access denied'
      });
    }

    res.json({
      success: true,
      data: row
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// UPDATE - with firm check, dynamic fields, and user tracking
export const updateMasterRoll = (req, res) => {
  try {
    const { firm_id, id: user_id, fullname, username } = req.user;
    const { id } = req.params;

    // Check ownership
    const ownership = checkFirmOwnership.get(id, firm_id);
    if (!ownership) {
      return res.status(404).json({
        success: false,
        message: 'Master roll not found or access denied'
      });
    }

    // Remove fields that shouldn't be updated
    const { firm_id: _, created_at, created_by, updated_by, ...fields } = req.body;

    // Don't allow changing aadhar to prevent duplicates
    if (fields.aadhar) {
      delete fields.aadhar;
    }

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    // Build SET clause dynamically
    const setClause = Object.keys(fields)
      .map(key => `${key} = @${key}`)
      .join(", ");

    const stmt = db.prepare(`
      UPDATE master_rolls
      SET ${setClause}, 
          updated_by = @updated_by,
          updated_at = datetime('now')
      WHERE id = @id AND firm_id = @firm_id
    `);

    const result = stmt.run({
      ...fields,
      id,
      firm_id,
      updated_by: user_id
    });

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Master roll not found or no changes made'
      });
    }

    res.json({
      success: true,
      message: 'Master roll updated successfully',
      updated_by: {
        id: user_id,
        name: fullname,
        username: username
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// DELETE - with firm check and user tracking in response
export const deleteMasterRoll = (req, res) => {
  try {
    const { firm_id, role, id: user_id, fullname, username } = req.user;
    const { id } = req.params;

    // Only admin and manager can delete
    if (role === 'user') {
      return res.status(403).json({
        success: false,
        error: 'Only managers and admins can delete master rolls'
      });
    }

    // Get employee info before deletion for logging
    const employee = getByIdStmt.get(id, firm_id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Master roll not found or access denied'
      });
    }

    const result = deleteStmt.run(id, firm_id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Master roll not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Master roll deleted successfully',
      deleted_employee: {
        id: employee.id,
        name: employee.employee_name,
        aadhar: employee.aadhar
      },
      deleted_by: {
        id: user_id,
        name: fullname,
        username: username,
        role: role
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// SEARCH - with firm isolation
export const searchMasterRolls = (req, res) => {
  try {
    const { firm_id } = req.user;
    const { q = '', limit = 50, offset = 0 } = req.query;

    const rows = searchStmt.all({
      firm_id,
      search: `%${q}%`,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      count: rows.length,
      data: rows,
      query: q
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// GET STATISTICS - firm specific
export const getMasterRollStats = (req, res) => {
  try {
    const { firm_id } = req.user;
    const stats = getStatsByFirmStmt.get(firm_id);

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// GET ACTIVITY LOG - track who created/updated
export const getActivityLog = (req, res) => {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    // Check access
    const ownership = checkFirmOwnership.get(id, firm_id);
    if (!ownership) {
      return res.status(404).json({
        success: false,
        message: 'Master roll not found or access denied'
      });
    }

    const activities = getActivityLogStmt.all(id, firm_id, id, firm_id);

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// BULK IMPORT - with firm_id and user tracking
export const bulkImportMasterRolls = (req, res) => {
  try {
    const { firm_id, role, id: user_id } = req.user;
    const { employees } = req.body;

    // Only admin and manager can bulk import
    if (role === 'user') {
      return res.status(403).json({
        success: false,
        error: 'Only managers and admins can bulk import'
      });
    }

    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employees array'
      });
    }

    const results = {
      success: [],
      failed: []
    };

    // Use transaction for bulk insert
    const bulkInsert = db.transaction((employeeList) => {
      for (let i = 0; i < employeeList.length; i++) {
        try {
          const emp = employeeList[i];
          const result = insertStmt.run({
            firm_id,
            created_by: user_id,
            updated_by: user_id,
            ...emp
          });
          results.success.push({
            index: i,
            id: result.lastInsertRowid,
            name: emp.employee_name
          });
        } catch (err) {
          results.failed.push({
            index: i,
            name: employeeList[i].employee_name,
            error: err.message
          });
        }
      }
    });

    bulkInsert(employees);

    res.status(201).json({
      success: true,
      imported: results.success.length,
      failed: results.failed.length,
      details: results
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// EXPORT - firm specific
export const exportMasterRolls = (req, res) => {
  try {
    const { firm_id } = req.user;
    const rows = getAllByFirmStmt.all(firm_id);

    // Return as CSV or JSON based on query param
    const format = req.query.format || 'json';

    if (format === 'csv') {
      // Convert to CSV
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No data to export'
        });
      }

      const headers = Object.keys(rows[0]).join(',');
      const csvRows = rows.map(row =>
        Object.values(row).map(val =>
          typeof val === 'string' && val.includes(',')
            ? `"${val}"`
            : val
        ).join(',')
      );

      const csv = [headers, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=master_rolls.csv');
      res.send(csv);
    } else {
      res.json({
        success: true,
        count: rows.length,
        data: rows
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/* --------------------------------------------------
   FILE: server/controllers/masterRoll.controller.js
-------------------------------------------------- */

// ... existing imports
// Make sure you import the insertStmt or redefine it if it's not exported. 
// Since we are in the same file, we reuse `insertStmt`.

/* --------------------------------------------------
   BULK ACTION
-------------------------------------------------- */

export const bulkCreateMasterRoll = (req, res) => {
  try {
    const { firm_id, id: user_id } = req.user;
    const rows = req.body; // Expecting an array of objects

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, error: "No data provided" });
    }

    let successCount = 0;
    let errors = [];

    // Run in a transaction for performance and data integrity
    const bulkTransaction = db.transaction((items) => {
      for (const item of items) {
        try {
          // 1. Basic Validation (skip empty rows)
          if (!item.employee_name || !item.aadhar) {
            errors.push(`Skipped row: Missing Name or Aadhar`);
            continue;
          }

          // 2. Insert
          insertStmt.run({
            firm_id,
            created_by: user_id,
            updated_by: user_id,
            // Map fields, providing defaults for missing ones
            employee_name: item.employee_name,
            father_husband_name: item.father_husband_name || '',
            date_of_birth: item.date_of_birth || '', 
            aadhar: String(item.aadhar), // Ensure string
            pan: item.pan || null,
            phone_no: String(item.phone_no || ''),
            address: item.address || '',
            bank: item.bank || '',
            account_no: String(item.account_no || ''),
            ifsc: item.ifsc || '',
            branch: item.branch || '',
            uan: item.uan || null,
            esic_no: item.esic_no || null,
            s_kalyan_no: item.s_kalyan_no || null,
            category: item.category || 'UNSKILLED',
            p_day_wage: item.p_day_wage || 0,
            project: item.project || null,
            site: item.site || null,
            date_of_joining: item.date_of_joining || new Date().toISOString().split('T')[0],
            date_of_exit: item.date_of_exit || null,
            doe_rem: item.doe_rem || null,
            status: item.status || 'Active'
          });
          successCount++;
        } catch (err) {
          // Handle unique constraint violations (e.g., Duplicate Aadhar)
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message.includes('UNIQUE constraint failed')) {
            errors.push(`Duplicate Aadhar: ${item.aadhar} (${item.employee_name})`);
          } else {
            errors.push(`Error for ${item.employee_name}: ${err.message}`);
          }
        }
      }
    });

    bulkTransaction(rows);

    res.json({
      success: true,
      message: `Processed ${rows.length} rows.`,
      imported: successCount,
      failed: errors.length,
      errors: errors // Send back list of errors for the toast
    });

  } catch (err) {
    console.error("Bulk create error:", err);
    res.status(500).json({ success: false, error: "Bulk upload failed on server." });
  }
};
/* --------------------------------------------------
   BULK DELETE - ADDED FOR CONSISTENCY
-------------------------------------------------- */

export const bulkDeleteMasterRolls = (req, res) => {
  try {
    const { firm_id, role, id: user_id, fullname, username } = req.user;
    const { ids } = req.body;

    // Only admin and manager can bulk delete
    if (role === 'user') {
      return res.status(403).json({
        success: false,
        error: 'Only managers and admins can bulk delete employees'
      });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No employee IDs provided'
      });
    }

    const deleteStmt = db.prepare(`
      DELETE FROM master_rolls 
      WHERE id = ? AND firm_id = ?
    `);

    let successCount = 0;
    let failedIds = [];

    // Use transaction for consistency
    const bulkDelete = db.transaction((employeeIds) => {
      for (const id of employeeIds) {
        try {
          const result = deleteStmt.run(id, firm_id);
          if (result.changes > 0) {
            successCount++;
          } else {
            failedIds.push({ id, reason: 'Not found or access denied' });
          }
        } catch (err) {
          failedIds.push({ id, reason: err.message });
        }
      }
    });

    bulkDelete(ids);

    res.json({
      success: true,
      message: `Deleted ${successCount} out of ${ids.length} employees`,
      deleted: successCount,
      failed: failedIds.length,
      failedIds: failedIds,
      deleted_by: {
        id: user_id,
        name: fullname,
        username: username,
        role: role
      }
    });
  } catch (err) {
    console.error("Bulk delete error:", err);
    res.status(500).json({
      success: false,
      error: 'Bulk delete failed on server'
    });
  }
};