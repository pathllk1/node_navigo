/**
 * Trial Balance Report
 */

import { showError } from '../../components/common/Toast.js';

export function TrialBalanceReport() {
  let reportData = [];
  let totals = { debit: 0, credit: 0 };
  let asOfDate = new Date().toISOString().split('T')[0];

  const container = document.createElement('div');
  container.className = 'report-page p-6';

  async function loadReport() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ledger/trial-balance?as_of_date=${asOfDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load report');

      const data = await response.json();
      reportData = data.accounts || [];
      totals = data.totals || { debit: 0, credit: 0 };
      render();
    } catch (error) {
      console.error('Error loading report:', error);
      showError('Failed to load report');
    }
  }

  function render() {
    container.innerHTML = `
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Trial Balance</h1>
            <p class="text-gray-600 mt-1">Account balances as of date</p>
          </div>
          <button data-action="export-pdf" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Export PDF
          </button>
        </div>

        <!-- Date Filter -->
        <div class="bg-white rounded-lg shadow p-4 mb-6">
          <div class="flex items-center gap-4">
            <label class="text-sm font-medium text-gray-700">As of Date:</label>
            <input type="date" data-action="set-date" value="${asOfDate}"
                   class="px-3 py-2 border border-gray-300 rounded-md">
            <button data-action="load-report"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Generate
            </button>
          </div>
        </div>

        <!-- Trial Balance Table -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit (₹)</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit (₹)</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${reportData.map(account => `
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${account.account_name}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">${account.group}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                    ${account.balance_type === 'Dr' ? account.balance.toFixed(2) : '-'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                    ${account.balance_type === 'Cr' ? account.balance.toFixed(2) : '-'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot class="bg-gray-100">
              <tr>
                <td colspan="2" class="px-6 py-4 text-right font-bold text-lg">Total:</td>
                <td class="px-6 py-4 text-right font-bold text-lg text-blue-600">₹${totals.debit.toFixed(2)}</td>
                <td class="px-6 py-4 text-right font-bold text-lg text-green-600">₹${totals.credit.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="2" class="px-6 py-4 text-right font-bold">Difference:</td>
                <td colspan="2" class="px-6 py-4 text-right font-bold ${Math.abs(totals.debit - totals.credit) < 0.01 ? 'text-green-600' : 'text-red-600'}">
                  ₹${Math.abs(totals.debit - totals.credit).toFixed(2)}
                  ${Math.abs(totals.debit - totals.credit) < 0.01 ? '✓ Balanced' : '⚠ Not Balanced'}
                </td>
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
      if (e.target.dataset.action === 'set-date') {
        asOfDate = e.target.value;
      }
    });

    container.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="load-report"]')) {
        loadReport();
      } else if (e.target.closest('[data-action="export-pdf"]')) {
        window.print();
      }
    });
  }

  loadReport();

  return container;
}
