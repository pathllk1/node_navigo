/**
 * Sales Dashboard
 * Manages sales bills, credit notes, and delivery notes
 */

import { DataTable, setupDataTableListeners } from '../../components/common/DataTable.js';
import { Modal, showModal, hideModal, setupModalListeners, showConfirm } from '../../components/common/Modal.js';
import { showSuccess, showError } from '../../components/common/Toast.js';

export function SalesDashboard() {
  let currentPage = 1;
  let currentStatus = 'ALL';
  let sortColumn = 'bill_date';
  let sortDirection = 'DESC';
  let bills = [];
  let pagination = {};
  let summary = {};

  const container = document.createElement('div');
  container.className = 'sales-dashboard p-6';

  async function loadBills() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/sales?status=${currentStatus}&page=${currentPage}&sortBy=${sortColumn}&sortOrder=${sortDirection}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to load sales bills');

      const data = await response.json();
      bills = data.bills;
      pagination = data.pagination;
      render();
    } catch (error) {
      console.error('Error loading bills:', error);
      showError('Failed to load sales bills');
    }
  }

  async function loadSummary() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sales/reports/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load summary');

      summary = await response.json();
      render();
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  }

  function render() {
    container.innerHTML = `
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Sales Management</h1>
            <p class="text-gray-600 mt-1">Manage sales bills and invoices</p>
          </div>
          <div class="flex gap-2">
            <button 
              data-action="add-delivery-note"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Delivery Note
            </button>
            <button 
              data-action="add-bill"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              New Sales Bill
            </button>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          ${renderStatsCards()}
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg shadow p-4 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                data-action="filter-status"
                class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="ALL">All</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
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
                data-action="search-bills"
                placeholder="Search by bill no, party..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
          </div>
        </div>

        <!-- Bills Table -->
        <div class="bg-white rounded-lg shadow">
          ${renderBillsTable()}
        </div>
      </div>
    `;

    setupEventListeners();
  }

  function renderStatsCards() {
    return `
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="text-sm text-blue-600 font-medium">Total Sales</div>
        <div class="text-2xl font-bold text-blue-900 mt-1">₹${(summary.total_sales || 0).toFixed(2)}</div>
      </div>
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="text-sm text-green-600 font-medium">Paid</div>
        <div class="text-2xl font-bold text-green-900 mt-1">₹${(summary.paid_amount || 0).toFixed(2)}</div>
      </div>
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div class="text-sm text-yellow-600 font-medium">Pending</div>
        <div class="text-2xl font-bold text-yellow-900 mt-1">₹${(summary.pending_amount || 0).toFixed(2)}</div>
      </div>
      <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div class="text-sm text-purple-600 font-medium">Total Bills</div>
        <div class="text-2xl font-bold text-purple-900 mt-1">${summary.total_bills || 0}</div>
      </div>
    `;
  }

  function renderBillsTable() {
    const columns = [
      { key: 'bill_no', label: 'Bill No', sortable: true },
      { key: 'bill_date', label: 'Date', sortable: true, render: (row) => new Date(row.bill_date).toLocaleDateString('en-IN') },
      { key: 'party_name', label: 'Party', sortable: true },
      { key: 'total_amount', label: 'Amount', sortable: true, render: (row) => `₹${row.total_amount.toFixed(2)}` },
      { key: 'paid_amount', label: 'Paid', sortable: false, render: (row) => `₹${(row.paid_amount || 0).toFixed(2)}` },
      { key: 'balance', label: 'Balance', sortable: false, render: (row) => `₹${(row.total_amount - (row.paid_amount || 0)).toFixed(2)}` },
      { key: 'status', label: 'Status', sortable: true, render: (row) => {
        const colors = { DRAFT: 'gray', PENDING: 'yellow', PAID: 'green', CANCELLED: 'red' };
        const color = colors[row.status] || 'gray';
        return `<span class="px-2 py-1 text-xs font-medium bg-${color}-100 text-${color}-800 rounded">${row.status}</span>`;
      }},
      { key: 'actions', label: 'Actions', sortable: false, render: (row) => `
        <div class="flex gap-2">
          <button data-action="view-bill" data-id="${row.id}" class="text-blue-600 hover:text-blue-800" title="View">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
          <button data-action="edit-bill" data-id="${row.id}" class="text-green-600 hover:text-green-800" title="Edit">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button data-action="print-bill" data-id="${row.id}" class="text-purple-600 hover:text-purple-800" title="Print">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
          </button>
          <button data-action="delete-bill" data-id="${row.id}" class="text-red-600 hover:text-red-800" title="Delete">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      `}
    ];

    return DataTable({
      columns,
      data: bills,
      currentPage,
      totalPages: pagination.totalPages || 1,
      sortColumn,
      sortDirection: sortDirection.toLowerCase(),
      emptyMessage: 'No sales bills found. Click "New Sales Bill" to create one.'
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
        loadBills();
      },
      onPageChange: (page) => {
        currentPage = page;
        loadBills();
      }
    });

    container.addEventListener('change', (e) => {
      if (e.target.dataset.action === 'filter-status') {
        currentStatus = e.target.value;
        currentPage = 1;
        loadBills();
      }
    });

    container.addEventListener('click', async (e) => {
      const addBtn = e.target.closest('[data-action="add-bill"]');
      const viewBtn = e.target.closest('[data-action="view-bill"]');
      const editBtn = e.target.closest('[data-action="edit-bill"]');
      const deleteBtn = e.target.closest('[data-action="delete-bill"]');
      const printBtn = e.target.closest('[data-action="print-bill"]');

      if (addBtn) {
        window.router.navigate('/sales/new');
      } else if (viewBtn) {
        window.router.navigate(`/sales/${viewBtn.dataset.id}`);
      } else if (editBtn) {
        window.router.navigate(`/sales/${editBtn.dataset.id}/edit`);
      } else if (printBtn) {
        window.open(`/api/sales/${printBtn.dataset.id}/pdf`, '_blank');
      } else if (deleteBtn) {
        deleteBill(deleteBtn.dataset.id);
      }
    });
  }

  async function deleteBill(billId) {
    showConfirm({
      title: 'Delete Sales Bill',
      message: 'Are you sure you want to delete this bill? This will reverse stock and ledger entries.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/sales/${billId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!response.ok) throw new Error('Failed to delete bill');

          showSuccess('Bill deleted successfully');
          loadBills();
          loadSummary();
        } catch (error) {
          console.error('Error deleting bill:', error);
          showError(error.message);
        }
      }
    });
  }

  loadBills();
  loadSummary();

  return container;
}
