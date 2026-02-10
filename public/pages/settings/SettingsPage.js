/**
 * Settings Page
 * Manages firm settings, invoice settings, and system configurations
 */

import { showSuccess, showError } from '../../components/common/Toast.js';

export function SettingsPage() {
  let activeTab = 'firm';
  let firmSettings = {};
  let invoiceSettings = {};
  let taxSettings = {};

  const container = document.createElement('div');
  container.className = 'settings-page p-6';

  async function loadSettings() {
    try {
      const token = localStorage.getItem('token');
      
      const [firmRes, invoiceRes, taxRes] = await Promise.all([
        fetch('/api/settings/firm', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/settings/invoice', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/settings/tax', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (firmRes.ok) firmSettings = await firmRes.json();
      if (invoiceRes.ok) invoiceSettings = await invoiceRes.json();
      if (taxRes.ok) taxSettings = await taxRes.json();

      render();
    } catch (error) {
      console.error('Error loading settings:', error);
      showError('Failed to load settings');
    }
  }

  function render() {
    container.innerHTML = `
      <div class="max-w-5xl mx-auto">
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900">Settings</h1>
          <p class="text-gray-600 mt-1">Manage firm and system settings</p>
        </div>

        <!-- Tabs -->
        <div class="bg-white rounded-lg shadow mb-6">
          <div class="border-b border-gray-200">
            <nav class="flex -mb-px">
              ${renderTab('firm', 'Firm Settings')}
              ${renderTab('invoice', 'Invoice Settings')}
              ${renderTab('tax', 'Tax Settings')}
            </nav>
          </div>

          <!-- Tab Content -->
          <div class="p-6">
            ${activeTab === 'firm' ? renderFirmSettings() : ''}
            ${activeTab === 'invoice' ? renderInvoiceSettings() : ''}
            ${activeTab === 'tax' ? renderTaxSettings() : ''}
          </div>
        </div>
      </div>
    `;

    setupEventListeners();
  }

  function renderTab(tabName, label) {
    const isActive = activeTab === tabName;
    return `
      <button
        data-action="switch-tab"
        data-tab="${tabName}"
        class="px-6 py-3 text-sm font-medium ${isActive ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}">
        ${label}
      </button>
    `;
  }

  function renderFirmSettings() {
    return `
      <form data-form="firm">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Firm Name</label>
            <input type="text" name="firm_name" value="${firmSettings.firm_name || ''}"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
            <input type="text" name="gstin" value="${firmSettings.gstin || ''}"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md">
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea name="address" rows="3"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md">${firmSettings.address || ''}</textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="text" name="phone" value="${firmSettings.phone || ''}"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" value="${firmSettings.email || ''}"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md">
          </div>
        </div>
        <div class="mt-6">
          <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Save Firm Settings
          </button>
        </div>
      </form>
    `;
  }

  function renderInvoiceSettings() {
    return `
      <form data-form="invoice">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
            <input type="text" name="invoice_prefix" value="${invoiceSettings.invoice_prefix || 'INV'}"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Starting Number</label>
            <input type="number" name="starting_number" value="${invoiceSettings.starting_number || 1}"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
            <textarea name="terms" rows="4"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md">${invoiceSettings.terms || ''}</textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Bank Details</label>
            <textarea name="bank_details" rows="4"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md">${invoiceSettings.bank_details || ''}</textarea>
          </div>
        </div>
        <div class="mt-6">
          <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Save Invoice Settings
          </button>
        </div>
      </form>
    `;
  }

  function renderTaxSettings() {
    return `
      <form data-form="tax">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Default GST Rate (%)</label>
            <input type="number" name="default_gst_rate" value="${taxSettings.default_gst_rate || 18}" step="0.01"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Enable Cess</label>
            <select name="enable_cess" class="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="true" ${taxSettings.enable_cess ? 'selected' : ''}>Yes</option>
              <option value="false" ${!taxSettings.enable_cess ? 'selected' : ''}>No</option>
            </select>
          </div>
        </div>
        <div class="mt-6">
          <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Save Tax Settings
          </button>
        </div>
      </form>
    `;
  }

  function setupEventListeners() {
    container.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('[data-action="switch-tab"]');
      if (tabBtn) {
        activeTab = tabBtn.dataset.tab;
        render();
      }
    });

    container.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target.closest('form');
      const formType = form.dataset.form;
      
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/settings/${formType}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to save settings');

        showSuccess('Settings saved successfully');
        loadSettings();
      } catch (error) {
        console.error('Error saving settings:', error);
        showError(error.message);
      }
    });
  }

  loadSettings();

  return container;
}
