/**
 * Vouchers Dashboard
 * Manages payment, receipt, and journal vouchers
 */

import { DataTable, setupDataTableListeners } from '../../components/common/DataTable.js';
import { showSuccess, showError } from '../../components/common/Toast.js';

export function VouchersDashboard() {
  let currentPage = 1;
  let currentType = 'ALL';
  let sortColumn = 'voucher_date';
  let sortDirection = 'DESC';
  let vouchers = [];
  let pagination = {};
  let summary = {};

  const container = document.createElement('div');
  container.className = 'vouchers-dashboard p-6';

  async function loadVouchers() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/vouchers?type=${currentType}&page=${currentPage}&sortBy=${sortColumn}&sortOrder=${sortDirection}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to load vouchers');

      const data = await response.json();
      
      // Handle both array and object responses
      if (Array.isArray(data)) {
        vouchers = data;
        pagination = { total: data.length, totalPages: 1, currentPage: 1 };
      } else {
        vouchers = data.vouchers || [];
        pagination = data.pagination || { total: 0, totalPages: 1, currentPage: 1 };
      }
      
      render();
    } catch (error) {
      console.error('Error loading vouchers:', error);
      showError('Failed to load vouchers');
    }
  }

  async function loadSummary() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/vouchers/reports/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load summary');

      summary = await response.json();
      render();
    } catch (error) {
      console.error('Error loading summary:', error);
      // Set default summary if API fails
      summary = {
        total_vouchers: 0,
        total_payments: 0,
        total_receipts: 0,
        total_journals: 0
      };
    }
  }

  function render() {
    container.innerHTML = `
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Vouchers Management</h1>
            <p class="text-gray-600 mt-1">Payment, Receipt, and Journal vouchers</p>
          </div>
          <div class="flex gap-2">
            <button 
              data-action="add-payment"
              class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Payment
            </button>
            <button 
              data-action="add-receipt"
              class="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Receipt
            </button>
            <button 
              data-action="add-journal"
              class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Journal
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          ${renderStatsCards()}
        </div>

        <div class="bg-white rounded-lg shadow p-4 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Voucher Type</label>
              <select 
                data-action="filter-type"
                class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="ALL">All Types</option>
                <option value="PAYMENT">Payment</option>
                <option value="RECEIPT">Receipt</option>
                <option value="JOURNAL">Journal</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <input 
                type="date"
                data-action="filter-date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input 
                type="text"
                data-action="search-vouchers"
                placeholder="Search by voucher no..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow">
          ${renderVouchersTable()}
        </div>
      </div>
    `;

    setupEventListeners();
  }

  function renderStatsCards() {
    return `
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="text-sm text-blue-600 font-medium">Total Vouchers</div>
        <div class="text-2xl font-bold text-blue-900 mt-1">${summary.total_vouchers || 0}</div>
      </div>
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="text-sm text-red-600 font-medium">Payments</div>
        <div class="text-2xl font-bold text-red-900 mt-1">₹${(summary.total_payments || 0).toFixed(2)}</div>
      </div>
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="text-sm text-green-600 font-medium">Receipts</div>
        <div class="text-2xl font-bold text-green-900 mt-1">₹${(summary.total_receipts || 0).toFixed(2)}</div>
      </div>
      <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div class="text-sm text-purple-600 font-medium">Journal Entries</div>
        <div class="text-2xl font-bold text-purple-900 mt-1">${summary.total_journals || 0}</div>
      </div>
    `;
  }

  function renderVouchersTable() {
    const columns = [
      { key: 'voucher_no', label: 'Voucher No', sortable: true },
      { key: 'voucher_type', label: 'Type', sortable: true, render: (row) => {
        const colors = { PAYMENT: 'red', RECEIPT: 'green', JOURNAL: 'blue' };
        const color = colors[row.voucher_type] || 'gray';
        return `<span class="px-2 py-1 text-xs font-medium bg-${color}-100 text-${color}-800 rounded">${row.voucher_type}</span>`;
      }},
      { key: 'voucher_date', label: 'Date', sortable: true, render: (row) => new Date(row.voucher_date).toLocaleDateString('en-IN') },
      { key: 'account_name', label: 'Account', sortable: false },
      { key: 'amount', label: 'Amount', sortable: true, render: (row) => `₹${row.amount.toFixed(2)}` },
      { key: 'narration', label: 'Narration', sortable: false, render: (row) => row.narration || '-' },
      { key: 'actions', label: 'Actions', sortable: false, render: (row) => `
        <div class="flex gap-2">
          <button data-action="view-voucher" data-type="${row.voucher_type}" data-id="${row.id}" class="text-blue-600 hover:text-blue-800" title="View">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
          <button data-action="edit-voucher" data-type="${row.voucher_type}" data-id="${row.id}" class="text-green-600 hover:text-green-800" title="Edit">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button data-action="delete-voucher" data-type="${row.voucher_type}" data-id="${row.id}" class="text-red-600 hover:text-red-800" title="Delete">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      `}
    ];

    return DataTable({
      columns,
      data: vouchers,
      currentPage,
      totalPages: pagination.totalPages || 1,
      sortColumn,
      sortDirection: sortDirection.toLowerCase(),
      emptyMessage: 'No vouchers found. Create a new voucher using the buttons above.'
    });
  }

  function setupEventListeners() {
    setupDataTableListeners(container, {
      onSort: (column) => {
        if (sortColumn === column) {
          sortDirection = sortDirection === 'ASC' ? 'DESC' : 'ASC';
        } else {
          sortColumn = column;
          sortDirection = 'ASC';
        }
        loadVouchers();
      },
      onPageChange: (page) => {
        currentPage = page;
        loadVouchers();
      }
    });

    container.addEventListener('change', (e) => {
      if (e.target.dataset.action === 'filter-type') {
        currentType = e.target.value;
        currentPage = 1;
        loadVouchers();
      }
    });

    container.addEventListener('click', async (e) => {
      const addPaymentBtn = e.target.closest('[data-action="add-payment"]');
      const addReceiptBtn = e.target.closest('[data-action="add-receipt"]');
      const addJournalBtn = e.target.closest('[data-action="add-journal"]');
      const viewBtn = e.target.closest('[data-action="view-voucher"]');
      const editBtn = e.target.closest('[data-action="edit-voucher"]');
      const deleteBtn = e.target.closest('[data-action="delete-voucher"]');

      if (addPaymentBtn) {
        window.router.navigate('/vouchers/payment/new');
      } else if (addReceiptBtn) {
        window.router.navigate('/vouchers/receipt/new');
      } else if (addJournalBtn) {
        window.router.navigate('/vouchers/journal/new');
      } else if (viewBtn) {
        const type = viewBtn.dataset.type.toLowerCase();
        window.router.navigate(`/vouchers/${type}/${viewBtn.dataset.id}`);
      } else if (editBtn) {
        const type = editBtn.dataset.type.toLowerCase();
        window.router.navigate(`/vouchers/${type}/${editBtn.dataset.id}/edit`);
      } else if (deleteBtn) {
        deleteVoucher(deleteBtn.dataset.type, deleteBtn.dataset.id);
      }
    });
  }

  async function deleteVoucher(type, voucherId) {
    const confirmed = confirm('Are you sure you want to delete this voucher? This will reverse ledger entries.');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/vouchers/${type.toLowerCase()}/${voucherId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete voucher');

      showSuccess('Voucher deleted successfully');
      loadVouchers();
      loadSummary();
    } catch (error) {
      console.error('Error deleting voucher:', error);
      showError(error.message);
    }
  }

  loadVouchers();
  loadSummary();

  return container;
}
