/**
 * Reports Dashboard
 * Access to all business reports and analytics
 */

import { showSuccess, showError } from '../../components/common/Toast.js';

export function ReportsDashboard() {
  const container = document.createElement('div');
  container.className = 'reports-dashboard p-6';

  function render() {
    container.innerHTML = `
      <div class="max-w-7xl mx-auto">
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p class="text-gray-600 mt-1">Access all business reports and insights</p>
        </div>

        <!-- Sales Reports -->
        <div class="mb-6">
          <h2 class="text-xl font-bold text-gray-800 mb-3">📊 Sales Reports</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${renderReportCard('Sales Summary', 'View overall sales performance', 'sales-summary', 'blue')}
            ${renderReportCard('Sales by Party', 'Party-wise sales analysis', 'sales-by-party', 'blue')}
            ${renderReportCard('Sales by Item', 'Item-wise sales breakdown', 'sales-by-item', 'blue')}
            ${renderReportCard('Sales by Month', 'Monthly sales trends', 'sales-by-month', 'blue')}
            ${renderReportCard('Outstanding Sales', 'Pending receivables', 'sales-outstanding', 'yellow')}
          </div>
        </div>

        <!-- Purchase Reports -->
        <div class="mb-6">
          <h2 class="text-xl font-bold text-gray-800 mb-3">🛒 Purchase Reports</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${renderReportCard('Purchase Summary', 'View overall purchase performance', 'purchase-summary', 'purple')}
            ${renderReportCard('Purchase by Party', 'Supplier-wise purchase analysis', 'purchase-by-party', 'purple')}
            ${renderReportCard('Purchase by Item', 'Item-wise purchase breakdown', 'purchase-by-item', 'purple')}
            ${renderReportCard('Purchase by Month', 'Monthly purchase trends', 'purchase-by-month', 'purple')}
            ${renderReportCard('Outstanding Purchase', 'Pending payables', 'purchase-outstanding', 'red')}
          </div>
        </div>

        <!-- Stock Reports -->
        <div class="mb-6">
          <h2 class="text-xl font-bold text-gray-800 mb-3">📦 Stock Reports</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${renderReportCard('Stock Summary', 'Current stock overview', 'stock-summary', 'green')}
            ${renderReportCard('Stock Valuation', 'Stock value analysis', 'stock-valuation', 'green')}
            ${renderReportCard('Stock Movements', 'Stock in/out transactions', 'stock-movements', 'green')}
            ${renderReportCard('Low Stock Items', 'Items below minimum level', 'low-stock', 'yellow')}
            ${renderReportCard('Stock Aging', 'Slow-moving stock analysis', 'stock-aging', 'orange')}
          </div>
        </div>

        <!-- Party Reports -->
        <div class="mb-6">
          <h2 class="text-xl font-bold text-gray-800 mb-3">👥 Party Reports</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${renderReportCard('Debtors Report', 'Customer outstanding', 'debtors', 'blue')}
            ${renderReportCard('Creditors Report', 'Supplier outstanding', 'creditors', 'red')}
            ${renderReportCard('Party Aging', 'Age-wise outstanding', 'party-aging', 'yellow')}
          </div>
        </div>

        <!-- GST Reports -->
        <div class="mb-6">
          <h2 class="text-xl font-bold text-gray-800 mb-3">📋 GST Reports</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${renderReportCard('GST Summary', 'Overall GST overview', 'gst-summary', 'indigo')}
            ${renderReportCard('GST Sales Report', 'GST on sales', 'gst-sales', 'indigo')}
            ${renderReportCard('GST Purchase Report', 'GST on purchases', 'gst-purchase', 'indigo')}
            ${renderReportCard('GSTR-1', 'Outward supplies return', 'gstr1', 'indigo')}
            ${renderReportCard('GSTR-3B', 'Monthly return summary', 'gstr3b', 'indigo')}
          </div>
        </div>

        <!-- Financial Reports -->
        <div class="mb-6">
          <h2 class="text-xl font-bold text-gray-800 mb-3">💰 Financial Reports</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${renderReportCard('Profit & Loss', 'Income statement', 'profit-loss', 'green')}
            ${renderReportCard('Balance Sheet', 'Financial position', 'balance-sheet', 'blue')}
            ${renderReportCard('Cash Flow', 'Cash movement analysis', 'cash-flow', 'purple')}
            ${renderReportCard('Trial Balance', 'Account balances', 'trial-balance', 'gray')}
          </div>
        </div>
      </div>
    `;

    setupEventListeners();
  }

  function renderReportCard(title, description, reportType, color) {
    return `
      <div class="bg-white border border-${color}-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
           data-action="view-report" data-report="${reportType}">
        <h3 class="text-lg font-semibold text-${color}-900">${title}</h3>
        <p class="text-sm text-gray-600 mt-1">${description}</p>
        <div class="mt-3 flex items-center text-${color}-600">
          <span class="text-sm font-medium">View Report</span>
          <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    `;
  }

  function setupEventListeners() {
    container.addEventListener('click', (e) => {
      const reportCard = e.target.closest('[data-action="view-report"]');
      if (reportCard) {
        const reportType = reportCard.dataset.report;
        window.router.navigate(`/reports/${reportType}`);
      }
    });
  }

  render();

  return container;
}
