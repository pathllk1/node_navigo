export function WagesDashboard() {
  let selectedMonth = '';
  let employees = [];
  let wageData = {};
  let isLoading = false;

  // Format date for display (YYYY-MM-DD)
  function formatDateDisplay(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
  }

  // Convert mmm-yyyy to YYYY-MM
  function convertMonthFormat(monthStr) {
    // Example: "Jan-2026" -> "2026-01"
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const [month, year] = monthStr.toLowerCase().split('-');
    const monthNum = months.indexOf(month) + 1;
    return `${year}-${String(monthNum).padStart(2, '0')}`;
  }

  // Format YYYY-MM to display (Jan 2026)
  function formatMonthDisplay(yearMonth) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [year, month] = yearMonth.split('-');
    return `${months[parseInt(month) - 1]} ${year}`;
  }

  // Fetch employees for selected month
  async function fetchEmployees() {
    if (!selectedMonth) {
      window.Toastify({ text: 'Please select a month', backgroundColor: '#d32f2f', duration: 3000 }).showToast();
      return;
    }

    isLoading = true;
    renderUI();
    attachEventListeners();

    try {
      const response = await fetch('/api/wages/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch employees');
      }

      employees = result.data || [];
      wageData = {};
      employees.forEach(emp => {
        wageData[emp.master_roll_id] = {
          wage_days: emp.last_wage_days || 26,
          gross_salary: 0,
          epf_deduction: 0,
          esic_deduction: 0,
          other_deduction: 0,
          other_benefit: 0
        };
        // Auto-calculate all wages for this employee
        calculateAllWagesForEmployee(emp.master_roll_id);
      });

      window.Toastify({ text: `Loaded ${employees.length} employees with auto-calculations`, backgroundColor: '#4caf50', duration: 2000 }).showToast();
    } catch (error) {
      window.Toastify({ text: `Error: ${error.message}`, backgroundColor: '#d32f2f', duration: 3000 }).showToast();
      console.error('Error fetching employees:', error);
    } finally {
      isLoading = false;
      renderUI();
      attachEventListeners();
    }
  }



  // Calculate net salary
  function calculateNetSalary(employeeId) {
    const wage = wageData[employeeId];
    if (!wage || !wage.gross_salary) return 0;

    const totalDeductions = (wage.epf_deduction || 0) + (wage.esic_deduction || 0) + (wage.other_deduction || 0);
    const totalBenefits = wage.other_benefit || 0;
    return parseFloat((wage.gross_salary - totalDeductions + totalBenefits).toFixed(2));
  }

  // Calculate all wages automatically for an employee
  function calculateAllWagesForEmployee(empId) {
    const emp = employees.find(e => e.master_roll_id === empId);
    const wage = wageData[empId];
    if (!emp || !wage) return;

    const dailyRate = emp.p_day_wage || 0;
    const wageDays = wage.wage_days || 26;

    // Calculate gross salary = Daily Rate * days
    wage.gross_salary = parseFloat((dailyRate * wageDays).toFixed(2));

    // Calculate EPF: round(gross_salary * 12%), max 1800
    wage.epf_deduction = Math.min(Math.round(wage.gross_salary * 0.12), 1800);

    // Calculate ESIC: round up(gross_salary * 0.75%)
    wage.esic_deduction = Math.ceil(wage.gross_salary * 0.0075);

    // Net salary will be calculated on demand via calculateNetSalary()
    // Update UI if visible
    updateWageRowDisplay(empId);
  }

  // Update wage row display in the table
  function updateWageRowDisplay(empId) {
    const wage = wageData[empId];
    if (!wage) return;

    // Update gross salary input
    const grossInput = document.querySelector(`input[data-emp-id="${empId}"][data-field="gross_salary"]`);
    if (grossInput) {
      grossInput.value = wage.gross_salary.toFixed(2);
    }

    // Update EPF input
    const epfInput = document.querySelector(`input[data-emp-id="${empId}"][data-field="epf_deduction"]`);
    if (epfInput) {
      epfInput.value = wage.epf_deduction.toFixed(2);
    }

    // Update ESIC input
    const esicInput = document.querySelector(`input[data-emp-id="${empId}"][data-field="esic_deduction"]`);
    if (esicInput) {
      esicInput.value = wage.esic_deduction.toFixed(2);
    }

    // Update net salary input
    const netSalaryInput = document.querySelector(`input[data-emp-id="${empId}"][data-field="net_salary"]`);
    if (netSalaryInput) {
      const netSalary = calculateNetSalary(empId);
      netSalaryInput.value = netSalary.toFixed(2);
    }

    // Update total gross salary
    updateTotalGrossSalary();
  }

  // Update total gross salary in summary
  function updateTotalGrossSalary() {
    const summaryDiv = document.querySelector('.bg-gray-50.px-6.py-4');
    if (summaryDiv) {
      const totalGross = employees.reduce((sum, emp) => sum + (wageData[emp.master_roll_id]?.gross_salary || 0), 0);
      const spans = summaryDiv.querySelectorAll('span');
      if (spans.length >= 2) {
        spans[1].textContent = `₹${totalGross.toFixed(2)}`;
      }
    }
  }

  // Save all wages
  async function saveWages() {
    if (!selectedMonth) return;

    if (employees.length === 0) {
      window.Toastify({ text: 'No employees to save', backgroundColor: '#d32f2f', duration: 2000 }).showToast();
      return;
    }

    // Validate required fields
    const invalidEmployees = [];
    employees.forEach(emp => {
      const wage = wageData[emp.master_roll_id];
      if (!wage || !wage.gross_salary || wage.gross_salary <= 0) {
        invalidEmployees.push(emp.employee_name);
      }
    });

    if (invalidEmployees.length > 0) {
      window.Toastify({ 
        text: `Enter gross salary for: ${invalidEmployees.join(', ')}`, 
        backgroundColor: '#d32f2f', 
        duration: 3000 
      }).showToast();
      return;
    }

    isLoading = true;
    renderUI();

    try {
      const wagesPayload = employees.map(emp => ({
        master_roll_id: emp.master_roll_id,
        wage_days: wageData[emp.master_roll_id].wage_days,
        gross_salary: parseFloat(wageData[emp.master_roll_id].gross_salary),
        p_day_wage: parseFloat(calculatePerDayWage(
          wageData[emp.master_roll_id].gross_salary,
          wageData[emp.master_roll_id].wage_days
        )),
        epf_deduction: wageData[emp.master_roll_id].epf_deduction || 0,
        esic_deduction: wageData[emp.master_roll_id].esic_deduction || 0,
        other_deduction: wageData[emp.master_roll_id].other_deduction || 0,
        other_benefit: wageData[emp.master_roll_id].other_benefit || 0,
        net_salary: calculateNetSalary(emp.master_roll_id)
      }));

      const response = await fetch('/api/wages/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, wages: wagesPayload })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to save wages');
      }

      window.Toastify({ text: result.message, backgroundColor: '#4caf50', duration: 3000 }).showToast();
      // Reset after successful save
      employees = [];
      wageData = {};
    } catch (error) {
      window.Toastify({ text: `Error: ${error.message}`, backgroundColor: '#d32f2f', duration: 3000 }).showToast();
      console.error('Error saving wages:', error);
    } finally {
      isLoading = false;
      renderUI();
      attachEventListeners();
    }
  }

  // Reset form
  function resetForm() {
    employees.forEach(emp => {
      wageData[emp.master_roll_id] = {
        wage_days: emp.last_wage_days || 26,
        gross_salary: '',
        epf_deduction: 0,
        esic_deduction: 0,
        other_deduction: 0,
        other_benefit: 0
      };
    });
    renderUI();
    attachEventListeners();
  }

  // Clear all
  function clearAll() {
    selectedMonth = '';
    employees = [];
    wageData = {};
    renderUI();
    attachEventListeners();
  }

  // Render UI
  function renderUI() {
    const container = document.getElementById('wages-dashboard');
    if (!container) return;

    container.innerHTML = `
      <div class="w-full max-w-12xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-gray-800 mb-2">Wages Management</h1>
          <p class="text-gray-600">Create and manage employee wages</p>
        </div>

        <!-- Month Selection -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
              <input 
                type="month" 
                id="month-input"
                value="${selectedMonth}" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div class="flex gap-2">
              <button 
                id="load-employees-btn"
                ${isLoading ? 'disabled' : ''}
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                ${isLoading ? 'Loading...' : 'Load Employees'}
              </button>
              <button 
                id="clear-all-btn"
                class="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        ${employees.length > 0 ? `
          <!-- Employees Table -->
          <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-100 border-b">
                  <tr>
                    <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Employee Name</th>
                    <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Aadhar</th>
                    <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Joining Date</th>
                    <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">Daily Rate</th>
                    <th class="px-6 py-3 text-center text-sm font-semibold text-gray-700">Days</th>
                    <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">Gross Salary</th>
                    <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">EPF</th>
                    <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">ESIC</th>
                    <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">Other Ded</th>
                    <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">Benefit</th>
                    <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">Net Salary</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  ${employees.map(emp => {
                    const wage = wageData[emp.master_roll_id];
                    const netSalary = calculateNetSalary(emp.master_roll_id);
                    
                    return `
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 text-sm font-medium text-gray-900">${emp.employee_name}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${emp.aadhar}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${formatDateDisplay(emp.date_of_joining)}</td>
                        <td class="px-6 py-4 text-sm text-right text-gray-900 font-mono">₹${emp.p_day_wage?.toFixed(2) || '0.00'}</td>
                        <td class="px-6 py-4 text-center">
                          <input 
                            type="number" 
                            value="${wage.wage_days}" 
                            data-emp-id="${emp.master_roll_id}"
                            data-field="wage_days"
                            min="1"
                            max="31"
                            class="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td class="px-6 py-4">
                          <input 
                            type="number" 
                            value="${wage.gross_salary || 0}" 
                            data-emp-id="${emp.master_roll_id}"
                            data-field="gross_salary"
                            step="0.01"
                            placeholder="0.00"
                            class="w-full px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td class="px-6 py-4">
                          <input 
                            type="number" 
                            value="${wage.epf_deduction || 0}" 
                            data-emp-id="${emp.master_roll_id}"
                            data-field="epf_deduction"
                            step="0.01"
                            placeholder="0.00"
                            class="w-full px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td class="px-6 py-4">
                          <input 
                            type="number" 
                            value="${wage.esic_deduction || 0}" 
                            data-emp-id="${emp.master_roll_id}"
                            data-field="esic_deduction"
                            step="0.01"
                            placeholder="0.00"
                            class="w-full px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td class="px-6 py-4">
                          <input 
                            type="number" 
                            value="${wage.other_deduction || 0}" 
                            data-emp-id="${emp.master_roll_id}"
                            data-field="other_deduction"
                            step="0.01"
                            placeholder="0.00"
                            class="w-full px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td class="px-6 py-4">
                          <input 
                            type="number" 
                            value="${wage.other_benefit || 0}" 
                            data-emp-id="${emp.master_roll_id}"
                            data-field="other_benefit"
                            step="0.01"
                            placeholder="0.00"
                            class="w-full px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td class="px-6 py-4">
                          <input 
                            type="number" 
                            value="${netSalary || 0}" 
                            data-emp-id="${emp.master_roll_id}"
                            data-field="net_salary"
                            step="0.01"
                            placeholder="0.00"
                            class="w-full px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500 font-bold"
                          />
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Summary -->
            <div class="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
              <div class="text-lg font-semibold text-gray-800">
                Total Employees: <span class="text-blue-600">${employees.length}</span>
              </div>
              <div class="text-lg font-semibold text-gray-800">
                Total Gross Salary: <span class="text-blue-600">₹${employees.reduce((sum, emp) => sum + (wageData[emp.master_roll_id].gross_salary || 0), 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4 justify-end">
            <button 
              id="btn-reset"
              class="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
            >
              Reset
            </button>
            <button 
              id="btn-save"
              ${isLoading ? 'disabled' : ''}
              class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-semibold"
            >
              ${isLoading ? 'Saving...' : 'Save All Wages'}
            </button>
          </div>
        ` : selectedMonth && !isLoading ? `
          <!-- Empty State -->
          <div class="bg-white rounded-lg shadow-md p-12 text-center">
            <div class="text-6xl mb-4">📋</div>
            <h3 class="text-2xl font-semibold text-gray-800 mb-2">No Employees Found</h3>
            <p class="text-gray-600">No active employees found for ${formatMonthDisplay(selectedMonth)}</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Make functions globally available
  window.wagesApp = {
    fetchEmployees,
    saveWages,
    resetForm,
    clearAll,
    handleMonthChange
  };

  // Attach event listeners (CSP-compliant)
  function attachEventListeners() {
    const container = document.getElementById('wages-dashboard');
    if (!container) return;

    // Month input
    const monthInput = container.querySelector('#month-input');
    if (monthInput) {
      monthInput.removeEventListener('change', handleMonthChange);
      monthInput.addEventListener('change', handleMonthChange);
    }

    // Load employees button
    const loadBtn = container.querySelector('#load-employees-btn');
    if (loadBtn) {
      loadBtn.removeEventListener('click', fetchEmployees);
      loadBtn.addEventListener('click', fetchEmployees);
    }

    // Clear button
    const clearBtn = container.querySelector('#clear-all-btn');
    if (clearBtn) {
      clearBtn.removeEventListener('click', clearAll);
      clearBtn.addEventListener('click', clearAll);
    }

    // Reset button
    const resetBtn = container.querySelector('#btn-reset');
    if (resetBtn) {
      resetBtn.removeEventListener('click', resetForm);
      resetBtn.addEventListener('click', resetForm);
    }

    // Save button
    const saveBtn = container.querySelector('#btn-save');
    if (saveBtn) {
      saveBtn.removeEventListener('click', saveWages);
      saveBtn.addEventListener('click', saveWages);
    }

    // Input fields for wage calculations (all editable fields)
    container.querySelectorAll('input[data-field="wage_days"], input[data-field="gross_salary"], input[data-field="epf_deduction"], input[data-field="esic_deduction"], input[data-field="other_deduction"], input[data-field="other_benefit"], input[data-field="net_salary"]').forEach(input => {
      input.removeEventListener('input', handleInputChange);
      input.addEventListener('input', handleInputChange);
    });
  }

  function handleMonthChange(e) {
    selectedMonth = e.target.value;
    renderUI();
    attachEventListeners();
  }

  function handleInputChange(e) {
    const input = e.target;
    const empId = parseInt(input.dataset.empId);
    const fieldName = input.dataset.field;

    if (!empId || !fieldName || !wageData[empId]) return;

    const value = parseFloat(input.value) || 0;

    // Update wageData with user input
    if (fieldName === 'wage_days') {
      wageData[empId].wage_days = Math.max(parseInt(input.value) || 1, 1);
      // When days change, recalculate all dependent fields
      calculateAllWagesForEmployee(empId);
    } else {
      // For all other fields (gross_salary, epf_deduction, esic_deduction, other_deduction, other_benefit, net_salary)
      wageData[empId][fieldName] = value;
      // Recalculate net salary display when any deduction/earning field changes
      if (fieldName === 'gross_salary' || fieldName === 'epf_deduction' || fieldName === 'esic_deduction' || fieldName === 'other_deduction' || fieldName === 'other_benefit' || fieldName === 'net_salary') {
        updateWageRowDisplay(empId);
      }
    }
  }



  // Make functions globally available
  window.wagesApp = {
    fetchEmployees,
    saveWages,
    resetForm,
    clearAll
  };

  // Set today's date as default month
  const today = new Date();
  selectedMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  // Initial render
  renderUI();
  attachEventListeners();

  return {
    name: 'Wages Management',
    component: 'wages-dashboard'
  };
}
