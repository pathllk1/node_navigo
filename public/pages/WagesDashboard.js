import * as XLSX from "/cdns/xlsx.mjs";

export function WagesDashboard() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  // Tab state
  let activeTab = 'create'; // 'create' or 'manage'
  
  // Create mode state
  let selectedMonth = '';
  let employees = [];
  let wageData = {};
  let isLoading = false;
  let selectedEmployeeIds = new Set(); // ✅ CHECKBOXES for CREATE mode
  
  // Manage mode state
  let manageMonth = '';
  let existingWages = [];
  let editedWages = {}; // Track edited wages by ID
  let selectedWageIds = new Set(); // For bulk operations
  let isManageLoading = false;
  
  // Bulk edit mode
  let isBulkEditMode = false;
  let bulkEditData = {
    wage_days: '',
    epf_deduction: '',
    esic_deduction: '',
    other_deduction: '',
    other_benefit: '',
    paid_date: '',
    cheque_no: '',
    paid_from_bank_ac: ''
  };
  
  // Common payment fields (Create mode)
  let commonPaymentData = {
    paid_date: '',
    cheque_no: '',
    paid_from_bank_ac: ''
  };
  
  // Filter state (for both Create and Manage)
  let createFilters = {
    searchTerm: '',
    bankFilter: 'all',
    projectFilter: 'all',
    siteFilter: 'all'
  };
  
  let manageFilters = {
    searchTerm: '',
    bankFilter: 'all',
    projectFilter: 'all',
    siteFilter: 'all'
  };

  // Debounce timers for search filters
  let createSearchDebounceTimer = null;
  let manageSearchDebounceTimer = null;

  // Sort state for tables
  let createSort = { column: null, asc: true };
  let manageSort = { column: null, asc: true };

  // Event delegation flag - attach listeners only once
  let listenersAttached = false;

  let manageRenderDebounceTimer = null;
let createRenderDebounceTimer = null;

  /* --------------------------------------------------
     UTILITY FUNCTIONS
  -------------------------------------------------- */

  function formatDateDisplay(dateStr) {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN');
    } catch (e) {
      return dateStr;
    }
  }

  function formatMonthDisplay(yearMonth) {
    if (!yearMonth) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [year, month] = yearMonth.split('-');
    return `${months[parseInt(month) - 1]} ${year}`;
  }

  function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '₹0.00';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function calculateNetSalary(gross, epf, esic, otherDed, otherBen) {
    const totalDeductions = (epf || 0) + (esic || 0) + (otherDed || 0);
    const totalBenefits = otherBen || 0;
    return parseFloat((gross - totalDeductions + totalBenefits).toFixed(2));
  }

  function showToast(message, type = 'success') {
    const bgColor = type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#10b981';
    window.Toastify({ 
      text: message, 
      backgroundColor: bgColor, 
      duration: 3000,
      gravity: 'top',
      position: 'right'
    }).showToast();
  }

  /* --------------------------------------------------
     CREATE MODE - WAGE CALCULATION FUNCTIONS
  -------------------------------------------------- */

  function calculateAllWagesForEmployee(empId) {
    const emp = employees.find(e => e.master_roll_id === empId);
    const wage = wageData[empId];
    if (!emp || !wage) return;

    const dailyRate = wage.p_day_wage || emp.p_day_wage || 0;
    const wageDays = wage.wage_days || 26;

    // Calculate gross salary = Daily Rate * days
    wage.gross_salary = parseFloat((dailyRate * wageDays).toFixed(2));

    // Calculate EPF: round(gross_salary * 12%), max 1800
    wage.epf_deduction = Math.min(Math.round(wage.gross_salary * 0.12), 1800);

    // Calculate ESIC: round up(gross_salary * 0.75%)
    wage.esic_deduction = Math.ceil(wage.gross_salary * 0.0075);

    // Update UI immediately
    updateWageRowDisplay(empId);
  }

  function updateWageRowDisplay(empId) {
    const wage = wageData[empId];
    if (!wage) return;

    const netSalary = calculateNetSalary(
      wage.gross_salary,
      wage.epf_deduction,
      wage.esic_deduction,
      wage.other_deduction,
      wage.other_benefit
    );

    // Update all readonly fields
    const fields = ['gross_salary', 'epf_deduction', 'esic_deduction'];
    fields.forEach(field => {
      const input = document.querySelector(`input[data-employee="${empId}"][data-field="${field}"]`);
      if (input) input.value = wage[field] || 0;
    });

    const netInput = document.querySelector(`input[data-employee="${empId}"][data-field="net_salary"]`);
    if (netInput) netInput.value = netSalary.toFixed(2);
  }

  function calculateBulkForAllEmployees() {
    employees.forEach(emp => {
      if (!wageData[emp.master_roll_id]) {
        wageData[emp.master_roll_id] = {
          p_day_wage: emp.p_day_wage || 0,
          wage_days: emp.last_wage_days || 26,
          gross_salary: 0,
          epf_deduction: 0,
          esic_deduction: 0,
          other_deduction: 0,
          other_benefit: 0
        };
      }
      calculateAllWagesForEmployee(emp.master_roll_id);
    });
    render();
  }

  // ====================================================================
// COMPLETE BUGFIX FOR handleCreateFieldChange FUNCTION
// Replace lines 180-209 in WagesDashboard.js
// ====================================================================

function handleCreateFieldChange(empId, field, value) {
  if (!wageData[empId]) {
    wageData[empId] = {
      p_day_wage: 0,
      wage_days: 26,
      gross_salary: 0,
      epf_deduction: 0,
      esic_deduction: 0,
      other_deduction: 0,
      other_benefit: 0
    };
  }
  
  // Parse value based on field type
  let parsedValue;
  if (field === 'wage_days') {
    parsedValue = parseInt(value) || 0;
  } else {
    parsedValue = parseFloat(value) || 0;
  }
  
  // ✅ FIX: Validation - No negative values
  if (parsedValue < 0) {
    showToast('Value cannot be negative', 'error');
    parsedValue = 0;
  }
  
  // ✅ FIX: Validation - Wage days max 31
  if (field === 'wage_days' && parsedValue > 31) {
    showToast('Wage days cannot exceed 31', 'warning');
    parsedValue = 31;
  }
  
  // ✅ FIX: Validation - EPF max 1800
  if (field === 'epf_deduction' && parsedValue > 1800) {
    showToast('EPF deduction cannot exceed ₹1800', 'warning');
    parsedValue = 1800;
  }
  
  // Update the field value
  wageData[empId][field] = parsedValue;
  
  // ✅ AUTO-CALCULATE when p_day_wage or wage_days changes
  if (field === 'p_day_wage' || field === 'wage_days') {
    const dailyRate = wageData[empId].p_day_wage || 0;
    const wageDays = wageData[empId].wage_days || 26;
    
    // Calculate gross
    wageData[empId].gross_salary = parseFloat((dailyRate * wageDays).toFixed(2));
    
    // Calculate EPF (12%, max 1800)
    wageData[empId].epf_deduction = Math.min(
      Math.round(wageData[empId].gross_salary * 0.12), 
      1800
    );
    
    // Calculate ESIC (0.75%, round up)
    wageData[empId].esic_deduction = Math.ceil(
      wageData[empId].gross_salary * 0.0075
    );
    
    updateWageRowDisplay(empId);
  }
  
  // ✅ FIX BUG #2: AUTO-UPDATE net when EPF/ESIC manually edited
  // ✅ FIX BUG #3: If gross manually edited, recalculate EPF/ESIC
  if (field === 'gross_salary') {
    // Recalculate per-day wage
    const wage = wageData[empId];
    wage.p_day_wage = wage.wage_days > 0 
      ? parseFloat((wage.gross_salary / wage.wage_days).toFixed(2)) 
      : 0;
    
    // Recalculate EPF/ESIC based on new gross
    wage.epf_deduction = Math.min(Math.round(wage.gross_salary * 0.12), 1800);
    wage.esic_deduction = Math.ceil(wage.gross_salary * 0.0075);
    
    updateWageRowDisplay(empId);
  }
  
  // ✅ FIX BUG #2: Update net salary when ANY deduction/benefit changes
  if (field === 'epf_deduction' || field === 'esic_deduction' || 
      field === 'other_deduction' || field === 'other_benefit') {
    updateWageRowDisplay(empId);
  }
}

  /* --------------------------------------------------
     CREATE MODE - API FUNCTIONS
  -------------------------------------------------- */

  async function loadEmployeesForWages() {
    if (!selectedMonth) {
      showToast('Please select a month', 'error');
      return;
    }

    isLoading = true;
    render();

    try {
      const response = await fetch('/api/wages/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth })
      });

      const result = await response.json();

      if (result.success) {
        employees = result.data;
        wageData = {};
        selectedEmployeeIds = new Set(); // Clear selections

        // Initialize wage data with last values
        employees.forEach(emp => {
          wageData[emp.master_roll_id] = {
            p_day_wage: emp.p_day_wage || 0,
            wage_days: emp.last_wage_days || 26,
            gross_salary: 0,
            epf_deduction: 0,
            esic_deduction: 0,
            other_deduction: 0,
            other_benefit: 0
          };
        });

        showToast(`Loaded ${employees.length} employees (${result.meta.already_paid} already paid)`, 'success');
      } else {
        showToast(result.message || 'Failed to load employees', 'error');
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      showToast('Error loading employees', 'error');
    } finally {
      isLoading = false;
      render();
    }
  }

  async function saveWages() {
    if (!selectedMonth) {
      showToast('Please select a month', 'error');
      return;
    }

    // ✅ Only create wages for SELECTED employees
    if (selectedEmployeeIds.size === 0) {
      showToast('Please select at least one employee', 'warning');
      return;
    }

    const wageRecords = Array.from(selectedEmployeeIds).map(empId => {
      const emp = employees.find(e => e.master_roll_id === empId);
      const wage = wageData[empId] || {};
      return {
        master_roll_id: empId,
        p_day_wage: wage.p_day_wage || emp.p_day_wage || 0,
        wage_days: wage.wage_days || 26,
        gross_salary: wage.gross_salary || 0,
        epf_deduction: wage.epf_deduction || 0,
        esic_deduction: wage.esic_deduction || 0,
        other_deduction: wage.other_deduction || 0,
        other_benefit: wage.other_benefit || 0,
        paid_date: commonPaymentData.paid_date || null,
        cheque_no: commonPaymentData.cheque_no || null,
        paid_from_bank_ac: commonPaymentData.paid_from_bank_ac || null
      };
    });

    isLoading = true;
    render();

    try {
      const response = await fetch('/api/wages/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, wages: wageRecords })
      });

      const result = await response.json();

      if (result.success) {
        showToast(result.message, 'success');
        // Clear form after successful save
        employees = [];
        wageData = {};
        selectedMonth = '';
        selectedEmployeeIds = new Set();
      } else {
        showToast(result.message || 'Failed to save wages', 'error');
      }
    } catch (error) {
      console.error('Error saving wages:', error);
      showToast('Error saving wages', 'error');
    } finally {
      isLoading = false;
      render();
    }
  }

  /* --------------------------------------------------
     MANAGE MODE - API FUNCTIONS
  -------------------------------------------------- */

  async function loadExistingWages() {
    if (!manageMonth) {
      showToast('Please select a month', 'error');
      return;
    }

    isManageLoading = true;
    render();

    try {
      const response = await fetch(`/api/wages/manage?month=${manageMonth}`);
      const result = await response.json();

      if (result.success) {
        existingWages = result.data;
        editedWages = {};
        selectedWageIds = new Set();
        isBulkEditMode = false;
        
        showToast(`Loaded ${existingWages.length} wage records for ${formatMonthDisplay(manageMonth)}`, 'success');
      } else {
        showToast(result.message || 'Failed to load wages', 'error');
      }
    } catch (error) {
      console.error('Error loading wages:', error);
      showToast('Error loading wages', 'error');
    } finally {
      isManageLoading = false;
      render();
    }
  }

  async function saveEditedWages() {
    const wagesToUpdate = Object.keys(editedWages).map(id => ({
      id: parseInt(id),
      ...editedWages[id]
    }));

    if (wagesToUpdate.length === 0) {
      showToast('No changes to save', 'warning');
      return;
    }

    isManageLoading = true;
    render();

    try {
      const response = await fetch('/api/wages/bulk-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wages: wagesToUpdate })
      });

      const result = await response.json();

      if (result.success) {
        showToast(result.message, 'success');
        editedWages = {};
        await loadExistingWages(); // Reload to get fresh data
      } else {
        showToast(result.message || 'Failed to update wages', 'error');
      }
    } catch (error) {
      console.error('Error updating wages:', error);
      showToast('Error updating wages', 'error');
    } finally {
      isManageLoading = false;
      render();
    }
  }

  async function deleteSelectedWages() {
    if (selectedWageIds.size === 0) {
      showToast('Please select wages to delete', 'warning');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedWageIds.size} wage record(s)?`)) {
      return;
    }

    isManageLoading = true;
    render();

    try {
      const response = await fetch('/api/wages/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedWageIds) })
      });

      const result = await response.json();

      if (result.success) {
        showToast(result.message, 'success');
        selectedWageIds = new Set();
        await loadExistingWages(); // Reload to get fresh data
      } else {
        showToast(result.message || 'Failed to delete wages', 'error');
      }
    } catch (error) {
      console.error('Error deleting wages:', error);
      showToast('Error deleting wages', 'error');
    } finally {
      isManageLoading = false;
      render();
    }
  }

  /* --------------------------------------------------
     MANAGE MODE - BULK EDIT FUNCTIONS
  -------------------------------------------------- */

  function applyBulkEdit() {
    if (selectedWageIds.size === 0) {
      showToast('Please select wages to edit', 'warning');
      return;
    }

    selectedWageIds.forEach(wageId => {
      const wage = existingWages.find(w => w.id === wageId);
      if (!wage) return;

      if (!editedWages[wageId]) {
        editedWages[wageId] = { ...wage };
      }

      // Apply bulk edit fields that are not empty
      if (bulkEditData.wage_days !== '') {
        editedWages[wageId].wage_days = parseInt(bulkEditData.wage_days);
        // Recalculate gross
        const perDayWage = wage.p_day_wage || 0;
        editedWages[wageId].gross_salary = parseFloat((perDayWage * editedWages[wageId].wage_days).toFixed(2));
      }

      if (bulkEditData.epf_deduction !== '') {
        editedWages[wageId].epf_deduction = parseFloat(bulkEditData.epf_deduction);
      }

      if (bulkEditData.esic_deduction !== '') {
        editedWages[wageId].esic_deduction = parseFloat(bulkEditData.esic_deduction);
      }

      if (bulkEditData.other_deduction !== '') {
        editedWages[wageId].other_deduction = parseFloat(bulkEditData.other_deduction);
      }

      if (bulkEditData.other_benefit !== '') {
        editedWages[wageId].other_benefit = parseFloat(bulkEditData.other_benefit);
      }

      if (bulkEditData.paid_date !== '') {
        editedWages[wageId].paid_date = bulkEditData.paid_date;
      }

      if (bulkEditData.cheque_no !== '') {
        editedWages[wageId].cheque_no = bulkEditData.cheque_no;
      }

      if (bulkEditData.paid_from_bank_ac !== '') {
        editedWages[wageId].paid_from_bank_ac = bulkEditData.paid_from_bank_ac;
      }
    });

    // Clear bulk edit data
    bulkEditData = {
      wage_days: '',
      epf_deduction: '',
      esic_deduction: '',
      other_deduction: '',
      other_benefit: '',
      paid_date: '',
      cheque_no: '',
      paid_from_bank_ac: ''
    };

    isBulkEditMode = false;
    showToast(`Bulk edit applied to ${selectedWageIds.size} records`, 'success');
    render();
  }

  function handleManageFieldChange(wageId, field, value) {
    const wage = existingWages.find(w => w.id === wageId);
    if (!wage) return;

    if (!editedWages[wageId]) {
      editedWages[wageId] = { ...wage };
    }

    editedWages[wageId][field] = field === 'wage_days' ? parseInt(value) : parseFloat(value);

    // Auto-recalculate if wage_days changes
    if (field === 'wage_days') {
      const perDayWage = wage.p_day_wage || 0;
      editedWages[wageId].gross_salary = parseFloat((perDayWage * editedWages[wageId].wage_days).toFixed(2));
    }

    render();
  }

  /* --------------------------------------------------
     EXPORT FUNCTIONS
  -------------------------------------------------- */

  function exportToExcel() {
    // Determine which rows to export
    let rowsToExport = [];
    
    if (activeTab === 'create') {
      if (selectedEmployeeIds.size > 0) {
        // Export only selected rows
        rowsToExport = Array.from(selectedEmployeeIds);
      } else if (employees.length === 0) {
        showToast('No data to export', 'warning');
        return;
      } else {
        // Export all if none selected
        rowsToExport = employees.map(e => e.master_roll_id);
      }
    } else {
      if (selectedWageIds.size > 0) {
        // Export only selected rows
        rowsToExport = Array.from(selectedWageIds);
      } else if (existingWages.length === 0) {
        showToast('No data to export', 'warning');
        return;
      } else {
        // Export all if none selected
        rowsToExport = existingWages.map(w => w.id);
      }
    }

    const data = activeTab === 'create' 
      ? employees.filter(emp => rowsToExport.includes(emp.master_roll_id)).map(emp => {
          const wage = wageData[emp.master_roll_id] || {};
          return {
            'Employee Name': emp.employee_name,
            'Bank': emp.bank,
            'Account No': emp.account_no,
            'Per Day Wage': wage.p_day_wage || emp.p_day_wage || 0,
            'Wage Days': wage.wage_days || 26,
            'Gross Salary': wage.gross_salary || 0,
            'EPF': wage.epf_deduction || 0,
            'ESIC': wage.esic_deduction || 0,
            'Other Deduction': wage.other_deduction || 0,
            'Other Benefit': wage.other_benefit || 0,
            'Net Salary': calculateNetSalary(
              wage.gross_salary,
              wage.epf_deduction,
              wage.esic_deduction,
              wage.other_deduction,
              wage.other_benefit
            )
          };
        })
      : existingWages.filter(wage => rowsToExport.includes(wage.id)).map(wage => {
          const edited = editedWages[wage.id] || wage;
          return {
            'Employee Name': wage.employee_name,
            'Aadhar': wage.aadhar,
            'Bank': wage.bank,
            'Account No': wage.account_no,
            'Per Day Wage': edited.p_day_wage,
            'Wage Days': edited.wage_days,
            'Gross Salary': edited.gross_salary,
            'EPF': edited.epf_deduction,
            'ESIC': edited.esic_deduction,
            'Other Deduction': edited.other_deduction || 0,
            'Other Benefit': edited.other_benefit || 0,
            'Net Salary': calculateNetSalary(
              edited.gross_salary,
              edited.epf_deduction,
              edited.esic_deduction,
              edited.other_deduction,
              edited.other_benefit
            ),
            'Paid Date': edited.paid_date || '-',
            'Cheque No': edited.cheque_no || '-',
            'Paid From Bank': edited.paid_from_bank_ac || '-'
          };
        });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Wages');
    
    const month = activeTab === 'create' ? selectedMonth : manageMonth;
    XLSX.writeFile(wb, `Wages_${month}_${activeTab}.xlsx`);
    const exportCount = activeTab === 'create' ? selectedEmployeeIds.size || employees.length : selectedWageIds.size || existingWages.length;
    showToast(`Exported ${exportCount} record(s) successfully`, 'success');
  }

  /* --------------------------------------------------
     FILTERING AND SORTING
  -------------------------------------------------- */

  function sortArray(data, column, asc) {
    if (!column) return data;
    
    return [...data].sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];
      
      // Handle undefined/null
      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';
      
      // Numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return asc ? aVal - bVal : bVal - aVal;
      }
      
      // String comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      if (asc) {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }

  function getFilteredCreateEmployees() {
    return employees.filter(emp => {
      // Search filter
      const searchMatch = !createFilters.searchTerm || 
        emp.employee_name.toLowerCase().includes(createFilters.searchTerm.toLowerCase()) ||
        emp.aadhar.includes(createFilters.searchTerm) ||
        emp.account_no.includes(createFilters.searchTerm);

      // Bank filter
      const bankMatch = createFilters.bankFilter === 'all' || 
        emp.bank === createFilters.bankFilter;

      // Project filter
      const projectMatch = createFilters.projectFilter === 'all' || 
        emp.project === createFilters.projectFilter;

      // Site filter
      const siteMatch = createFilters.siteFilter === 'all' || 
        emp.site === createFilters.siteFilter;

      return searchMatch && bankMatch && projectMatch && siteMatch;
    });
  }

  function getFilteredManageWages() {
    return existingWages.filter(wage => {
      // Search filter
      const searchMatch = !manageFilters.searchTerm || 
        wage.employee_name.toLowerCase().includes(manageFilters.searchTerm.toLowerCase()) ||
        wage.aadhar.includes(manageFilters.searchTerm) ||
        wage.account_no.includes(manageFilters.searchTerm);

      // Bank filter
      const bankMatch = manageFilters.bankFilter === 'all' || 
        wage.bank === manageFilters.bankFilter;

      // Project filter
      const projectMatch = manageFilters.projectFilter === 'all' || 
        wage.project === manageFilters.projectFilter;

      // Site filter
      const siteMatch = manageFilters.siteFilter === 'all' || 
        wage.site === manageFilters.siteFilter;

      return searchMatch && bankMatch && projectMatch && siteMatch;
    });
  }

  function getUniqueValues(array, key) {
    return [...new Set(array.map(item => item[key]).filter(Boolean))].sort();
  }

  /* --------------------------------------------------
     RENDER FUNCTIONS
  -------------------------------------------------- */

  function renderTabs() {
    return `
      <div class="tabs" style="border-bottom: 2px solid #e5e7eb; margin-bottom: 20px;">
        <button 
          class="tab-btn ${activeTab === 'create' ? 'active' : ''}" 
          data-action="switch-tab"
          data-tab="create"
          style="
            padding: 12px 24px;
            background: ${activeTab === 'create' ? '#3b82f6' : 'transparent'};
            color: ${activeTab === 'create' ? 'white' : '#6b7280'};
            border: none;
            border-bottom: 3px solid ${activeTab === 'create' ? '#3b82f6' : 'transparent'};
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
          "
        >
          📝 Create Wages
        </button>
        <button 
          class="tab-btn ${activeTab === 'manage' ? 'active' : ''}" 
          data-action="switch-tab"
          data-tab="manage"
          style="
            padding: 12px 24px;
            background: ${activeTab === 'manage' ? '#3b82f6' : 'transparent'};
            color: ${activeTab === 'manage' ? 'white' : '#6b7280'};
            border: none;
            border-bottom: 3px solid ${activeTab === 'manage' ? '#3b82f6' : 'transparent'};
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
          "
        >
          ✏️ Manage Wages
        </button>
      </div>
    `;
  }

  function renderCreateMode() {
    const filteredEmployees = getFilteredCreateEmployees();
    const uniqueBanks = getUniqueValues(employees, 'bank');
    const uniqueProjects = getUniqueValues(employees, 'project');
    const uniqueSites = getUniqueValues(employees, 'site');
    
    return `
      <div class="create-mode">
        <!-- Controls -->
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Month</label>
              <input 
                type="month" 
                value="${selectedMonth}"
                data-action="set-month"
                style="padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;"
              />
            </div>
            
            <div style="margin-top: auto;">
              <button 
                data-action="load-employees" 
                ${isLoading ? 'disabled' : ''}
                style="
                  padding: 8px 16px;
                  background: #3b82f6;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                  font-weight: 600;
                "
              >
                ${isLoading ? '⏳ Loading...' : '🔄 Load Unpaid Employees'}
              </button>
            </div>

            ${employees.length > 0 ? `
              <div style="margin-top: auto;">
                <button 
                  data-action="calculate-bulk"
                  style="
                    padding: 8px 16px;
                    background: #10b981;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                  "
                >
                  🧮 Calculate All
                </button>
              </div>

              <div style="margin-top: auto;">
                <button 
                  data-action="save-wages"
                  ${isLoading || selectedEmployeeIds.size === 0 ? 'disabled' : ''}
                  style="
                    padding: 8px 16px;
                    background: ${selectedEmployeeIds.size === 0 ? '#9ca3af' : '#059669'};
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: ${selectedEmployeeIds.size === 0 ? 'not-allowed' : 'pointer'};
                    font-weight: 600;
                  "
                >
                  💾 Save Wages ${selectedEmployeeIds.size > 0 ? `(${selectedEmployeeIds.size})` : ''}
                </button>
              </div>

              <div style="margin-top: auto;">
                <button 
                  data-action="export-excel"
                  style="
                    padding: 8px 16px;
                    background: #6366f1;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                  "
                >
                  📊 Export
                </button>
              </div>
            ` : ''}
          </div>

          ${employees.length > 0 ? `
            <!-- Filters -->
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
              <h4 style="margin-bottom: 10px; color: #374151; font-size: 14px; font-weight: 600;">🔍 Filters</h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                <div>
                  <input 
                    type="text" 
                    placeholder="Search by name, aadhar, account..."
                    value="${createFilters.searchTerm}"
                    data-action="search-filter"
                    data-mode="create"
                    data-field="searchTerm"
                    style="width: 100%; padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px;"
                  />
                </div>
                
                <div>
                  <select 
                    data-action="set-filter"
                    data-mode="create"
                    data-field="bankFilter"
                    style="width: 100%; padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px;"
                  >
                    <option value="all" ${createFilters.bankFilter === 'all' ? 'selected' : ''}>All Banks</option>
                    ${uniqueBanks.map(bank => `<option value="${bank}" ${createFilters.bankFilter === bank ? 'selected' : ''}>${bank}</option>`).join('')}
                  </select>
                </div>
                
                <div>
                  <select 
                    data-action="set-filter"
                    data-mode="create"
                    data-field="projectFilter"
                    style="width: 100%; padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px;"
                  >
                    <option value="all" ${createFilters.projectFilter === 'all' ? 'selected' : ''}>All Projects</option>
                    ${uniqueProjects.map(proj => `<option value="${proj}" ${createFilters.projectFilter === proj ? 'selected' : ''}>${proj}</option>`).join('')}
                  </select>
                </div>
                
                <div>
                  <select 
                    data-action="set-filter"
                    data-mode="create"
                    data-field="siteFilter"
                    style="width: 100%; padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px;"
                  >
                    <option value="all" ${createFilters.siteFilter === 'all' ? 'selected' : ''}>All Sites</option>
                    ${uniqueSites.map(site => `<option value="${site}" ${createFilters.siteFilter === site ? 'selected' : ''}>${site}</option>`).join('')}
                  </select>
                </div>
                
                <div>
                  <button 
                    data-action="reset-filters"
                    data-mode="create"
                    style="
                      padding: 6px 12px;
                      background: #ef4444;
                      color: white;
                      border: none;
                      border-radius: 4px;
                      cursor: pointer;
                      font-weight: 600;
                      font-size: 13px;
                    "
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>
            </div>

            <!-- Totals Section -->
            ${selectedEmployeeIds.size > 0 ? `
              <div style="margin-top: 15px; padding: 15px; background: linear-gradient(135deg, #f0fdf4, #fef2f2); border-radius: 8px; border: 1px solid #e5e7eb;">
                <h4 style="margin-bottom: 10px; color: #374151; font-size: 13px; font-weight: 600;">📊 Summary (${selectedEmployeeIds.size} selected)</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                  <div style="padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #ef4444;">
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 3px;">Total Gross Salary</div>
                    <div style="font-size: 16px; font-weight: 700; color: #059669;">${formatCurrency(Array.from(selectedEmployeeIds).reduce((sum, empId) => {
                      const wage = wageData[empId] || {};
                      return sum + (wage.gross_salary || 0);
                    }, 0))}</div>
                  </div>
                  <div style="padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #10b981;">
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 3px;">Total Net Salary</div>
                    <div style="font-size: 16px; font-weight: 700; color: #059669;">${formatCurrency(Array.from(selectedEmployeeIds).reduce((sum, empId) => {
                      const wage = wageData[empId] || {};
                      return sum + calculateNetSalary(wage.gross_salary, wage.epf_deduction, wage.esic_deduction, wage.other_deduction, wage.other_benefit);
                    }, 0))}</div>
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Common Payment Details -->
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
              <h4 style="margin-bottom: 10px; color: #374151; font-size: 14px; font-weight: 600;">💳 Common Payment Details (optional)</h4>
              <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <div>
                  <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #6b7280;">Paid Date</label>
                  <input 
                    type="date" 
                    value="${commonPaymentData.paid_date}"
                    data-action="set-payment"
                    data-field="paid_date"
                    style="padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px;"
                  />
                </div>
                <div>
                  <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #6b7280;">Cheque No</label>
                  <input 
                    type="text" 
                    value="${commonPaymentData.cheque_no}"
                    data-action="set-payment"
                    data-field="cheque_no"
                    placeholder="Optional"
                    style="padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; width: 150px;"
                  />
                </div>
                <div>
                  <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #6b7280;">Paid From Bank A/C</label>
                  <input 
                    type="text" 
                    value="${commonPaymentData.paid_from_bank_ac}"
                    data-action="set-payment"
                    data-field="paid_from_bank_ac"
                    placeholder="Optional"
                    style="padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; width: 200px;"
                  />
                </div>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Employee Table -->
        ${employees.length > 0 ? `
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="margin-bottom: 15px; color: #1f2937;">
              Employees for ${formatMonthDisplay(selectedMonth)} 
              <span style="color: #6b7280; font-size: 14px;">
                (${filteredEmployees.length} of ${employees.length} employees)
                ${selectedEmployeeIds.size > 0 ? `<span style="color: #3b82f6;"> • ${selectedEmployeeIds.size} selected</span>` : ''}
              </span>
            </h3>
            
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                  <tr style="background: linear-gradient(to right, #ef4444, #10b981); border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 12px; text-align: center; color: white; font-weight: 600;">
                      <input 
                        type="checkbox" 
                        ${selectedEmployeeIds.size === filteredEmployees.length && filteredEmployees.length > 0 ? 'checked' : ''}
                        data-action="select-all-employees"
                        style="cursor: pointer; width: 16px; height: 16px;"
                      />
                    </th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: white; cursor: pointer;" data-action="sort-column" data-column="employee_name" data-mode="create">Employee ${createSort.column === 'employee_name' ? (createSort.asc ? '▲' : '▼') : '⇅'}</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: white;">Bank Details</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: white; cursor: pointer;" data-action="sort-column" data-column="p_day_wage" data-mode="create">Per Day ${createSort.column === 'p_day_wage' ? (createSort.asc ? '▲' : '▼') : '⇅'}</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: white; cursor: pointer;" data-action="sort-column" data-column="wage_days" data-mode="create">Days ${createSort.column === 'wage_days' ? (createSort.asc ? '▲' : '▼') : '⇅'}</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: white; cursor: pointer;" data-action="sort-column" data-column="gross_salary" data-mode="create">Gross ${createSort.column === 'gross_salary' ? (createSort.asc ? '▲' : '▼') : '⇅'}</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: white; cursor: pointer;" data-action="sort-column" data-column="epf_deduction" data-mode="create">EPF ${createSort.column === 'epf_deduction' ? (createSort.asc ? '▲' : '▼') : '⇅'}</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: white; cursor: pointer;" data-action="sort-column" data-column="esic_deduction" data-mode="create">ESIC ${createSort.column === 'esic_deduction' ? (createSort.asc ? '▲' : '▼') : '⇅'}</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: white; cursor: pointer;" data-action="sort-column" data-column="other_deduction" data-mode="create">Other Ded ${createSort.column === 'other_deduction' ? (createSort.asc ? '▲' : '▼') : '⇅'}</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: white; cursor: pointer;" data-action="sort-column" data-column="other_benefit" data-mode="create">Other Ben ${createSort.column === 'other_benefit' ? (createSort.asc ? '▲' : '▼') : '⇅'}</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: white; cursor: pointer;" data-action="sort-column" data-column="net_salary" data-mode="create">Net Salary ${createSort.column === 'net_salary' ? (createSort.asc ? '▲' : '▼') : '⇅'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${sortArray(filteredEmployees, createSort.column, createSort.asc).map(emp => {
                    const wage = wageData[emp.master_roll_id] || {};
                    const isSelected = selectedEmployeeIds.has(emp.master_roll_id);
                    const netSalary = calculateNetSalary(
                      wage.gross_salary,
                      wage.epf_deduction,
                      wage.esic_deduction,
                      wage.other_deduction,
                      wage.other_benefit
                    );
                    
                    return `
                      <tr style="border-bottom: 1px solid #e5e7eb; background: ${isSelected ? '#eff6ff' : 'white'};">
                        <td style="padding: 12px; text-align: center;">
                          <input 
                            type="checkbox" 
                            ${isSelected ? 'checked' : ''}
                            data-action="toggle-employee"
                            data-emp-id="${emp.master_roll_id}"
                            style="cursor: pointer; width: 16px; height: 16px;"
                          />
                        </td>
                        <td style="padding: 12px;">
                          <div style="font-weight: 600; color: #1f2937;">${emp.employee_name}</div>
                          <div style="font-size: 11px; color: #6b7280;">${emp.project || 'N/A'} - ${emp.site || 'N/A'}</div>
                        </td>
                        <td style="padding: 12px;">
                          <div style="font-size: 13px; color: #374151;">${emp.bank}</div>
                          <div style="font-size: 11px; color: #6b7280;">${emp.account_no}</div>
                        </td>
                        <td style="padding: 12px; text-align: center;">
                          <input 
                            type="number" 
                            step="0.01"
                            value="${wage.p_day_wage || emp.p_day_wage || 0}"
                            data-action="edit-employee"
                            data-emp-id="${emp.master_roll_id}"
                            data-field="p_day_wage"
                            style="width: 80px; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; text-align: right; font-size: 13px;"
                          />
                        </td>
                        <td style="padding: 12px; text-align: center;">
                          <input 
                            type="number" 
                            value="${wage.wage_days || 26}"
                            data-action="edit-employee"
                            data-emp-id="${emp.master_roll_id}"
                            data-field="wage_days"
                            style="width: 60px; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; text-align: center; font-size: 13px;"
                          />
                        </td>
                        <td style="padding: 12px; text-align: right;">
                          <input 
                            type="number" 
                            value="${wage.gross_salary || 0}"
                            readonly
                            style="width: 100px; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb; text-align: right; font-size: 13px; color: #374151;"
                          />
                        </td>
                        <td style="padding: 12px; text-align: right;">
  <input 
    type="number" 
    step="0.01"
    value="${wage.epf_deduction || 0}"
    data-action="edit-employee"
    data-emp-id="${emp.master_roll_id}"
    data-field="epf_deduction"
    style="width: 80px; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; text-align: right; font-size: 13px;"
  />
</td>
                        <td style="padding: 12px; text-align: right;">
  <input 
    type="number" 
    step="0.01"
    value="${wage.esic_deduction || 0}"
    data-action="edit-employee"
    data-emp-id="${emp.master_roll_id}"
    data-field="esic_deduction"
    style="width: 80px; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; text-align: right; font-size: 13px;"
  />
</td>
                        <td style="padding: 12px; text-align: right;">
                          <input 
                            type="number" 
                            step="0.01"
                            value="${wage.other_deduction || 0}"
                            data-action="edit-employee"
                            data-emp-id="${emp.master_roll_id}"
                            data-field="other_deduction"
                            style="width: 80px; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; text-align: right; font-size: 13px;"
                          />
                        </td>
                        <td style="padding: 12px; text-align: right;">
                          <input 
                            type="number" 
                            step="0.01"
                            value="${wage.other_benefit || 0}"
                            data-action="edit-employee"
                            data-emp-id="${emp.master_roll_id}"
                            data-field="other_benefit"
                            style="width: 80px; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; text-align: right; font-size: 13px;"
                          />
                        </td>
                        <td style="padding: 12px; text-align: right;">
                          <input 
                            type="number" 
                            value="${netSalary.toFixed(2)}"
                            data-employee="${emp.master_roll_id}"
                            data-field="net_salary"
                            readonly
                            style="width: 110px; padding: 6px; border: 2px solid #10b981; border-radius: 4px; background: #ecfdf5; text-align: right; font-weight: 600; color: #059669; font-size: 13px;"
                          />
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : `
          <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
            <h3 style="color: #6b7280; margin-bottom: 8px;">No Employees Loaded</h3>
            <p style="color: #9ca3af;">Select a month and click "Load Unpaid Employees" to get started</p>
          </div>
        `}
      </div>
    `;
  }

  function renderManageMode() {
    const filteredWages = getFilteredManageWages();
    const uniqueBanks = getUniqueValues(existingWages, 'bank');
    const uniqueProjects = getUniqueValues(existingWages, 'project');
    const uniqueSites = getUniqueValues(existingWages, 'site');
    
    return `
      <div class="manage-mode">
        <!-- Controls -->
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Month</label>
              <input 
                type="month" 
                value="${manageMonth}"
                data-action="set-manage-month"
                style="padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;"
              />
            </div>
            
            <div style="margin-top: auto;">
              <button 
                data-action="load-manage-wages" 
                ${isManageLoading ? 'disabled' : ''}
                style="
                  padding: 8px 16px;
                  background: #3b82f6;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                  font-weight: 600;
                "
              >
                ${isManageLoading ? '⏳ Loading...' : '🔄 Load Wages'}
              </button>
            </div>

            ${existingWages.length > 0 ? `
              ${selectedWageIds.size > 0 ? `
                <div style="margin-top: auto;">
                  <button 
                    data-action="toggle-bulk-edit"
                    style="
                      padding: 8px 16px;
                      background: ${isBulkEditMode ? '#dc2626' : '#8b5cf6'};
                      color: white;
                      border: none;
                      border-radius: 6px;
                      cursor: pointer;
                      font-weight: 600;
                    "
                  >
                    ${isBulkEditMode ? '❌ Cancel Bulk Edit' : '✏️ Bulk Edit (' + selectedWageIds.size + ')'}
                  </button>
                </div>

                <div style="margin-top: auto;">
                  <button 
                    data-action="delete-selected"
                    style="
                      padding: 8px 16px;
                      background: #ef4444;
                      color: white;
                      border: none;
                      border-radius: 6px;
                      cursor: pointer;
                      font-weight: 600;
                    "
                  >
                    🗑️ Delete Selected (${selectedWageIds.size})
                  </button>
                </div>
              ` : ''}

              ${Object.keys(editedWages).length > 0 ? `
                <div style="margin-top: auto;">
                  <button 
                    data-action="save-edited"
                    ${isManageLoading ? 'disabled' : ''}
                    style="
                      padding: 8px 16px;
                      background: #059669;
                      color: white;
                      border: none;
                      border-radius: 6px;
                      cursor: pointer;
                      font-weight: 600;
                    "
                  >
                    💾 Save Changes (${Object.keys(editedWages).length})
                  </button>
                </div>
              ` : ''}

              <div style="margin-top: auto;">
                <button 
                  data-action="export-excel"
                  style="
                    padding: 8px 16px;
                    background: #6366f1;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                  "
                >
                  📊 Export
                </button>
              </div>
            ` : ''}
          </div>

          ${existingWages.length > 0 ? `
            <!-- Manage Mode Totals Section -->
            ${selectedWageIds.size > 0 ? `
              <div style="margin-top: 15px; padding: 15px; background: linear-gradient(135deg, #f0fdf4, #fef2f2); border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 15px;">
                <h4 style="margin-bottom: 10px; color: #374151; font-size: 13px; font-weight: 600;">📊 Summary (${selectedWageIds.size} selected)</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                  <div style="padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #ef4444;">
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 3px;">Total Gross Salary</div>
                    <div style="font-size: 16px; font-weight: 700; color: #059669;">${formatCurrency(Array.from(selectedWageIds).reduce((sum, wageId) => {
                      const wage = existingWages.find(w => w.id === wageId);
                      const edited = editedWages[wageId] || wage;
                      return sum + (edited ? edited.gross_salary : 0);
                    }, 0))}</div>
                  </div>
                  <div style="padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #10b981;">
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 3px;">Total Net Salary</div>
                    <div style="font-size: 16px; font-weight: 700; color: #059669;">${formatCurrency(Array.from(selectedWageIds).reduce((sum, wageId) => {
                      const wage = existingWages.find(w => w.id === wageId);
                      const edited = editedWages[wageId] || wage;
                      return sum + calculateNetSalary(edited.gross_salary, edited.epf_deduction, edited.esic_deduction, edited.other_deduction, edited.other_benefit);
                    }, 0))}</div>
                  </div>
                </div>
              </div>
            ` : ''}

            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
              <h4 style="margin-bottom: 10px; color: #374151; font-size: 14px; font-weight: 600;">🔍 Filters</h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                <div>
                  <input 
                    type="text" 
                    placeholder="Search by name, aadhar, account..."
                    value="${manageFilters.searchTerm}"
                    data-action="search-filter"
                    data-mode="manage"
                    data-field="searchTerm"
                    style="width: 100%; padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px;"
                  />
                </div>
                
                <div>
                  <select 
                    data-action="set-filter"
                    data-mode="manage"
                    data-field="bankFilter"
                    style="width: 100%; padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px;"
                  >
                    <option value="all" ${manageFilters.bankFilter === 'all' ? 'selected' : ''}>All Banks</option>
                    ${uniqueBanks.map(bank => `<option value="${bank}" ${manageFilters.bankFilter === bank ? 'selected' : ''}>${bank}</option>`).join('')}
                  </select>
                </div>
                
                <div>
                  <select 
                    data-action="set-filter"
                    data-mode="manage"
                    data-field="projectFilter"
                    style="width: 100%; padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px;"
                  >
                    <option value="all" ${manageFilters.projectFilter === 'all' ? 'selected' : ''}>All Projects</option>
                    ${uniqueProjects.map(proj => `<option value="${proj}" ${manageFilters.projectFilter === proj ? 'selected' : ''}>${proj}</option>`).join('')}
                  </select>
                </div>
                
                <div>
                  <select 
                    data-action="set-filter"
                    data-mode="manage"
                    data-field="siteFilter"
                    style="width: 100%; padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px;"
                  >
                    <option value="all" ${manageFilters.siteFilter === 'all' ? 'selected' : ''}>All Sites</option>
                    ${uniqueSites.map(site => `<option value="${site}" ${manageFilters.siteFilter === site ? 'selected' : ''}>${site}</option>`).join('')}
                  </select>
                </div>
                
                <div>
                  <button 
                    data-action="reset-filters"
                    data-mode="manage"
                    style="
                      padding: 6px 12px;
                      background: #ef4444;
                      color: white;
                      border: none;
                      border-radius: 4px;
                      cursor: pointer;
                      font-weight: 600;
                      font-size: 13px;
                    "
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Bulk Edit Panel -->
        ${isBulkEditMode ? `
          <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="margin-bottom: 15px; color: #1e40af;">
              🎯 Bulk Edit Mode - Editing ${selectedWageIds.size} wage records
            </h4>
            <p style="margin-bottom: 15px; color: #6b7280; font-size: 14px;">
              Enter values for the fields you want to update. Leave blank to keep existing values.
            </p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
              <div>
                <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #374151; font-weight: 600;">Wage Days</label>
                <input 
                  type="number" 
                  value="${bulkEditData.wage_days}"
                  data-action="set-bulk-edit"
                  data-field="wage_days"
                  placeholder="Leave blank to skip"
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"
                />
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #374151; font-weight: 600;">EPF Deduction</label>
                <input 
                  type="number" 
                  step="0.01"
                  value="${bulkEditData.epf_deduction}"
                  data-action="set-bulk-edit"
                  data-field="epf_deduction"
                  placeholder="Leave blank to skip"
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"
                />
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #374151; font-weight: 600;">ESIC Deduction</label>
                <input 
                  type="number" 
                  step="0.01"
                  value="${bulkEditData.esic_deduction}"
                  data-action="set-bulk-edit"
                  data-field="esic_deduction"
                  placeholder="Leave blank to skip"
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"
                />
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #374151; font-weight: 600;">Other Deduction</label>
                <input 
                  type="number" 
                  step="0.01"
                  value="${bulkEditData.other_deduction}"
                  data-action="set-bulk-edit"
                  data-field="other_deduction"
                  placeholder="Leave blank to skip"
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"
                />
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #374151; font-weight: 600;">Other Benefit</label>
                <input 
                  type="number" 
                  step="0.01"
                  value="${bulkEditData.other_benefit}"
                  data-action="set-bulk-edit"
                  data-field="other_benefit"
                  placeholder="Leave blank to skip"
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"
                />
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #374151; font-weight: 600;">Paid Date</label>
                <input 
                  type="date" 
                  value="${bulkEditData.paid_date}"
                  data-action="set-bulk-edit"
                  data-field="paid_date"
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"
                />
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #374151; font-weight: 600;">Cheque No</label>
                <input 
                  type="text" 
                  value="${bulkEditData.cheque_no}"
                  data-action="set-bulk-edit"
                  data-field="cheque_no"
                  placeholder="Leave blank to skip"
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"
                />
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #374151; font-weight: 600;">Paid From Bank A/C</label>
                <input 
                  type="text" 
                  value="${bulkEditData.paid_from_bank_ac}"
                  data-action="set-bulk-edit"
                  data-field="paid_from_bank_ac"
                  placeholder="Leave blank to skip"
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"
                />
              </div>
            </div>
            
            <div style="margin-top: 15px; display: flex; gap: 10px;">
              <button 
                data-action="apply-bulk-edit"
                style="
                  padding: 10px 20px;
                  background: #059669;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                  font-weight: 600;
                "
              >
                ✅ Apply Bulk Edit
              </button>
              <button 
                data-action="toggle-bulk-edit"
                style="
                  padding: 10px 20px;
                  background: #6b7280;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                  font-weight: 600;
                "
              >
                Cancel
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Wages Table -->
        ${existingWages.length > 0 ? `
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="margin-bottom: 15px; color: #1f2937;">
              Wage Records for ${formatMonthDisplay(manageMonth)}
              <span style="color: #6b7280; font-size: 14px;">(${filteredWages.length} of ${existingWages.length} records)</span>
              ${Object.keys(editedWages).length > 0 ? `
                <span style="color: #f59e0b; font-size: 14px; margin-left: 10px;">⚠️ ${Object.keys(editedWages).length} unsaved changes</span>
              ` : ''}
            </h3>
            
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                  <tr style="background: linear-gradient(to right, #ef4444, #10b981); border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 10px; text-align: center; color: white; font-weight: 600;">
                      <input 
                        type="checkbox" 
                        ${selectedWageIds.size === filteredWages.length && filteredWages.length > 0 ? 'checked' : ''}
                        data-action="select-all-wages"
                        style="cursor: pointer; width: 16px; height: 16px;"
                      />
                    </th>
                    <th style="padding: 10px; text-align: left; font-weight: 600; color: white; cursor: pointer;" data-action="sort-column" data-column="employee_name" data-mode="manage">Employee ${manageSort.column === 'employee_name' ? (manageSort.asc ? '▲' : '▼') : '⇅'}</th>
                    <th style="padding: 10px; text-align: center; font-weight: 600; color: white; cursor: pointer;" data-action="sort-column" data-column="wage_days" data-mode="manage">Days ${manageSort.column === 'wage_days' ? (manageSort.asc ? '▲' : '▼') : '⇅'}</th>
                    <th style="padding: 10px; text-align: right; font-weight: 600; color: white; cursor: pointer;" data-action="sort-column" data-column="gross_salary" data-mode="manage">Gross ${manageSort.column === 'gross_salary' ? (manageSort.asc ? '▲' : '▼') : '⇅'}</th>
                    <th style="padding: 10px; text-align: right; font-weight: 600; color: white; cursor: pointer;" data-action="sort-column" data-column="epf_deduction" data-mode="manage">EPF ${manageSort.column === 'epf_deduction' ? (manageSort.asc ? '▲' : '▼') : '⇅'}</th>
                    <th style="padding: 10px; text-align: right; font-weight: 600; color: white; cursor: pointer;" data-action="sort-column" data-column="esic_deduction" data-mode="manage">ESIC ${manageSort.column === 'esic_deduction' ? (manageSort.asc ? '▲' : '▼') : '⇅'}</th>
                    <th style="padding: 10px; text-align: right; font-weight: 600; color: white; cursor: pointer;" data-action="sort-column" data-column="other_deduction" data-mode="manage">Other Ded ${manageSort.column === 'other_deduction' ? (manageSort.asc ? '▲' : '▼') : '⇅'}</th>
                    <th style="padding: 10px; text-align: right; font-weight: 600; color: white; cursor: pointer;" data-action="sort-column" data-column="other_benefit" data-mode="manage">Other Ben ${manageSort.column === 'other_benefit' ? (manageSort.asc ? '▲' : '▼') : '⇅'}</th>
                    <th style="padding: 10px; text-align: right; font-weight: 600; color: white; cursor: pointer;" data-action="sort-column" data-column="net_salary" data-mode="manage">Net ${manageSort.column === 'net_salary' ? (manageSort.asc ? '▲' : '▼') : '⇅'}</th>
                    <th style="padding: 10px; text-align: left; font-weight: 600; color: white;">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  ${sortArray(filteredWages, manageSort.column, manageSort.asc).map(wage => {
                    const edited = editedWages[wage.id] || wage;
                    const isEdited = !!editedWages[wage.id];
                    const isSelected = selectedWageIds.has(wage.id);
                    const netSalary = calculateNetSalary(
                      edited.gross_salary,
                      edited.epf_deduction,
                      edited.esic_deduction,
                      edited.other_deduction,
                      edited.other_benefit
                    );
                    
                    return `
                      <tr style="
                        border-bottom: 1px solid #e5e7eb;
                        background: ${isSelected ? '#eff6ff' : (isEdited ? '#fef3c7' : 'white')};
                      ">
                        <td style="padding: 10px; text-align: center;">
                          <input 
                            type="checkbox" 
                            ${isSelected ? 'checked' : ''}
                            data-action="toggle-wage"
                            data-wage-id="${wage.id}"
                            style="cursor: pointer; width: 16px; height: 16px;"
                          />
                        </td>
                        <td style="padding: 10px;">
                          <div style="font-weight: 600; color: #1f2937;">${wage.employee_name}</div>
                          <div style="font-size: 11px; color: #6b7280;">${wage.bank} - ${wage.account_no}</div>
                        </td>
                        <td style="padding: 10px; text-align: center;">
                          <input 
                            type="number" 
                            value="${edited.wage_days}"
                            data-action="edit-wage"
                            data-wage-id="${wage.id}"
                            data-field="wage_days"
                            style="width: 50px; padding: 4px; border: 1px solid #d1d5db; border-radius: 4px; text-align: center;"
                          />
                        </td>
                        <td style="padding: 10px; text-align: right;">
                          <span style="font-weight: 500;">${formatCurrency(edited.gross_salary)}</span>
                        </td>
                        <td style="padding: 10px; text-align: right;">
                          <input 
                            type="number" 
                            step="0.01"
                            value="${edited.epf_deduction || 0}"
                            data-action="edit-wage"
                            data-wage-id="${wage.id}"
                            data-field="epf_deduction"
                            style="width: 70px; padding: 4px; border: 1px solid #d1d5db; border-radius: 4px; text-align: right;"
                          />
                        </td>
                        <td style="padding: 10px; text-align: right;">
                          <input 
                            type="number" 
                            step="0.01"
                            value="${edited.esic_deduction || 0}"
                            data-action="edit-wage"
                            data-wage-id="${wage.id}"
                            data-field="esic_deduction"
                            style="width: 70px; padding: 4px; border: 1px solid #d1d5db; border-radius: 4px; text-align: right;"
                          />
                        </td>
                        <td style="padding: 10px; text-align: right;">
                          <input 
                            type="number" 
                            step="0.01"
                            value="${edited.other_deduction || 0}"
                            data-action="edit-wage"
                            data-wage-id="${wage.id}"
                            data-field="other_deduction"
                            style="width: 70px; padding: 4px; border: 1px solid #d1d5db; border-radius: 4px; text-align: right;"
                          />
                        </td>
                        <td style="padding: 10px; text-align: right;">
                          <input 
                            type="number" 
                            step="0.01"
                            value="${edited.other_benefit || 0}"
                            data-action="edit-wage"
                            data-wage-id="${wage.id}"
                            data-field="other_benefit"
                            style="width: 70px; padding: 4px; border: 1px solid #d1d5db; border-radius: 4px; text-align: right;"
                          />
                        </td>
                        <td style="padding: 10px; text-align: right;">
                          <span style="font-weight: 600; color: #059669;">${formatCurrency(netSalary)}</span>
                        </td>
                        <td style="padding: 10px;">
                          <div style="font-size: 11px;">
                            <div style="color: #6b7280;">${edited.paid_date ? formatDateDisplay(edited.paid_date) : 'Not paid'}</div>
                            <div style="color: #6b7280;">${edited.cheque_no || '-'}</div>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : `
          <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
            <h3 style="color: #6b7280; margin-bottom: 8px;">No Wage Records Found</h3>
            <p style="color: #9ca3af;">Select a month and click "Load Wages" to manage existing wage records</p>
          </div>
        `}
      </div>
    `;
  }

  function attachEventDelegation(container) {
    if (!container) return;
    
    // Delegate input changes for edit handlers
    container.addEventListener('input', (e) => {
      const action = e.target.dataset.action;
      if (action === 'edit-wage' || action === 'edit-employee') {
        const wageId = e.target.dataset.wageId;
        const empId = e.target.dataset.empId;
        const field = e.target.dataset.field;
        const value = e.target.value;
        
        if (wageId) window.wagesDashboard.handleManageEdit(parseInt(wageId), field, value);
        if (empId) window.wagesDashboard.handleCreateFieldChange(parseInt(empId), field, value);
      } else if (action === 'filter-search') {
        const field = e.target.dataset.field;
        const value = e.target.value;
        const mode = e.target.dataset.mode;
        
        if (mode === 'create') {
          window.wagesDashboard.setCreateFilterDebounced(field, value);
        } else if (mode === 'manage') {
          window.wagesDashboard.setManageFilterDebounced(field, value);
        }
      }
    });
    
    // Delegate checkbox changes
    container.addEventListener('change', (e) => {
      const action = e.target.dataset.action;
      if (action === 'toggle-wage') {
        const wageId = e.target.dataset.wageId;
        window.wagesDashboard.toggleWageSelection(parseInt(wageId), e.target.checked);
      } else if (action === 'toggle-employee') {
        const empId = e.target.dataset.empId;
        window.wagesDashboard.toggleEmployeeSelection(parseInt(empId), e.target.checked);
      } else if (action === 'select-all-wages') {
        window.wagesDashboard.toggleSelectAll(e.target.checked);
      } else if (action === 'select-all-employees') {
        window.wagesDashboard.toggleSelectAllCreate(e.target.checked);
      } else if (action === 'filter-select') {
        const field = e.target.dataset.field;
        const value = e.target.value;
        const mode = e.target.dataset.mode;
        
        if (mode === 'create') {
          window.wagesDashboard.setCreateFilter(field, value);
        } else if (mode === 'manage') {
          window.wagesDashboard.setManageFilter(field, value);
        }
      } else if (action === 'common-payment') {
        const field = e.target.dataset.field;
        const value = e.target.value;
        window.wagesDashboard.setCommonPayment(field, value);
      }
    });
    
    // Delegate click handlers
    container.addEventListener('click', (e) => {
      if (e.target.dataset.action === 'tab-switch') {
        window.wagesDashboard.switchTab(e.target.dataset.tab);
      } else if (e.target.dataset.action === 'load-employees') {
        window.wagesDashboard.loadEmployees();
      } else if (e.target.dataset.action === 'calculate-bulk') {
        window.wagesDashboard.calculateBulk();
      } else if (e.target.dataset.action === 'save-wages') {
        window.wagesDashboard.saveWages();
      } else if (e.target.dataset.action === 'export-excel') {
        window.wagesDashboard.exportToExcel();
      } else if (e.target.dataset.action === 'reset-filters') {
        const mode = e.target.dataset.mode;
        if (mode === 'create') {
          window.wagesDashboard.resetCreateFilters();
        } else {
          window.wagesDashboard.resetManageFilters();
        }
      } else if (e.target.dataset.action === 'sort') {
        const column = e.target.dataset.column;
        const mode = e.target.dataset.mode;
        if (mode === 'create') {
          window.wagesDashboard.toggleCreateSort(column);
        } else if (mode === 'manage') {
          window.wagesDashboard.toggleManageSort(column);
        }
      } else if (e.target.dataset.action === 'set-month') {
        window.wagesDashboard.setMonth(e.target.value);
      } else if (e.target.dataset.action === 'set-manage-month') {
        window.wagesDashboard.setManageMonth(e.target.value);
      } else if (e.target.dataset.action === 'toggle-bulk-edit') {
        window.wagesDashboard.toggleBulkEdit();
      } else if (e.target.dataset.action === 'apply-bulk-edit') {
        window.wagesDashboard.applyBulkEdit();
      } else if (e.target.dataset.action === 'set-bulk-edit') {
        window.wagesDashboard.setBulkEdit(e.target.dataset.field, e.target.value);
      } else if (e.target.dataset.action === 'save-edited') {
        window.wagesDashboard.saveEdited();
      } else if (e.target.dataset.action === 'delete-selected') {
        window.wagesDashboard.deleteSelected();
      }
    });
  }

  function attachEventDelegation(container) {
    if (!container) return;
    
    // Delegate input changes for edit handlers
    container.addEventListener('input', (e) => {
      const action = e.target.dataset.action;
      if (action === 'edit-wage' || action === 'edit-employee') {
        const wageId = e.target.dataset.wageId;
        const empId = e.target.dataset.empId;
        const field = e.target.dataset.field;
        const value = e.target.value;
        
        if (wageId) window.wagesDashboard.handleManageEdit(parseInt(wageId), field, value);
        if (empId) window.wagesDashboard.handleCreateFieldChange(parseInt(empId), field, value);
      } else if (action === 'search-filter') {
        const mode = e.target.dataset.mode;
        const field = e.target.dataset.field;
        if (mode === 'create') {
          window.wagesDashboard.setCreateFilterDebounced(field, e.target.value);
        } else if (mode === 'manage') {
          window.wagesDashboard.setManageFilterDebounced(field, e.target.value);
        }
      } else if (action === 'set-bulk-edit') {
        const field = e.target.dataset.field;
        window.wagesDashboard.setBulkEdit(field, e.target.value);
      }
    });
    
    // Delegate checkbox changes
    container.addEventListener('change', (e) => {
      const action = e.target.dataset.action;
      if (action === 'toggle-wage') {
        const wageId = e.target.dataset.wageId;
        window.wagesDashboard.toggleWageSelection(parseInt(wageId), e.target.checked);
      } else if (action === 'toggle-employee') {
        const empId = e.target.dataset.empId;
        window.wagesDashboard.toggleEmployeeSelection(parseInt(empId), e.target.checked);
      } else if (action === 'select-all-wages') {
        window.wagesDashboard.toggleSelectAll(e.target.checked);
      } else if (action === 'select-all-employees') {
        window.wagesDashboard.toggleSelectAllCreate(e.target.checked);
      } else if (action === 'set-month') {
        window.wagesDashboard.setMonth(e.target.value);
      } else if (action === 'set-manage-month') {
        window.wagesDashboard.setManageMonth(e.target.value);
      } else if (action === 'set-filter') {
        const mode = e.target.dataset.mode;
        const field = e.target.dataset.field;
        if (mode === 'create') {
          window.wagesDashboard.setCreateFilter(field, e.target.value);
        } else if (mode === 'manage') {
          window.wagesDashboard.setManageFilter(field, e.target.value);
        }
      } else if (action === 'set-payment') {
        const field = e.target.dataset.field;
        window.wagesDashboard.setCommonPayment(field, e.target.value);
      }
    });
    
    // Delegate click events
    container.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action === 'switch-tab') {
        const tab = e.target.dataset.tab;
        window.wagesDashboard.switchTab(tab);
      } else if (action === 'sort-column') {
        const column = e.target.dataset.column;
        const mode = e.target.dataset.mode;
        if (mode === 'create') {
          window.wagesDashboard.toggleCreateSort(column);
        } else if (mode === 'manage') {
          window.wagesDashboard.toggleManageSort(column);
        }
      } else if (action === 'load-employees') {
        window.wagesDashboard.loadEmployees();
      } else if (action === 'load-manage-wages') {
        window.wagesDashboard.loadManageWages();
      } else if (action === 'calculate-bulk') {
        window.wagesDashboard.calculateBulk();
      } else if (action === 'save-wages') {
        window.wagesDashboard.saveWages();
      } else if (action === 'export-excel') {
        window.wagesDashboard.exportToExcel();
      } else if (action === 'reset-filters') {
        const mode = e.target.dataset.mode;
        if (mode === 'create') {
          window.wagesDashboard.resetCreateFilters();
        } else if (mode === 'manage') {
          window.wagesDashboard.resetManageFilters();
        }
      } else if (action === 'toggle-bulk-edit') {
        window.wagesDashboard.toggleBulkEdit();
      } else if (action === 'delete-selected') {
        window.wagesDashboard.deleteSelected();
      } else if (action === 'save-edited') {
        window.wagesDashboard.saveEdited();
      } else if (action === 'apply-bulk-edit') {
        window.wagesDashboard.applyBulkEdit();
      }
    });
  }

  function render() {
    const container = document.getElementById('wages-dashboard');
    if (!container) return;

    // Capture currently focused element before re-render
    const activeElement = document.activeElement;
    const focusedWageId = activeElement?.dataset?.wageId;
    const focusedField = activeElement?.dataset?.field;
    const focusedEmpId = activeElement?.dataset?.empId;

    container.innerHTML = `
      <div style="padding: 20px; max-width: 1600px; margin: 0 auto;">
        <div style="margin-bottom: 20px;">
          <h2 style="color: #1f2937; font-size: 24px; font-weight: 700;">💰 Wages Management</h2>
          <p style="color: #6b7280; margin-top: 5px;">Create new wages or manage existing wage records</p>
        </div>

        ${renderTabs()}
        
        ${activeTab === 'create' ? renderCreateMode() : renderManageMode()}
      </div>
    `;
    
    // Attach event delegation for CSP compliance - ONLY ONCE
    if (!listenersAttached) {
      attachEventDelegation(container);
      listenersAttached = true;
    }

    // Restore focus to previously focused field
    if (focusedWageId && focusedField) {
      const focusedInput = container.querySelector(`input[data-wage-id="${focusedWageId}"][data-field="${focusedField}"]`);
      if (focusedInput) {
        focusedInput.focus();
        // Move cursor to end of input for smooth typing experience
        const length = focusedInput.value.length;
        focusedInput.setSelectionRange(length, length);
      }
    } else if (focusedEmpId && focusedField) {
      const focusedInput = container.querySelector(`input[data-emp-id="${focusedEmpId}"][data-field="${focusedField}"]`);
      if (focusedInput) {
        focusedInput.focus();
        // Move cursor to end of input for smooth typing experience
        const length = focusedInput.value.length;
        focusedInput.setSelectionRange(length, length);
      }
    }
  }

  /* --------------------------------------------------
     PUBLIC API (exposed to window for onclick handlers)
  -------------------------------------------------- */

  window.wagesDashboard = {
    // Tab switching
    switchTab: (tab) => {
      activeTab = tab;
      render();
    },

    // Create mode - Data loading
    setMonth: (month) => {
      selectedMonth = month;
      render();
    },
    loadEmployees: loadEmployeesForWages,
    
    // Create mode - Calculations (auto-calculate on field change)
    calculateBulk: calculateBulkForAllEmployees,
    handleCreateFieldChange: handleCreateFieldChange,
    
    // Create mode - Selection
    toggleEmployeeSelection: (empId, checked) => {
      if (checked) {
        selectedEmployeeIds.add(empId);
      } else {
        selectedEmployeeIds.delete(empId);
      }
      render();
    },
    toggleSelectAllCreate: (checked) => {
      const filteredEmployees = getFilteredCreateEmployees();
      if (checked) {
        filteredEmployees.forEach(emp => selectedEmployeeIds.add(emp.master_roll_id));
      } else {
        filteredEmployees.forEach(emp => selectedEmployeeIds.delete(emp.master_roll_id));
      }
      render();
    },
    
    // Create mode - Filters
    setCreateFilter: (field, value) => {
      createFilters[field] = value;
      render();
    },
    
    setCreateFilterDebounced: (field, value) => {
      createFilters[field] = value;
      clearTimeout(createSearchDebounceTimer);
      createSearchDebounceTimer = setTimeout(() => {
        render();
      }, 300);
    },
    
    resetCreateFilters: () => {
      createFilters = {
        searchTerm: '',
        bankFilter: 'all',
        projectFilter: 'all',
        siteFilter: 'all'
      };
      selectedEmployeeIds.clear();
      render();
    },
    
    // Create mode - Sorting
    toggleCreateSort: (column) => {
      if (createSort.column === column) {
        createSort.asc = !createSort.asc;
      } else {
        createSort.column = column;
        createSort.asc = true;
      }
      render();
    },
    
    // Create mode - Save & Payment
    saveWages: saveWages,
    setCommonPayment: (field, value) => {
      commonPaymentData[field] = value;
      render();
    },

    // Manage mode - Data loading
    setManageMonth: (month) => {
      manageMonth = month;
      render();
    },
    loadManageWages: loadExistingWages,
    
    // Manage mode - Editing
    handleManageEdit: handleManageFieldChange,
    saveEdited: saveEditedWages,
    deleteSelected: deleteSelectedWages,
    
    // Manage mode - Filters
    setManageFilter: (field, value) => {
      manageFilters[field] = value;
      render();
    },
    
    setManageFilterDebounced: (field, value) => {
      manageFilters[field] = value;
      clearTimeout(manageSearchDebounceTimer);
      manageSearchDebounceTimer = setTimeout(() => {
        render();
      }, 300);
    },
    
    resetManageFilters: () => {
      manageFilters = {
        searchTerm: '',
        bankFilter: 'all',
        projectFilter: 'all',
        siteFilter: 'all'
      };
      selectedWageIds.clear();
      render();
    },
    
    // Manage mode - Sorting
    toggleManageSort: (column) => {
      if (manageSort.column === column) {
        manageSort.asc = !manageSort.asc;
      } else {
        manageSort.column = column;
        manageSort.asc = true;
      }
      render();
    },
    
    // Manage mode - Bulk edit
    toggleBulkEdit: () => {
      isBulkEditMode = !isBulkEditMode;
      if (!isBulkEditMode) {
        bulkEditData = {
          wage_days: '',
          epf_deduction: '',
          esic_deduction: '',
          other_deduction: '',
          other_benefit: '',
          paid_date: '',
          cheque_no: '',
          paid_from_bank_ac: ''
        };
      }
      render();
    },
    setBulkEdit: (field, value) => {
      bulkEditData[field] = value;
    },
    applyBulkEdit: applyBulkEdit,
    
    // Manage mode - Selection
    toggleWageSelection: (wageId, checked) => {
      if (checked) {
        selectedWageIds.add(wageId);
      } else {
        selectedWageIds.delete(wageId);
      }
      render();
    },
    toggleSelectAll: (checked) => {
      const filteredWages = getFilteredManageWages();
      if (checked) {
        filteredWages.forEach(wage => selectedWageIds.add(wage.id));
      } else {
        filteredWages.forEach(wage => selectedWageIds.delete(wage.id));
      }
      render();
    },

    // Export
    exportToExcel: exportToExcel
  };

  // Initial render
  render();
}