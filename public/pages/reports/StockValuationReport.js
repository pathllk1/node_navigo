/**
 * Stock Valuation Report
 */

import { showError } from '../../components/common/Toast.js';

export function StockValuationReport() {
  let reportData = [];
  let summary = {};

  const container = document.createElement('div');
  container.className = 'report-page p-6';

  async function loadReport() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports/stock/valuation', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load report');

      const data = await response.json();
      reportData = data.items || [];
      summary = data.summary || {};
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
            <h1 class="text-3xl font-bold text-gray-900">Stock Valuation Report</h1>
            <p class="text-gray-600 mt-1">Current stock value analysis</p>
          </div>
          <button data-action="export-excel" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Export Excel
          </button>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="text-sm text-blue-600 font-medium">Total Items</div>
            <div class="text-2xl font-bold text-blue-900 mt-1">${summary.total_items || 0}</div>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="text-sm text-green-600 font-medium">Total Quantity</div>
            <div class="text-2xl font-bold text-green-900 mt-1">${summary.total_quantity || 0}</div>
          </div>
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div class="text-sm text-purple-600 font-medium">Total Value</div>
            <div class="text-2xl font-bold text-purple-900 mt-1">₹${(summary.total_value || 0).toFixed(2)}</div>
          </div>
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="text-sm text-yellow-600 font-medium">Avg Value/Item</div>
            <div class="text-2xl font-bold text-yellow-900 mt-1">₹${(summary.avg_value || 0).toFixed(2)}</div>
          </div>
        </div>

        <!-- Stock Table -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${reportData.map(item => `
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${item.item_name}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">${item.category || '-'}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">${item.current_stock}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">${item.unit}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">₹${item.purchase_rate.toFixed(2)}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">₹${item.stock_value.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot class="bg-gray-50">
              <tr>
                <td colspan="5" class="px-6 py-4 text-right font-bold">Total Value:</td>
                <td class="px-6 py-4 font-bold text-lg text-blue-600">₹${(summary.total_value || 0).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;

    setupEventListeners();
  }

  function setupEventListeners() {
    container.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="export-excel"]')) {
        exportToExcel();
      }
    });
  }

  function exportToExcel() {
    console.log('Export to Excel');
  }

  loadReport();

  return container;
}
