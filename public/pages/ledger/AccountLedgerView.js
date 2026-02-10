/**
 * Account Ledger View
 */

import { showError } from '../../components/common/Toast.js';

export function AccountLedgerView(accountName) {
  let entries = [];
  let balance = 0;
  let startDate = '';
  let endDate = '';

  const container = document.createElement('div');
  container.className = 'ledger-view p-6';

  async function loadLedger() {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`/api/ledger/accounts/${encodeURIComponent(accountName)}/ledger?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load ledger');

      const data = await response.json();
      entries = data.entries || [];
      balance = data.closing_balance || 0;
      render();
    } catch (error) {
      console.error('Error loading ledger:', error);
      showError('Failed to load ledger');
    }
  }

  function render() {
    container.innerHTML = `
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">${accountName}</h1>
            <p class="text-gray-600 mt-1">Account Ledger</p>
          </div>
          <button data-action="export-pdf" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Export PDF
          </button>
        </div>

        <!-- Date Filters -->
        <div class="bg-white rounded-lg shadow p-4 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" data-action="set-start-date" value="${startDate}"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" data-action="set-end-date" value="${endDate}"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
            <div class="flex items-end">
              <button data-action="load-ledger"
                      class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Load Ledger
              </button>
            </div>
          </div>
        </div>

        <!-- Ledger Table -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Particulars</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voucher Type</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${entries.map(entry => `
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">${new Date(entry.entry_date).toLocaleDateString('en-IN')}</td>
                  <td class="px-6 py-4 text-sm">${entry.particulars}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="px-2 py-1 text-xs rounded ${
                      entry.voucher_type === 'PAYMENT' ? 'bg-red-100 text-red-800' :
                      entry.voucher_type === 'RECEIPT' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }">${entry.voucher_type}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                    ${entry.debit_amount > 0 ? `₹${entry.debit_amount.toFixed(2)}` : '-'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                    ${entry.credit_amount > 0 ? `₹${entry.credit_amount.toFixed(2)}` : '-'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                    ₹${entry.running_balance.toFixed(2)} ${entry.balance_type}
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot class="bg-gray-50">
              <tr>
                <td colspan="5" class="px-6 py-4 text-right font-bold text-lg">Closing Balance:</td>
                <td class="px-6 py-4 text-right font-bold text-lg text-blue-600">₹${balance.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;

    setupEventListeners();
  }

  function setupEventListeners() {
    container.addEventListener('change', (e) => {
      if (e.target.dataset.action === 'set-start-date') {
        startDate = e.target.value;
      } else if (e.target.dataset.action === 'set-end-date') {
        endDate = e.target.value;
      }
    });

    container.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="load-ledger"]')) {
        loadLedger();
      } else if (e.target.closest('[data-action="export-pdf"]')) {
        window.print();
      }
    });
  }

  loadLedger();

  return container;
}
