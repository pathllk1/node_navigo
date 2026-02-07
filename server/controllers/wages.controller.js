'use strict';

import { db, Wage, MasterRoll } from '../utils/db.js';

/* --------------------------------------------------
   HELPER FUNCTIONS
-------------------------------------------------- */

/**
 * Get month end date (last day of the month)
 * @param {string} yearMonth - Format: YYYY-MM
 * @returns {string} - Format: YYYY-MM-DD
 */
function getMonthEndDate(yearMonth) {
  const [year, month] = yearMonth.split('-');
  const nextMonth = parseInt(month) === 12 ? '01' : String(parseInt(month) + 1).padStart(2, '0');
  const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : year;
  const lastDay = new Date(nextYear, parseInt(nextMonth) - 1, 0).getDate();
  return `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
}

/**
 * Get month start date
 * @param {string} yearMonth - Format: YYYY-MM
 * @returns {string} - Format: YYYY-MM-DD
 */
function getMonthStartDate(yearMonth) {
  return `${yearMonth}-01`;
}

/**
 * Check if employee is eligible for wages in the given month
 * @param {object} employee - Master roll record
 * @param {string} yearMonth - Format: YYYY-MM
 * @returns {boolean}
 */
function isEmployeeEligible(employee, yearMonth) {
  const monthStart = getMonthStartDate(yearMonth);
  const monthEnd = getMonthEndDate(yearMonth);

  // Check joining date
  if (employee.date_of_joining > monthEnd) {
    return false;
  }

  // Check exit date - include if no exit date OR exit date is after month start
  if (employee.date_of_exit && employee.date_of_exit < monthStart) {
    return false;
  }

  return true;
}

/* --------------------------------------------------
   CONTROLLER FUNCTIONS
-------------------------------------------------- */

/**
 * Get employees eligible for wage creation in a given month
 * Filters by: firm, status=active, joining date, exit date
 */
export async function getEmployeesForWages(req, res) {
  try {
    const { month } = req.body;
    const userId = req.user.id;
    const firmId = req.user.firm_id;

    // Validate input
    if (!month) {
      return res.status(400).json({ success: false, message: 'Month required' });
    }

    // Get all active employees for the firm
    const employees = db.prepare(`
      SELECT 
        id,
        employee_name,
        aadhar,
        p_day_wage,
        date_of_joining,
        date_of_exit,
        status
      FROM master_rolls
      WHERE firm_id = ? AND status = 'Active'
      ORDER BY employee_name
    `).all(firmId);

    // Filter eligible employees and get their last wage days
    const eligibleEmployees = employees
      .filter(emp => isEmployeeEligible(emp, month))
      .map(emp => {
        // Get last wage days from previous wages
        const lastWage = Wage.getLastWageForEmployee.get(emp.id, firmId);
        const lastWageDays = lastWage ? lastWage.wage_days : 26;

        return {
          master_roll_id: emp.id,
          employee_name: emp.employee_name,
          aadhar: emp.aadhar,
          p_day_wage: emp.p_day_wage || 0,
          last_wage_days: lastWageDays,
          date_of_joining: emp.date_of_joining,
          date_of_exit: emp.date_of_exit
        };
      });

    res.json({
      success: true,
      data: eligibleEmployees,
      meta: {
        total: eligibleEmployees.length,
        month: month,
        firmId: firmId
      }
    });

  } catch (error) {
    console.error('Error fetching employees for wages:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

/**
 * Create wages in bulk
 */
export async function createWagesBulk(req, res) {
  try {
    const { month, wages } = req.body;
    const userId = req.user.id;
    const firmId = req.user.firm_id;

    // Validate input
    if (!month || !wages || !Array.isArray(wages) || wages.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid wage data' });
    }

    // Start transaction
    const insertWage = db.transaction((wageData) => {
      const results = [];

      for (const wage of wageData) {
        try {
          // Check if wage already exists
          const existingWage = Wage.checkExists.get(firmId, wage.master_roll_id, month);
          if (existingWage) {
            results.push({
              master_roll_id: wage.master_roll_id,
              success: false,
              message: 'Wage already exists for this employee in this month'
            });
            continue;
          }

          // Get employee data for additional fields
          const employee = db.prepare('SELECT p_day_wage FROM master_rolls WHERE id = ? AND firm_id = ?')
            .get(wage.master_roll_id, firmId);

          if (!employee) {
            results.push({
              master_roll_id: wage.master_roll_id,
              success: false,
              message: 'Employee not found'
            });
            continue;
          }

          // Calculate net salary if not provided
          let netSalary = wage.net_salary;
          if (!netSalary) {
            const totalDeductions = (wage.epf_deduction || 0) + 
                                   (wage.esic_deduction || 0) + 
                                   (wage.other_deduction || 0);
            const totalBenefits = wage.other_benefit || 0;
            netSalary = (wage.gross_salary || 0) - totalDeductions + totalBenefits;
          }

          // Insert wage
          const result = Wage.create.run({
            firm_id: firmId,
            master_roll_id: wage.master_roll_id,
            p_day_wage: wage.p_day_wage || employee.p_day_wage || 0,
            wage_days: wage.wage_days || 26,
            gross_salary: wage.gross_salary || 0,
            epf_deduction: wage.epf_deduction || 0,
            esic_deduction: wage.esic_deduction || 0,
            other_deduction: wage.other_deduction || 0,
            other_benefit: wage.other_benefit || 0,
            net_salary: netSalary,
            salary_month: month
          });

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

      return results;
    });

    const results = insertWage(wages);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Created: ${successCount}, Failed: ${failureCount}`,
      results: results
    });

  } catch (error) {
    console.error('Error creating wages:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

/**
 * Get wages for a specific month
 */
export async function getWagesForMonth(req, res) {
  try {
    const { month } = req.query;
    const firmId = req.user.firm_id;

    if (!month) {
      return res.status(400).json({ success: false, message: 'Month required' });
    }

    const wages = Wage.getByFirmAndMonth.all(firmId, month);

    res.json({
      success: true,
      data: wages,
      meta: {
        total: wages.length,
        month: month
      }
    });

  } catch (error) {
    console.error('Error fetching wages:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

/**
 * Update a single wage
 */
export async function updateWage(req, res) {
  try {
    const { id } = req.params;
    const { wage_days, gross_salary, epf_deduction, esic_deduction, other_deduction, other_benefit } = req.body;
    const userId = req.user.id;
    const firmId = req.user.firm_id;

    // Validate required fields
    if (!wage_days || gross_salary === undefined) {
      return res.status(400).json({ success: false, message: 'wage_days and gross_salary required' });
    }

    // Get existing wage
    const existingWage = Wage.getById.get(parseInt(id), firmId);
    if (!existingWage) {
      return res.status(404).json({ success: false, message: 'Wage not found' });
    }

    // Calculate new net salary
    const totalDeductions = (epf_deduction || 0) + 
                           (esic_deduction || 0) + 
                           (other_deduction || 0);
    const totalBenefits = other_benefit || 0;
    const netSalary = gross_salary - totalDeductions + totalBenefits;

    // Calculate per day wage
    const perDayWage = wage_days > 0 ? (gross_salary / wage_days).toFixed(2) : 0;

    const result = Wage.update.run({
      p_day_wage: parseFloat(perDayWage),
      wage_days,
      gross_salary,
      epf_deduction: epf_deduction || 0,
      esic_deduction: esic_deduction || 0,
      other_deduction: other_deduction || 0,
      other_benefit: other_benefit || 0,
      net_salary: netSalary,
      id: parseInt(id),
      firm_id: firmId
    });

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Wage not found' });
    }

    res.json({ success: true, message: 'Wage updated successfully' });

  } catch (error) {
    console.error('Error updating wage:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

/**
 * Delete a wage
 */
export async function deleteWage(req, res) {
  try {
    const { id } = req.params;
    const firmId = req.user.firm_id;

    const result = Wage.delete.run(parseInt(id), firmId);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Wage not found' });
    }

    res.json({ success: true, message: 'Wage deleted successfully' });

  } catch (error) {
    console.error('Error deleting wage:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

/**
 * Get wage by ID
 */
export async function getWageById(req, res) {
  try {
    const { id } = req.params;
    const firmId = req.user.firm_id;

    const wage = Wage.getById.get(parseInt(id), firmId);

    if (!wage) {
      return res.status(404).json({ success: false, message: 'Wage not found' });
    }

    res.json({ success: true, data: wage });

  } catch (error) {
    console.error('Error fetching wage:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}
