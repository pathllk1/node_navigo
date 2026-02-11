import { initializeFirmsManagementTabs } from './admin/firms-management-tabs.js';
import { initFirmsManagement } from './admin/firms-management.js';

export function AdminPanel() {
  let html = `
    <div class="container mx-auto px-4 py-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-purple-700">Admin Panel</h1>
        <p class="text-gray-600">Manage firms and user registrations</p>
      </div>

      <!-- Stats Cards -->
      <div id="admin-stats" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="text-gray-500 text-sm">Total Firms</div>
          <div class="text-2xl font-bold text-purple-700" id="stat-total-firms">-</div>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="text-gray-500 text-sm">Pending Firms</div>
          <div class="text-2xl font-bold text-orange-600" id="stat-pending-firms">-</div>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="text-gray-500 text-sm">Pending Users</div>
          <div class="text-2xl font-bold text-orange-600" id="stat-pending-users">-</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white rounded-lg shadow mb-6">
        <div class="flex border-b overflow-x-auto">
          <button id="tab-firms" class="px-6 py-3 font-semibold text-purple-700 border-b-2 border-purple-700 whitespace-nowrap">Manage Firms</button>
          <button id="tab-firms-management" class="px-6 py-3 font-semibold text-gray-500 hover:text-purple-700 whitespace-nowrap">Firm Details</button>
          <button id="tab-users" class="px-6 py-3 font-semibold text-gray-500 hover:text-purple-700 whitespace-nowrap">Pending Users</button>
          <button id="tab-user-assignment" class="px-6 py-3 font-semibold text-gray-500 hover:text-purple-700 whitespace-nowrap">Assign Users</button>
        </div>

        <!-- Manage Firms Tab -->
        <div id="content-firms" class="p-6">
          <h2 class="text-xl font-semibold text-purple-700 mb-4">All Firms</h2>
          <div id="firms-list" class="overflow-x-auto">
            <p class="text-gray-500">Loading...</p>
          </div>
        </div>

        <!-- Firm Details Management Tab -->
        <div id="content-firms-management" class="p-6 hidden">
          <h2 class="text-xl font-semibold text-purple-700 mb-4">Firm Details Management</h2>
          <div class="mb-4">
            <button id="add-firm-btn" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Add New Firm
            </button>
          </div>
          <div id="firms-management-list" class="overflow-x-auto">
            <p class="text-gray-500">Loading...</p>
          </div>
        </div>

        <!-- Pending Users Tab -->
        <div id="content-users" class="p-6 hidden">
          <h2 class="text-xl font-semibold text-purple-700 mb-4">Pending User Registrations</h2>
          <div id="users-list" class="overflow-x-auto">
            <p class="text-gray-500">Loading...</p>
          </div>
        </div>

        <!-- User Assignment Tab -->
        <div id="content-user-assignment" class="p-6 hidden">
          <h2 class="text-xl font-semibold text-purple-700 mb-4">Assign Users to Firms</h2>
          <div id="user-assignment-list" class="overflow-x-auto">
            <p class="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Firm Modal -->
    <div id="firm-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 id="modal-title" class="text-lg font-semibold text-gray-800">Add/Edit Firm</h2>
          <button id="close-firm-modal" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form id="firm-form" class="space-y-4">
          <input type="hidden" id="firm-id">
          
          <!-- Basic Information Section -->
          <div>
            <h3 class="text-md font-semibold text-gray-700 mb-3">Basic Information</h3>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label for="firm-name" class="block text-sm font-medium text-gray-700 mb-1">Firm Name *</label>
                <input type="text" id="firm-name" required class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-legal-name" class="block text-sm font-medium text-gray-700 mb-1">Legal Name</label>
                <input type="text" id="firm-legal-name" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-address" class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea id="firm-address" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
              </div>
              <div>
                <label for="firm-city" class="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" id="firm-city" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-state" class="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input type="text" id="firm-state" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-country" class="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input type="text" id="firm-country" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-pincode" class="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input type="text" id="firm-pincode" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-phone" class="block text-sm font-medium text-gray-700 mb-1">Primary Phone</label>
                <input type="text" id="firm-phone" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-secondary-phone" class="block text-sm font-medium text-gray-700 mb-1">Secondary Phone</label>
                <input type="text" id="firm-secondary-phone" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" id="firm-email" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-website" class="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input type="url" id="firm-website" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-business-type" class="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                <input type="text" id="firm-business-type" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="LLC, Corporation, Partnership">
              </div>
              <div>
                <label for="firm-industry-type" class="block text-sm font-medium text-gray-700 mb-1">Industry Type</label>
                <input type="text" id="firm-industry-type" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Manufacturing, Trading, Services">
              </div>
              <div>
                <label for="firm-establishment-year" class="block text-sm font-medium text-gray-700 mb-1">Establishment Year</label>
                <input type="number" id="firm-establishment-year" min="1900" max="2099" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-employee-count" class="block text-sm font-medium text-gray-700 mb-1">Employee Count</label>
                <input type="number" id="firm-employee-count" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
            </div>
          </div>
          
          <!-- Registration Details Section -->
          <div>
            <h3 class="text-md font-semibold text-gray-700 mb-3">Registration Details</h3>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label for="firm-registration-number" class="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                <input type="text" id="firm-registration-number" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-registration-date" class="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
                <input type="date" id="firm-registration-date" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-cin-number" class="block text-sm font-medium text-gray-700 mb-1">CIN Number</label>
                <input type="text" id="firm-cin-number" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-pan-number" class="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                <input type="text" id="firm-pan-number" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-gst-number" class="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                <div class="flex gap-2">
                  <input type="text" id="firm-gst-number" class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="27ABCDE1234F1Z5" maxlength="15">
                  <button type="button" id="btn-fetch-firm-gst" class="bg-orange-500 hover:bg-orange-600 text-white px-3 rounded text-xs font-bold shadow transition-colors flex items-center justify-center min-w-[60px]">
                    FETCH
                  </button>
                </div>
                <p class="text-[10px] text-gray-400 mt-1">Click Fetch to auto-fill details</p>
              </div>
              <div>
                <label for="firm-tax-id" class="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                <input type="text" id="firm-tax-id" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-vat-number" class="block text-sm font-medium text-gray-700 mb-1">VAT Number</label>
                <input type="text" id="firm-vat-number" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
            </div>
          </div>
          
          <!-- Banking Details Section -->
          <div>
            <h3 class="text-md font-semibold text-gray-700 mb-3">Banking Details</h3>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label for="firm-bank-account-number" class="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
                <input type="text" id="firm-bank-account-number" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-bank-name" class="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input type="text" id="firm-bank-name" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-bank-branch" class="block text-sm font-medium text-gray-700 mb-1">Bank Branch</label>
                <input type="text" id="firm-bank-branch" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-ifsc-code" class="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                <input type="text" id="firm-ifsc-code" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-payment-terms" class="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                <input type="text" id="firm-payment-terms" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" value="Net 30">
              </div>
            </div>
          </div>
          
          <!-- Compliance Section -->
          <div>
            <h3 class="text-md font-semibold text-gray-700 mb-3">Compliance</h3>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label for="firm-status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select id="firm-status" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>
              <div>
                <label for="firm-license-numbers" class="block text-sm font-medium text-gray-700 mb-1">License Numbers (JSON)</label>
                <input type="text" id="firm-license-numbers" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder='{"trade_license":"TL123"}'>
              </div>
              <div>
                <label for="firm-insurance-details" class="block text-sm font-medium text-gray-700 mb-1">Insurance Details (JSON)</label>
                <textarea id="firm-insurance-details" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder='{"general_liability":"Policy ABC123"}'></textarea>
              </div>
            </div>
          </div>
          
          <!-- Business Settings Section -->
          <div>
            <h3 class="text-md font-semibold text-gray-700 mb-3">Business Settings</h3>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label for="firm-currency" class="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <input type="text" id="firm-currency" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" value="INR">
              </div>
              <div>
                <label for="firm-timezone" class="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <input type="text" id="firm-timezone" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" value="Asia/Kolkata">
              </div>
              <div>
                <label for="firm-fiscal-year-start" class="block text-sm font-medium text-gray-700 mb-1">Fiscal Year Start Month</label>
                <input type="number" id="firm-fiscal-year-start" min="1" max="12" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" value="4">
              </div>
              <div>
                <label for="firm-invoice-prefix" class="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
                <input type="text" id="firm-invoice-prefix" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" value="INV">
              </div>
              <div>
                <label for="firm-quote-prefix" class="block text-sm font-medium text-gray-700 mb-1">Quote Prefix</label>
                <input type="text" id="firm-quote-prefix" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" value="QT">
              </div>
              <div>
                <label for="firm-po-prefix" class="block text-sm font-medium text-gray-700 mb-1">Purchase Order Prefix</label>
                <input type="text" id="firm-po-prefix" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" value="PO">
              </div>
            </div>
          </div>
          
          <!-- Document Settings Section -->
          <div>
            <h3 class="text-md font-semibold text-gray-700 mb-3">Document Settings</h3>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div class="lg:col-span-2">
                <label for="firm-logo-url" class="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input type="url" id="firm-logo-url" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="firm-invoice-template" class="block text-sm font-medium text-gray-700 mb-1">Invoice Template</label>
                <select id="firm-invoice-template" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option value="standard">Standard</option>
                  <option value="modern">Modern</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
              <div class="flex items-center pt-4">
                <input type="checkbox" id="firm-enable-e-invoice" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <label for="firm-enable-e-invoice" class="ml-2 block text-sm text-gray-700">
                  Enable E-Invoice
                </label>
              </div>
            </div>
          </div>
          
          <!-- Admin Account Section (Only for New Firms) -->
          <div id="admin-account-section" class="hidden">
            <h3 class="text-md font-semibold text-gray-700 mb-3">Create Admin Account (Optional)</h3>
            <p class="text-sm text-gray-600 mb-3">Leave blank to skip admin account creation</p>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label for="admin-fullname" class="block text-sm font-medium text-gray-700 mb-1">Admin Full Name</label>
                <input type="text" id="admin-fullname" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="John Doe">
              </div>
              <div>
                <label for="admin-username" class="block text-sm font-medium text-gray-700 mb-1">Admin Username</label>
                <input type="text" id="admin-username" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="johndoe">
              </div>
              <div>
                <label for="admin-email" class="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                <input type="email" id="admin-email" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="john@example.com">
              </div>
              <div>
                <label for="admin-password" class="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
                <input type="password" id="admin-password" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••">
              </div>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" id="cancel-firm-btn" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" id="save-firm-btn" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              Save Firm
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  function scripts() {
    // Tab switching
    const tabs = {
      'tab-firms': 'content-firms',
      'tab-firms-management': 'content-firms-management',
      'tab-users': 'content-users',
      'tab-user-assignment': 'content-user-assignment'
    };

    Object.keys(tabs).forEach(tabId => {
      document.getElementById(tabId).addEventListener('click', () => {
        // Update tab styles
        Object.keys(tabs).forEach(id => {
          const tab = document.getElementById(id);
          const content = document.getElementById(tabs[id]);
          if (id === tabId) {
            tab.classList.add('text-purple-700', 'border-b-2', 'border-purple-700');
            tab.classList.remove('text-gray-500');
            content.classList.remove('hidden');
          } else {
            tab.classList.remove('text-purple-700', 'border-b-2', 'border-purple-700');
            tab.classList.add('text-gray-500');
            content.classList.add('hidden');
          }
        });

        // Load data when switching to tabs
        if (tabId === 'tab-firms') loadFirms();
        if (tabId === 'tab-firms-management') loadFirmsManagement();
        if (tabId === 'tab-users') loadPendingUsers();
        if (tabId === 'tab-user-assignment') loadUserAssignment();
      });
    });

    // Load stats
    async function loadStats() {
      try {
        const res = await fetch('/admin/stats');
        const data = await res.json();
        if (data.success) {
          document.getElementById('stat-total-firms').textContent = data.stats.totalFirms;
          document.getElementById('stat-pending-firms').textContent = data.stats.pendingFirms;
          document.getElementById('stat-pending-users').textContent = data.stats.pendingUsers;
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    }

    // Create firm
    // Removed - now using modal system in firms-management.js

    // Load firms
    async function loadFirms() {
      const container = document.getElementById('firms-list');
      container.innerHTML = '<p class="text-gray-500">Loading...</p>';

      try {
        const res = await fetch('/admin/firms');
        const data = await res.json();

        if (data.success && data.firms.length > 0) {
          const table = `
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firm Name</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${data.firms.map(firm => `
                  <tr>
                    <td class="px-4 py-3 text-sm text-gray-900">${firm.name}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${firm.code}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${firm.user_count} (${firm.pending_users} pending)</td>
                    <td class="px-4 py-3 text-sm">
                      <span class="px-2 py-1 text-xs rounded ${
                        firm.status === 'approved' ? 'bg-green-100 text-green-800' :
                        firm.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }">
                        ${firm.status}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm">
                      ${firm.status === 'pending' ? `
                        <button class="text-green-600 hover:text-green-800 mr-2" onclick="updateFirmStatus(${firm.id}, 'approved')">Approve</button>
                        <button class="text-red-600 hover:text-red-800" onclick="updateFirmStatus(${firm.id}, 'rejected')">Reject</button>
                      ` : firm.status === 'rejected' ? `
                        <button class="text-green-600 hover:text-green-800" onclick="updateFirmStatus(${firm.id}, 'approved')">Approve</button>
                      ` : `
                        <button class="text-red-600 hover:text-red-800" onclick="updateFirmStatus(${firm.id}, 'rejected')">Revoke</button>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
          container.innerHTML = table;
        } else {
          container.innerHTML = '<p class="text-gray-500">No firms found</p>';
        }
      } catch (err) {
        container.innerHTML = '<p class="text-red-500">Failed to load firms</p>';
      }
    }

    // Load pending users
    async function loadPendingUsers() {
      const container = document.getElementById('users-list');
      container.innerHTML = '<p class="text-gray-500">Loading...</p>';

      try {
        const res = await fetch('/admin/users/pending');
        const data = await res.json();

        if (data.success && data.users.length > 0) {
          const table = `
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firm</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${data.users.map(user => `
                  <tr>
                    <td class="px-4 py-3 text-sm text-gray-900">${user.fullname}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${user.username}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${user.email}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${user.firm_name}</td>
                    <td class="px-4 py-3 text-sm">
                      <span class="px-2 py-1 text-xs rounded ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }">
                        ${user.role}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm">
                      <button class="text-green-600 hover:text-green-800 mr-2" onclick="updateUserStatus(${user.id}, 'approved')">Approve</button>
                      <button class="text-red-600 hover:text-red-800" onclick="updateUserStatus(${user.id}, 'rejected')">Reject</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
          container.innerHTML = table;
        } else {
          container.innerHTML = '<p class="text-gray-500">No pending users</p>';
        }
      } catch (err) {
        container.innerHTML = '<p class="text-red-500">Failed to load users</p>';
      }
    }

    // Global functions for inline handlers
    window.updateFirmStatus = async (firmId, status) => {
      try {
        const res = await fetch(`/admin/firms/${firmId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });

        const data = await res.json();
        if (data.success) {
          loadFirms();
          loadStats();
        } else {
          alert(data.error);
        }
      } catch (err) {
        alert('Failed to update firm status');
      }
    };

    window.updateUserStatus = async (userId, status) => {
      try {
        const res = await fetch(`/admin/users/${userId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });

        const data = await res.json();
        if (data.success) {
          loadPendingUsers();
          loadStats();
        } else {
          alert(data.error);
        }
      } catch (err) {
        alert('Failed to update user status');
      }
    };

    // Initial load
    loadStats();
    
    // Initialize firms management components
    initializeFirmsManagementTabs();
    initFirmsManagement();
  }

  return { html, scripts };
}
