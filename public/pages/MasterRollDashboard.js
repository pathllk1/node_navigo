import * as XLSX from "/cdns/xlsx.mjs";

export function MasterRollDashboard() {
  let masterRolls = [];
  let filteredRolls = [];
  let editingId = null;
  let currentPage = 1;
  let rowsPerPage = 10;
  let currentSort = { column: null, asc: true };
  let selectedRows = new Set();
  let columnVisibility = {
    employee_name: true,
    status: true,
    father_husband_name: false,
    aadhar: true,
    pan: false,
    phone_no: true,
    address: false,
    bank: true,
    account_no: false,
    ifsc: false,
    uan: false,
    esic_no: false,
    s_kalyan_no: false,
    category: false,
    p_day_wage: false,
    project: false,
    site: false,
    date_of_birth: false,
    date_of_joining: true,
    date_of_exit: false,
    doe_rem: false
  };
  let advancedFilters = {
    dateRange: { from: '', to: '' },
    wage: { min: '', max: '' },
    category: '',
    project: '',
    site: '',
    status: ''
  };

  const allColumns = [
    { key: 'employee_name', label: 'Employee Name', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'father_husband_name', label: 'Father/Husband', sortable: true },
    { key: 'aadhar', label: 'Aadhar', sortable: false },
    { key: 'pan', label: 'PAN', sortable: false },
    { key: 'phone_no', label: 'Phone', sortable: true },
    { key: 'address', label: 'Address', sortable: false },
    { key: 'bank', label: 'Bank', sortable: true },
    { key: 'account_no', label: 'Account No', sortable: false },
    { key: 'ifsc', label: 'IFSC', sortable: true },
    { key: 'uan', label: 'UAN', sortable: false },
    { key: 'esic_no', label: 'ESIC No', sortable: false },
    { key: 's_kalyan_no', label: 'S Kalyan No', sortable: false },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'p_day_wage', label: 'Daily Wage', sortable: true },
    { key: 'project', label: 'Project', sortable: true },
    { key: 'site', label: 'Site', sortable: true },
    { key: 'date_of_birth', label: 'DOB', sortable: true },
    { key: 'date_of_joining', label: 'Joining Date', sortable: true },
    { key: 'date_of_exit', label: 'Exit Date', sortable: true },
    { key: 'doe_rem', label: 'Remarks', sortable: false }
  ];

  const excelHeaderMap = {
    "Employee Name": "employee_name",
    "Status": "status",
    "Father/Husband": "father_husband_name",
    "Father Name": "father_husband_name", // handle variations
    "Aadhar": "aadhar",
    "PAN": "pan",
    "Phone": "phone_no",
    "Mobile": "phone_no",
    "Address": "address",
    "Bank": "bank",
    "Account No": "account_no",
    "IFSC": "ifsc",
    "BRANCH": "branch",
    "UAN": "uan",
    "ESIC": "esic_no",
    "ESIC No": "esic_no",
    "S Kalyan": "s_kalyan_no",
    "Category": "category",
    "Wage": "p_day_wage",
    "Daily Wage": "p_day_wage",
    "Per Day Wage": "p_day_wage",
    "Project": "project",
    "Site": "site",
    "DOB": "date_of_birth",
    "Date of Birth": "date_of_birth",
    "DOJ": "date_of_joining", "Date of Joining": "date_of_joining", "Joining Date": "date_of_joining", "Join Date": "date_of_joining",
    "DOE": "date_of_exit",
    "Date of Exit": "date_of_exit", "Date_of_Exit": "Date of Exit",
    "Remarks": "doe_rem"
  };


  /* -----------------------------
    UTILITY: Get Auth Headers
 ----------------------------- */
  function getAuthHeaders() {
    const token = localStorage.getItem("accessToken");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  }

  /* -----------------------------
    HTML
 ----------------------------- */
  const html = `
<style>
  @keyframes slideIn {
    from { transform: translateY(-10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-slide-in { animation: slideIn 0.3s ease-out; }
  .animate-fade-in { animation: fadeIn 0.3s ease-out; }
  .table-row-selected { background-color: #e0e7ff !important; }
  
  /* Custom Scrollbar for dropdowns */
  .dropdown-menu {
    display: none;
    position: absolute;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 50;
    max-height: 400px;
    overflow-y: auto;
  }
  .dropdown-menu.active { display: block; }
  
  /* Datalist input styling */
  input[list] {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    padding-right: 2.5rem;
  }
</style>

<div class="p-4 lg:p-6 space-y-4 bg-gradient-to-br from-slate-50 to-indigo-50 min-h-screen">
  <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
    <div>
      <h1 class="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        Master Roll Dashboard
      </h1>
      <p class="text-sm text-gray-600 mt-1">Manage your employee records efficiently</p>
    </div>
    
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative">
        <input type="text" id="search-input" placeholder="Search employees..." 
               class="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition w-64 bg-white shadow-sm" />
        <svg class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>

      <button id="filters-btn" class="relative bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl shadow-sm transition duration-200 flex items-center gap-2 text-sm font-medium border border-gray-300">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
        </svg>
        Filters
        <span id="filter-badge" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</span>
      </button>

      <button id="columns-btn" class="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl shadow-sm transition duration-200 flex items-center gap-2 text-sm font-medium border border-gray-300">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
        </svg>
        Columns
      </button>

      <div class="relative">
        <button id="bulk-actions-btn" disabled class="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl shadow-sm transition duration-200 flex items-center gap-2 text-sm font-medium border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
          </svg>
          Actions
          <span id="selected-count" class="hidden bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5">0</span>
        </button>
        <div id="bulk-actions-menu" class="dropdown-menu mt-2 right-0 min-w-[180px]">
          <button class="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center gap-2" data-action="export-selected">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Export Selected
          </button>
          <button class="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm flex items-center gap-2" data-action="delete-selected">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Delete Selected
          </button>
        </div>
      </div>

      <button id="import-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl shadow-sm transition duration-200 flex items-center gap-2 text-sm font-medium">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
      Import Excel
    </button>
    <input type="file" id="import-file-input" accept=".xlsx, .xls, .csv" class="hidden" />

      <button id="export-btn" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-sm transition duration-200 flex items-center gap-2 text-sm font-medium">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        Export All
      </button>

      <button id="open-modal-btn" class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl shadow-lg transition duration-200 flex items-center gap-2 text-sm font-semibold">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Add Employee
      </button>
    </div>
  </div>

  <div id="filters-panel" class="hidden bg-white shadow-lg rounded-xl p-4 border border-gray-200 animate-slide-in">
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-semibold text-gray-900 flex items-center gap-2">
        <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
        </svg>
        Advanced Filters
      </h3>
      <button id="clear-filters-btn" class="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Clear All</button>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <label class="block text-xs font-semibold text-gray-700 mb-1.5">Joining Date From</label>
        <input type="date" id="filter-date-from" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
      </div>
      <div>
        <label class="block text-xs font-semibold text-gray-700 mb-1.5">Joining Date To</label>
        <input type="date" id="filter-date-to" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-700 mb-1.5">Min Daily Wage</label>
        <input type="number" id="filter-wage-min" placeholder="₹ 0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
      </div>
      <div>
        <label class="block text-xs font-semibold text-gray-700 mb-1.5">Max Daily Wage</label>
        <input type="number" id="filter-wage-max" placeholder="₹ 9999" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
        <select id="filter-status" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="On Leave">On Leave</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
        <select id="filter-category" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
          <option value="">All Categories</option>
        </select>
      </div>
      <div>
        <label class="block text-xs font-semibold text-gray-700 mb-1.5">Project</label>
        <select id="filter-project" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
          <option value="">All Projects</option>
        </select>
      </div>
      <div>
        <label class="block text-xs font-semibold text-gray-700 mb-1.5">Site</label>
        <select id="filter-site" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
          <option value="">All Sites</option>
        </select>
      </div>
      
      <div class="flex items-end">
        <button id="apply-filters-btn" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition text-sm font-semibold">
          Apply Filters
        </button>
      </div>
    </div>
  </div>

  <div id="columns-panel" class="hidden bg-white shadow-lg rounded-xl p-4 border border-gray-200 animate-slide-in">
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-semibold text-gray-900">Toggle Columns</h3>
      <div class="flex gap-2">
        <button id="show-all-columns" class="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Show All</button>
        <button id="hide-all-columns" class="text-sm text-gray-600 hover:text-gray-800 font-medium">Hide All</button>
      </div>
    </div>
    <div id="columns-list" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"></div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600">Total Employees</p>
          <p id="stat-total" class="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div class="bg-indigo-100 p-3 rounded-lg">
          <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600">Active Employees</p>
          <p id="stat-active" class="text-2xl font-bold text-emerald-600">0</p>
        </div>
        <div class="bg-emerald-100 p-3 rounded-lg">
          <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600">Avg Daily Wage</p>
          <p id="stat-avg-wage" class="text-2xl font-bold text-purple-600">₹0</p>
        </div>
        <div class="bg-purple-100 p-3 rounded-lg">
          <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600">Showing</p>
          <p id="stat-filtered" class="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div class="bg-gray-100 p-3 rounded-lg">
          <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        </div>
      </div>
    </div>
  </div>

  <div class="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm divide-y divide-gray-200" id="masterroll-table">
        <thead class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <tr id="table-header">
            <th class="px-4 py-3 text-center w-12">
              <input type="checkbox" id="select-all" class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
            </th>
          </tr>
        </thead>
        <tbody id="table-body" class="bg-white divide-y divide-gray-100"></tbody>
      </table>
    </div>
    
    <div class="px-4 py-3 bg-gray-50 border-t border-gray-200" id="pagination"></div>
  </div>
</div>

<div id="modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
  <div class="flex items-center justify-center min-h-screen p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in">
      <div class="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
        <h2 id="modal-title" class="text-xl font-bold">Add New Employee</h2>
        <button id="close-modal-btn" class="text-white hover:text-gray-200 transition text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20">
          &times;
        </button>
      </div>

      <form id="create-form" class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div class="flex flex-col">
             <label class="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                <span class="text-sm">🚦</span> Status <span class="text-red-500">*</span>
             </label>
             <select name="status" required
                class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
                <option value="Suspended">Suspended</option>
             </select>
          </div>

          ${[
      { label: "Employee Name", name: "employee_name", type: "text", required: true, icon: "👤" },
      { label: "Father/Husband Name", name: "father_husband_name", type: "text", required: true, icon: "👨" },
      { label: "Aadhar", name: "aadhar", type: "text", required: true, icon: "🆔", maxlength: 12 },
      { label: "PAN", name: "pan", type: "text", icon: "💳", maxlength: 10 },
      { label: "Phone", name: "phone_no", type: "tel", required: true, icon: "📱", maxlength: 10 },
      { label: "Address", name: "address", type: "text", icon: "🏠", colSpan: 2 },
      { label: "Bank", name: "bank", type: "text", icon: "🏦" },
      { label: "Account No", name: "account_no", type: "text", icon: "💰" },
      { label: "IFSC", name: "ifsc", type: "text", icon: "🔢", maxlength: 11 },
      { label: "BRANCH", name: "branch", type: "text", icon: "🏠", maxlength: 11 },
      { label: "UAN", name: "uan", type: "text", icon: "🔐" },
      { label: "ESIC No", name: "esic_no", type: "text", icon: "🏥" },
      { label: "S Kalyan No", name: "s_kalyan_no", type: "text", icon: "📋" },
      { label: "Category", name: "category", type: "text", icon: "📂", datalist: true },
      { label: "Per Day Wage", name: "p_day_wage", type: "number", step: "0.01", icon: "💵" },
      { label: "Project", name: "project", type: "text", icon: "🏗️", datalist: true },
      { label: "Site", name: "site", type: "text", icon: "📍", datalist: true },
      { label: "Date of Birth", name: "date_of_birth", type: "date", required: true, icon: "🎂" },
      { label: "Date of Joining", name: "date_of_joining", type: "date", required: true, icon: "📅" },
      { label: "Date of Exit", name: "date_of_exit", type: "date", icon: "🚪" },
    ].map(f => `
            <div class="flex flex-col ${f.colSpan ? `md:col-span-${f.colSpan} lg:col-span-${f.colSpan}` : ""}">
              <label class="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                <span class="text-sm">${f.icon || ""}</span> ${f.label}${f.required ? ' <span class="text-red-500">*</span>' : ''}
              </label>
              <input class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                     name="${f.name}"
                     type="${f.type || "text"}"
                     step="${f.step || ""}"
                     maxlength="${f.maxlength || ""}"
                     ${f.datalist ? `list="${f.name}-list"` : ''}
                     ${f.required ? "required" : ""}
                     placeholder="Enter ${f.label.toLowerCase()}" />
              ${f.datalist ? `<datalist id="${f.name}-list"></datalist>` : ''}
            </div>
          `).join('')}
          
          <div class="flex flex-col md:col-span-2 lg:col-span-3">
            <label class="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
              <span class="text-sm">📝</span> Remarks
            </label>
            <textarea name="doe_rem" rows="3" 
                      class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                      placeholder="Enter any additional remarks"></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button type="button" id="cancel-btn" 
                  class="px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition duration-200 text-sm font-semibold">
            Cancel
          </button>
          <button type="submit" 
                  class="px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition duration-200 text-sm font-semibold shadow-sm">
            Save Employee
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
`;

  /* -----------------------------
     SCRIPTS
  ----------------------------- */
  function scripts() {
    const tableBody = document.getElementById("table-body");
    const tableHeader = document.getElementById("table-header");
    const modal = document.getElementById("modal");
    const openModalBtn = document.getElementById("open-modal-btn");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const cancelBtn = document.getElementById("cancel-btn");
    const form = document.getElementById("create-form");
    const modalTitle = document.getElementById("modal-title");
    const searchInput = document.getElementById("search-input");
    const exportBtn = document.getElementById("export-btn");
    const paginationContainer = document.getElementById("pagination");
    const selectAllCheckbox = document.getElementById("select-all");
    const bulkActionsBtn = document.getElementById("bulk-actions-btn");
    const bulkActionsMenu = document.getElementById("bulk-actions-menu");
    const selectedCountSpan = document.getElementById("selected-count");
    const filtersBtn = document.getElementById("filters-btn");
    const filtersPanel = document.getElementById("filters-panel");
    const columnsBtn = document.getElementById("columns-btn");
    const columnsPanel = document.getElementById("columns-panel");
    const columnsList = document.getElementById("columns-list");

    function maskAadhar(aadhar) {
      if (!aadhar) return "";
      return "XXXX-XXXX-" + aadhar.slice(-4);
    }

    function showToast(message, type = "success") {
      Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: type === "success" ? "#10b981" : "#ef4444",
        close: true,
      }).showToast();
    }

    function updateStats() {
      document.getElementById("stat-total").textContent = masterRolls.length;
      const active = masterRolls.filter(r => !r.date_of_exit).length;
      document.getElementById("stat-active").textContent = active;

      const wages = masterRolls.filter(r => r.p_day_wage).map(r => parseFloat(r.p_day_wage));
      const avgWage = wages.length ? (wages.reduce((a, b) => a + b, 0) / wages.length).toFixed(2) : 0;
      document.getElementById("stat-avg-wage").textContent = `₹${avgWage}`;

      document.getElementById("stat-filtered").textContent = filteredRolls.length;
    }

    function updateFilterBadge() {
      let activeFilters = 0;
      if (advancedFilters.dateRange.from || advancedFilters.dateRange.to) activeFilters++;
      if (advancedFilters.wage.min || advancedFilters.wage.max) activeFilters++;
      if (advancedFilters.category) activeFilters++;
      if (advancedFilters.project) activeFilters++;
      if (advancedFilters.site) activeFilters++;

      const badge = document.getElementById("filter-badge");
      if (activeFilters > 0) {
        badge.textContent = activeFilters;
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    }

    function populateFilterDropdowns() {
      const categories = [...new Set(masterRolls.map(r => r.category).filter(Boolean))];
      const projects = [...new Set(masterRolls.map(r => r.project).filter(Boolean))];
      const sites = [...new Set(masterRolls.map(r => r.site).filter(Boolean))];

      const categorySelect = document.getElementById("filter-category");
      categorySelect.innerHTML = '<option value="">All Categories</option>' +
        categories.map(c => `<option value="${c}">${c}</option>`).join('');

      const projectSelect = document.getElementById("filter-project");
      projectSelect.innerHTML = '<option value="">All Projects</option>' +
        projects.map(p => `<option value="${p}">${p}</option>`).join('');

      const siteSelect = document.getElementById("filter-site");
      siteSelect.innerHTML = '<option value="">All Sites</option>' +
        sites.map(s => `<option value="${s}">${s}</option>`).join('');

      // Populate modal datalists
      const categoryDatalist = document.getElementById("category-list");
      if (categoryDatalist) {
        categoryDatalist.innerHTML = categories.map(c => `<option value="${c}">`).join('');
      }

      const projectDatalist = document.getElementById("project-list");
      if (projectDatalist) {
        projectDatalist.innerHTML = projects.map(p => `<option value="${p}">`).join('');
      }

      const siteDatalist = document.getElementById("site-list");
      if (siteDatalist) {
        siteDatalist.innerHTML = sites.map(s => `<option value="${s}">`).join('');
      }
    }

    function renderColumnToggles() {
      columnsList.innerHTML = allColumns.map(col => `
                <label class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input type="checkbox" 
                           class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                           data-column="${col.key}" 
                           ${columnVisibility[col.key] ? 'checked' : ''}>
                    <span class="text-sm text-gray-700">${col.label}</span>
                </label>
            `).join('');

      columnsList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          columnVisibility[checkbox.dataset.column] = checkbox.checked;
          renderTableHeader();
          renderTable();
        });
      });
    }

    function renderTableHeader() {
      const visibleColumns = allColumns.filter(col => columnVisibility[col.key]);
      const headerCells = visibleColumns.map(col => `
                <th ${col.sortable ? `data-col="${col.key}"` : ''} 
                    class="px-4 py-3 text-left font-semibold ${col.sortable ? 'cursor-pointer hover:bg-purple-700 transition' : ''}">
                    <div class="flex items-center gap-2">
                        ${col.label}
                        ${col.sortable ? '<span class="text-xs opacity-70">⇅</span>' : ''}
                        ${currentSort.column === col.key ? (currentSort.asc ? ' ▲' : ' ▼') : ''}
                    </div>
                </th>
            `).join('');

      tableHeader.innerHTML = `
                <th class="px-4 py-3 text-center w-12">
                    <input type="checkbox" id="select-all" class="w-4 h-4 rounded border-gray-300 text-white focus:ring-white cursor-pointer">
                </th>
                ${headerCells}
                <th class="px-4 py-3 text-right font-semibold">Actions</th>
            `;

      // Re-attach event listeners
      document.getElementById("select-all")?.addEventListener("change", handleSelectAll);
      document.querySelectorAll("#masterroll-table th[data-col]").forEach(th => {
        th.addEventListener("click", () => {
          sortData(th.dataset.col);
          renderTable();
        });
      });
    }

    function paginate(array, page = 1, rows = 10) {
      const start = (page - 1) * rows;
      const end = start + rows;
      return array.slice(start, end);
    }

    function renderPagination() {
      const totalPages = Math.ceil(filteredRolls.length / rowsPerPage) || 1;
      let pages = [];

      const maxPagesToShow = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      const startRecord = filteredRolls.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
      const endRecord = Math.min(currentPage * rowsPerPage, filteredRolls.length);

      paginationContainer.innerHTML = `
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="flex flex-col sm:flex-row items-center gap-3 text-sm">
        <span class="text-gray-600">
          Showing <span class="font-semibold text-gray-900">${startRecord}-${endRecord}</span> of 
          <span class="font-semibold text-gray-900">${filteredRolls.length}</span> entries
        </span>
        <div class="flex items-center gap-2">
          <label for="rows-per-page" class="text-gray-600">Rows:</label>
          <select id="rows-per-page" class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            ${[5, 10, 25, 50, 100].map(r => `<option value="${r}" ${r === rowsPerPage ? "selected" : ""}>${r}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="flex items-center gap-1">
        <button data-action="prev" ${currentPage === 1 ? "disabled" : ""} 
                class="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm font-medium text-gray-700">
          ← Prev
        </button>

        ${startPage > 1 ? `<span class="px-2 text-gray-400 text-sm">...</span>` : ""}

        ${pages.map(p => `
          <button data-page="${p}" class="px-3 py-1.5 rounded-lg text-sm font-medium transition ${p === currentPage
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'border border-gray-300 hover:bg-indigo-50 text-gray-700'}">
            ${p}
          </button>
        `).join('')}

        ${endPage < totalPages ? `<span class="px-2 text-gray-400 text-sm">...</span>` : ""}

        <button data-action="next" ${currentPage === totalPages ? "disabled" : ""} 
                class="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm font-medium text-gray-700">
          Next →
        </button>
      </div>
    </div>
  `;

      paginationContainer.querySelectorAll("button[data-page]").forEach(btn => {
        btn.addEventListener("click", () => {
          currentPage = parseInt(btn.dataset.page);
          renderTable();
        });
      });

      paginationContainer.querySelector("button[data-action='prev']")?.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          renderTable();
        }
      });

      paginationContainer.querySelector("button[data-action='next']")?.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderTable();
        }
      });

      document.getElementById("rows-per-page")?.addEventListener("change", (e) => {
        rowsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderTable();
      });
    }

    function sortData(column) {
      if (currentSort.column === column) {
        currentSort.asc = !currentSort.asc;
      } else {
        currentSort.column = column;
        currentSort.asc = true;
      }

      filteredRolls.sort((a, b) => {
        const valA = a[column] ?? "";
        const valB = b[column] ?? "";
        if (valA < valB) return currentSort.asc ? -1 : 1;
        if (valA > valB) return currentSort.asc ? 1 : -1;
        return 0;
      });

      renderTableHeader();
    }

    function applyAdvancedFilters() {
      let filtered = [...masterRolls];

      // Text search
      const searchTerm = searchInput.value.toLowerCase();
      if (searchTerm) {
        filtered = filtered.filter(r =>
          Object.values(r).some(v => String(v).toLowerCase().includes(searchTerm))
        );
      }

      // Date range
      if (advancedFilters.dateRange.from) {
        filtered = filtered.filter(r => r.date_of_joining >= advancedFilters.dateRange.from);
      }
      if (advancedFilters.dateRange.to) {
        filtered = filtered.filter(r => r.date_of_joining <= advancedFilters.dateRange.to);
      }

      // Wage range
      if (advancedFilters.wage.min) {
        filtered = filtered.filter(r => parseFloat(r.p_day_wage || 0) >= parseFloat(advancedFilters.wage.min));
      }
      if (advancedFilters.wage.max) {
        filtered = filtered.filter(r => parseFloat(r.p_day_wage || 0) <= parseFloat(advancedFilters.wage.max));
      }

      // Category, Project, Site
      if (advancedFilters.category) {
        filtered = filtered.filter(r => r.category === advancedFilters.category);
      }
      if (advancedFilters.project) {
        filtered = filtered.filter(r => r.project === advancedFilters.project);
      }
      if (advancedFilters.site) {
        filtered = filtered.filter(r => r.site === advancedFilters.site);
      }

      filteredRolls = filtered;
      currentPage = 1;
      updateFilterBadge();
    }

    function handleSelectAll(e) {
      const checked = e.target.checked;
      const pageData = paginate(filteredRolls, currentPage, rowsPerPage);

      pageData.forEach(row => {
        if (checked) {
          selectedRows.add(row.id);
        } else {
          selectedRows.delete(row.id);
        }
      });

      updateBulkActionsUI();
      renderTable();
    }

    function updateBulkActionsUI() {
      const count = selectedRows.size;
      bulkActionsBtn.disabled = count === 0;

      if (count > 0) {
        selectedCountSpan.textContent = count;
        selectedCountSpan.classList.remove("hidden");
      } else {
        selectedCountSpan.classList.add("hidden");
      }
    }

    async function fetchMasterRolls() {
      try {
        const res = await fetch("/api/master-rolls", { headers: getAuthHeaders() });
        const json = await res.json();
        masterRolls = json.data || [];
        filteredRolls = [...masterRolls];
        currentPage = 1;
        selectedRows.clear();
        populateFilterDropdowns();
        updateStats();
        renderTableHeader();
        renderTable();
      } catch (err) {
        showToast("Failed to fetch data", "error");
        console.error(err);
      }
    }

    async function createMasterRoll(data) {
      try {
        const res = await fetch("/api/master-rolls", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.success) showToast(`Employee "${data.employee_name}" added successfully!`);
        else showToast("Failed to add employee", "error");
        await fetchMasterRolls();
      } catch (err) {
        showToast("Error adding employee", "error");
        console.error(err);
      }
    }

    async function updateMasterRoll(id, data) {
      try {
        const res = await fetch(`/api/master-rolls/${id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.success) showToast(`Employee "${data.employee_name}" updated successfully!`);
        else showToast("Failed to update employee", "error");
        await fetchMasterRolls();
      } catch (err) {
        showToast("Error updating employee", "error");
        console.error(err);
      }
    }

    async function deleteMasterRoll(id) {
      if (!confirm("Are you sure you want to delete this record?")) return;
      try {
        const row = masterRolls.find(r => r.id == id);
        const res = await fetch(`/api/master-rolls/${id}`, { method: "DELETE", headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) showToast(`Employee "${row.employee_name}" deleted successfully!`);
        else showToast("Failed to delete employee", "error");
        await fetchMasterRolls();
      } catch (err) {
        showToast("Error deleting employee", "error");
        console.error(err);
      }
    }


    // ===== NEW: Fetch Single Employee by ID =====
    async function fetchMasterRollById(id) {
      try {
        const res = await fetch(`/api/master-rolls/${id}`);
        const json = await res.json();
        if (json.success) {
          return json.data;
        } else {
          showToast("Failed to fetch employee details", "error");
          return null;
        }
      } catch (err) {
        showToast("Error fetching employee details", "error");
        console.error(err);
        return null;
      }
    }

    // ===== NEW: Fetch Activity Log =====
    async function fetchActivityLog(id) {
      try {
        const res = await fetch(`/api/master-rolls/${id}/activity`);
        const json = await res.json();
        if (json.success) {
          return json.data;
        } else {
          showToast("Failed to fetch activity log", "error");
          return [];
        }
      } catch (err) {
        showToast("Error fetching activity log", "error");
        console.error(err);
        return [];
      }
    }

    // ===== NEW: Server-Side Search =====
    async function searchMasterRollsServer(query, limit = 50, offset = 0) {
      try {
        const params = new URLSearchParams({ q: query, limit, offset });
        const res = await fetch(`/api/master-rolls/search?${params}`);
        const json = await res.json();
        if (json.success) {
          return json.data;
        } else {
          showToast("Search failed", "error");
          return [];
        }
      } catch (err) {
        showToast("Error searching employees", "error");
        console.error(err);
        return [];
      }
    }

    // ===== NEW: Fetch Stats from Server =====
    async function fetchStatsFromServer() {
      try {
        const res = await fetch("/api/master-rolls/stats");
        const json = await res.json();
        if (json.success) {
          return json.data;
        } else {
          return null;
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        return null;
      }
    }

    // ===== NEW: Show Activity Log Modal =====
    async function showActivityLog(employeeId, employeeName) {
      const activities = await fetchActivityLog(employeeId);
      
      if (activities.length === 0) {
        showToast("No activity history available", "info");
        return;
      }

      const modalHtml = `
        <div id="activity-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <h2 class="text-2xl font-bold">Activity History</h2>
              <p class="text-indigo-100 mt-1">${employeeName}</p>
            </div>
            
            <div class="p-6 overflow-y-auto max-h-96">
              <div class="space-y-4">
                ${activities.map(activity => `
                  <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div class="flex-shrink-0">
                      <div class="w-10 h-10 rounded-full ${
                        activity.action === 'created' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      } flex items-center justify-center">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          ${activity.action === 'created' 
                            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>'
                            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>'
                          }
                        </svg>
                      </div>
                    </div>
                    
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-1">
                        <h3 class="font-semibold text-gray-900 capitalize">${activity.action}</h3>
                        <span class="text-sm text-gray-500">${new Date(activity.timestamp).toLocaleString()}</span>
                      </div>
                      <p class="text-sm text-gray-600">
                        by <span class="font-medium">${activity.user_name || 'Unknown'}</span>
                        <span class="text-gray-400">(${activity.username || 'N/A'})</span>
                      </p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <div class="border-t p-4 flex justify-end">
              <button id="close-activity-modal" class="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition">
                Close
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);

      document.getElementById('close-activity-modal').addEventListener('click', () => {
        document.getElementById('activity-modal').remove();
      });
      
      document.getElementById('activity-modal').addEventListener('click', (e) => {
        if (e.target.id === 'activity-modal') {
          document.getElementById('activity-modal').remove();
        }
      });
    }


        async function bulkDeleteSelected() {
      if (!confirm(`Are you sure you want to delete ${selectedRows.size} employees?`)) return;

      try {
        const ids = Array.from(selectedRows);
        
        // Use bulk delete endpoint for efficiency
        const res = await fetch("/api/master-rolls/bulk-delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids })
        });
        
        const json = await res.json();
        
        if (json.success) {
          if (json.failed > 0) {
            showToast(`Deleted ${json.deleted}, failed ${json.failed}`, "warning");
            console.warn("Failed deletions:", json.failedIds);
          } else {
            showToast(`${json.deleted} employees deleted successfully!`);
          }
          selectedRows.clear();
          await fetchMasterRolls();
        } else {
          // Fallback to individual deletes if bulk endpoint returns error
          console.warn("Bulk delete failed, falling back to individual deletes");
          const promises = ids.map(id =>
            fetch(`/api/master-rolls/${id}`, { method: "DELETE" })
          );
          await Promise.all(promises);
          showToast(`${ids.length} employees deleted successfully!`);
          selectedRows.clear();
          await fetchMasterRolls();
        }
      } catch (err) {
        // Fallback on network error
        try {
          const promises = Array.from(selectedRows).map(id =>
            fetch(`/api/master-rolls/${id}`, { method: "DELETE" })
          );
          await Promise.all(promises);
          showToast(`${selectedRows.size} employees deleted successfully!`);
          selectedRows.clear();
          await fetchMasterRolls();
        } catch (fallbackErr) {
          showToast("Error deleting employees", "error");
          console.error(fallbackErr);
        }
      }
    }

    function exportSelected() {
      const selected = masterRolls.filter(r => selectedRows.has(r.id));
      exportToExcel(selected, `MasterRoll_Selected_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    function exportToExcel(data, filename) {
      if (data.length === 0) {
        showToast("No data to export", "error");
        return;
      }

      const wb = XLSX.utils.book_new();
      const ws_data = [
        allColumns.map(col => col.label),
        ...data.map(r => allColumns.map(col => r[col.key] ?? ''))
      ];
      const ws = XLSX.utils.aoa_to_sheet(ws_data);

      const colWidths = ws_data[0].map((_, i) => ({
        wch: Math.max(...ws_data.map(row => String(row[i] || "").length)) + 2
      }));
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Master Roll");
      XLSX.writeFile(wb, filename);
      showToast(`Excel file exported successfully! (${data.length} records)`);
    }

    function renderTable() {
      const pageData = paginate(filteredRolls, currentPage, rowsPerPage);
      const visibleColumns = allColumns.filter(col => columnVisibility[col.key]);

      if (pageData.length === 0) {
        tableBody.innerHTML = `
                    <tr>
                        <td colspan="${visibleColumns.length + 2}" class="p-12 text-center text-gray-500">
                            <div class="flex flex-col items-center gap-3">
                                <svg class="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                                </svg>
                                <span class="text-xl font-semibold text-gray-400">No employees found</span>
                                <span class="text-sm text-gray-400">Try adjusting your filters or search criteria</span>
                            </div>
                        </td>
                    </tr>
                `;
      } else {
        tableBody.innerHTML = pageData.map((row, idx) => {
          const isSelected = selectedRows.has(row.id);
          const cells = visibleColumns.map(col => {
            let value = row[col.key] ?? '-';
            if (col.key === 'aadhar') value = maskAadhar(value);
            if (col.key === 'p_day_wage' && value !== '-') value = `₹${value}`;
            return `<td class="px-4 py-3 text-gray-700">${value}</td>`;
          }).join('');

          return `
                        <tr class="hover:bg-indigo-50 transition duration-150 ${isSelected ? 'table-row-selected' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')}">
                            <td class="px-4 py-3 text-center">
                                <input type="checkbox" 
                                       class="row-checkbox w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                                       data-id="${row.id}"
                                       ${isSelected ? 'checked' : ''}>
                            </td>
                            ${cells}
                            <td class="px-2 py-2">
  <div class="flex items-center justify-center gap-2">
    <button
      data-id="${row.id}"
      class="edit-btn text-emerald-600 hover:text-emerald-800 transition"
      title="Edit"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none"
           viewBox="0 0 24 24" stroke-width="1.5"
           stroke="currentColor" class="w-4 h-4">
        <path stroke-linecap="round" stroke-linejoin="round"
              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
      </svg>
    </button>

    <button
      data-id="${row.id}"
      class="delete-btn text-red-600 hover:text-red-800 transition"
      title="Delete"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none"
           viewBox="0 0 24 24" stroke-width="1.5"
           stroke="currentColor" class="w-4 h-4">
        <path stroke-linecap="round" stroke-linejoin="round"
              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
      </svg>
    </button>
  </div>
</td>
                        </tr>
                    `;
        }).join("");

        // Row checkbox handlers
        document.querySelectorAll(".row-checkbox").forEach(checkbox => {
          checkbox.addEventListener("change", (e) => {
            const id = parseInt(checkbox.dataset.id);
            if (e.target.checked) {
              selectedRows.add(id);
            } else {
              selectedRows.delete(id);
            }
            updateBulkActionsUI();
            renderTable();
          });
        });
      }

      document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          const row = masterRolls.find(r => r.id == id);
          if (!row) return;
          for (const key in row) {
            const input = form.querySelector(`[name=${key}]`);
            if (input) input.value = row[key] ?? "";
          }
          editingId = id;
          modalTitle.textContent = "Edit Employee";
          modal.classList.remove("hidden");
        });
      });

      document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", () => deleteMasterRoll(btn.dataset.id));
      });

      renderPagination();
      updateStats();
    }

    // Event Listeners
    openModalBtn.addEventListener("click", () => {
      modalTitle.textContent = "Add New Employee";
      form.reset();
      editingId = null;
      modal.classList.remove("hidden");
    });

    closeModalBtn.addEventListener("click", () => modal.classList.add("hidden"));
    cancelBtn.addEventListener("click", () => modal.classList.add("hidden"));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.add("hidden");
    });

    // Filters
    filtersBtn.addEventListener("click", () => {
      filtersPanel.classList.toggle("hidden");
      columnsPanel.classList.add("hidden");
    });

    document.getElementById("apply-filters-btn").addEventListener("click", () => {
      advancedFilters.dateRange.from = document.getElementById("filter-date-from").value;
      advancedFilters.dateRange.to = document.getElementById("filter-date-to").value;
      advancedFilters.wage.min = document.getElementById("filter-wage-min").value;
      advancedFilters.wage.max = document.getElementById("filter-wage-max").value;
      advancedFilters.category = document.getElementById("filter-category").value;
      advancedFilters.project = document.getElementById("filter-project").value;
      advancedFilters.site = document.getElementById("filter-site").value;

      applyAdvancedFilters();
      renderTable();
    });

    document.getElementById("clear-filters-btn").addEventListener("click", () => {
      document.getElementById("filter-date-from").value = '';
      document.getElementById("filter-date-to").value = '';
      document.getElementById("filter-wage-min").value = '';
      document.getElementById("filter-wage-max").value = '';
      document.getElementById("filter-category").value = '';
      document.getElementById("filter-project").value = '';
      document.getElementById("filter-site").value = '';

      advancedFilters = { dateRange: { from: '', to: '' }, wage: { min: '', max: '' }, category: '', project: '', site: '' };
      applyAdvancedFilters();
      renderTable();
    });

    // Columns
    columnsBtn.addEventListener("click", () => {
      columnsPanel.classList.toggle("hidden");
      filtersPanel.classList.add("hidden");
    });

    document.getElementById("show-all-columns").addEventListener("click", () => {
      Object.keys(columnVisibility).forEach(key => columnVisibility[key] = true);
      renderColumnToggles();
      renderTableHeader();
      renderTable();
    });

    document.getElementById("hide-all-columns").addEventListener("click", () => {
      Object.keys(columnVisibility).forEach(key => columnVisibility[key] = false);
      // Keep essential columns visible
      columnVisibility.employee_name = true;
      columnVisibility.phone_no = true;
      renderColumnToggles();
      renderTableHeader();
      renderTable();
    });

    // Bulk Actions
    bulkActionsBtn.addEventListener("click", () => {
      bulkActionsMenu.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!bulkActionsBtn.contains(e.target) && !bulkActionsMenu.contains(e.target)) {
        bulkActionsMenu.classList.remove("active");
      }
    });

    bulkActionsMenu.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        if (action === "export-selected") exportSelected();
        if (action === "delete-selected") bulkDeleteSelected();
        bulkActionsMenu.classList.remove("active");
      });
    });

    searchInput.addEventListener("input", () => {
      applyAdvancedFilters();
      renderTable();
    });

    exportBtn.addEventListener("click", () => {
      exportToExcel(filteredRolls, `MasterRoll_${new Date().toISOString().split('T')[0]}.xlsx`);
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());

      if (!/^\d{12}$/.test(data.aadhar)) {
        showToast("Aadhar must be exactly 12 digits", "error");
        return;
      }

      if (data.phone_no && !/^\d{10}$/.test(data.phone_no)) {
        showToast("Phone must be exactly 10 digits", "error");
        return;
      }

      if (data.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.pan.toUpperCase())) {
        showToast("Invalid PAN format (e.g., ABCDE1234F)", "error");
        return;
      }

      if (editingId) await updateMasterRoll(editingId, data);
      else await createMasterRoll(data);
      form.reset();
      editingId = null;
      modal.classList.add("hidden");
    });

    const importBtn = document.getElementById("import-btn");
    const fileInput = document.getElementById("import-file-input");

    // 1. Trigger File Input
    if (importBtn) {
      importBtn.addEventListener("click", () => {
        fileInput.click();
      });
    }

    // 2. Handle File Selection
    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset input so same file can be selected again if needed
        e.target.value = '';

        const reader = new FileReader();

        reader.onload = async (evt) => {
          try {
            const data = evt.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });

            // Assume data is in the first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convert to JSON
            const rawData = XLSX.utils.sheet_to_json(worksheet);

            if (rawData.length === 0) {
              showToast("The selected Excel file is empty", "error");
              return;
            }

            // Map Keys
            const mappedData = rawData.map(row => {
              const newRow = {};
              Object.keys(row).forEach(oldKey => {
                // Remove extra spaces from header keys (e.g. " Employee Name " -> "Employee Name")
                const cleanKey = oldKey.trim();
                const dbKey = excelHeaderMap[cleanKey];

                if (dbKey) {
                  // Handle Date Parsing (Excel dates are sometimes numbers)
                  let value = row[oldKey];
                  if ((dbKey.includes('date') || dbKey === 'dob') && typeof value === 'number') {
                    // Simple conversion for Excel serial dates
                    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
                    value = date.toISOString().split('T')[0];
                  }
                  newRow[dbKey] = value;
                }
              });
              return newRow;
            });

            // Send to Server
            await uploadBulkData(mappedData);

          } catch (err) {
            console.error("Error processing Excel:", err);
            showToast("Failed to process Excel file. Please ensure valid format", "error");
          }
        };

        reader.readAsBinaryString(file);
      });
    }

    // 3. Send to Server Function
    async function uploadBulkData(jsonData) {
      // Show loading state (optional: you can use a toast or change button text)
      const originalText = importBtn.innerHTML;
      importBtn.innerHTML = `<span>⏳ Uploading...</span>`;
      importBtn.disabled = true;

      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch("/api/master-rolls/bulk", {
          method: "POST",
          headers: {
            ...getAuthHeaders()
          },
          body: JSON.stringify(jsonData)
        });

        const result = await res.json();

        if (result.success) {
          // Construct success message
          let msg = `✅ Imported: ${result.imported}`;
          if (result.failed > 0) {
            msg += ` | ❌ Failed: ${result.failed}`;
            // Ideally show the specific errors in a modal or console
            console.warn("Import Failures:", result.errors);
            showToast(`${msg} - Check console for details`, result.failed > 0 ? "warning" : "success");
          } else {
            // Simple toast for full success (you can replace alert with your toast lib)
            showToast("Excel uploaded successfully!", "success");
          }

          // Refresh table
          fetchMasterRolls();
        } else {
          showToast("Upload failed: " + result.error, "error");
        }

      } catch (err) {
        console.error("Upload error:", err);
        showToast("Server error during upload", "error");
      } finally {
        // Reset button
        importBtn.innerHTML = originalText;
        importBtn.disabled = false;
      }
    }

    // Initialize
    renderColumnToggles();
    fetchMasterRolls();
  }

  return { html, scripts };
}