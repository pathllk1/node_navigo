/**
 * Sales Summary Report
 */

import { showError } from '../../components/common/Toast.js';

export function SalesSummaryReport() {
  let reportData = null;
  let startDate = '';
  let endDate = '';

  const container = document.createElement('div');
  container.className = 'report-page p-6';

  async function loadReport() {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`/api/reports/sales/summary?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load report');

      reportData = await response.json();
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
            <h1 class="text-3xl font-bold text-gray-900">Sales Summary Report</h1>
            <p class="text-gray-600 mt-1">Overall sales performance analysis</p>
          </div>
          <div class="flex gap-2">
            <button data-action="export-pdf" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Export PDF
            </button>
            <button data-action="export-excel" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Export Excel
            </button>
          </div>
        </div>

        <!-- Filters -->
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
              <button data-action="load-report"
                      class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Generate Report
              </button>
            </div>
          </div>
        </div>

        ${reportData ? renderReportContent() : '<div class="text-center py-12 text-gray-500">Click "Generate Report" to view data</div>'}
      </div>
    `;

    setupEventListeners();
  }

  function renderReportContent() {
    return `
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="text-sm text-blue-600 font-medium">Total Sales</div>
          <div class="text-2xl font-bold text-blue-900 mt-1">₹${(reportData.total_sales || 0).toFixed(2)}</div>
        </div>
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="text-sm text-green-600 font-medium">Total Bills</div>
          <div class="text-2xl font-bold text-green-900 mt-1">${reportData.total_bills || 0}</div>
        </div>
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div class="text-sm text-purple-600 font-medium">Avg Bill Value</div>
          <div class="text-2xl font-bold text-purple-900 mt-1">₹${(reportData.avg_bill_value || 0).toFixed(2)}</div>
        </div>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="text-sm text-yellow-600 font-medium">Outstanding</div>
          <div class="text-2xl font-bold text-yellow-900 mt-1">₹${(reportData.outstanding || 0).toFixed(2)}</div>
        </div>
      </div>

      <!-- Detailed Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bills</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${(reportData.details || []).map(row => `
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm">${row.period}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">${row.bill_count}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">₹${row.total_amount.toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">₹${row.paid_amount.toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">₹${row.pending_amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
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
      if (e.target.closest('[data-action="load-report"]')) {
        loadReport();
      } else if (e.target.closest('[data-action="export-pdf"]')) {
        window.print();
      } else if (e.target.closest('[data-action="export-excel"]')) {
        exportToExcel();
      }
    });
  }

  function exportToExcel() {
    // Implementation for Excel export
    console.log('Export to Excel');
  }

  render();

  return container;
}
