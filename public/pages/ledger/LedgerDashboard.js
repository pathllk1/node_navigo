/**
 * Ledger Dashboard
 * Manages chart of accounts and ledger entries
 */

import { DataTable, setupDataTableListeners } from '../../components/common/DataTable.js';
import { showSuccess, showError } from '../../components/common/Toast.js';

export function LedgerDashboard() {
  let currentPage = 1;
  let currentGroup = 'ALL';
  let sortColumn = 'account_name';
  let sortDirection = 'ASC';
  let accounts = [];
  let pagination = {};

  const container = document.createElement('div');
  container.className = 'ledger-dashboard p-6';

  async function loadAccounts() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/ledger/accounts?group=${currentGroup}&page=${currentPage}&sortBy=${sortColumn}&sortOrder=${sortDirection}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to load accounts');

      const data = await response.json();
      
      // Handle both array and object responses
      if (Array.isArray(data)) {
        accounts = data;
        pagination = { total: data.length, totalPages: 1, currentPage: 1 };
      } else {
        accounts = data.accounts || [];
        pagination = data.pagination || { total: 0, totalPages: 1, currentPage: 1 };
      }
      
      render();
    } catch (error) {
      console.error('Error loading accounts:', error);
      showError('Failed to load accounts');
    }
  }

  function render() {
    container.innerHTML = `
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Ledger Management</h1>
            <p class="text-gray-600 mt-1">Chart of accounts and ledger entries</p>
          </div>
          <div class="flex gap-2">
            <button 
              data-action="view-trial-balance"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Trial Balance
            </button>
            <button 
              data-action="add-account"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              New Account
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="text-sm text-blue-600 font-medium">Total Accounts</div>
            <div class="text-2xl font-bold text-blue-900 mt-1">${pagination.total || 0}</div>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="text-sm text-green-600 font-medium">Assets</div>
            <div class="text-2xl font-bold text-green-900 mt-1">${accounts.filter(a => a.group === 'ASSETS').length}</div>
          </div>
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div class="text-sm text-purple-600 font-medium">Liabilities</div>
            <div class="text-2xl font-bold text-purple-900 mt-1">${accounts.filter(a => a.group === 'LIABILITIES').length}</div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Account Group</label>
              <select 
                data-action="filter-group"
                class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="ALL">All Groups</option>
                <option value="ASSETS">Assets</option>
                <option value="LIABILITIES">Liabilities</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSES">Expenses</option>
                <option value="EQUITY">Equity</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input 
                type="text"
                data-action="search-accounts"
                placeholder="Search by account name..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow">
          ${renderAccountsTable()}
        </div>
      </div>
    `;

    setupEventListeners();
  }

  function renderAccountsTable() {
    const columns = [
      { key: 'account_name', label: 'Account Name', sortable: true },
      { key: 'group', label: 'Group', sortable: true },
      { key: 'sub_group', label: 'Sub Group', sortable: true },
      { key: 'opening_balance', label: 'Opening Balance', sortable: false, render: (row) => `₹${(row.opening_balance || 0).toFixed(2)}` },
      { key: 'current_balance', label: 'Current Balance', sortable: false, render: (row) => `₹${(row.current_balance || 0).toFixed(2)}` },
      { key: 'actions', label: 'Actions', sortable: false, render: (row) => `
        <div class="flex gap-2">
          <button data-action="view-ledger" data-name="${row.account_name}" class="text-blue-600 hover:text-blue-800" title="View Ledger">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </button>
          <button data-action="edit-account" data-name="${row.account_name}" class="text-green-600 hover:text-green-800" title="Edit">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
        </div>
      `}
    ];

    return DataTable({
      columns,
      data: accounts,
      currentPage,
      totalPages: pagination.totalPages || 1,
      sortColumn,
      sortDirection: sortDirection.toLowerCase(),
      emptyMessage: 'No accounts found. Click "New Account" to create one.'
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
        loadAccounts();
      },
      onPageChange: (page) => {
        currentPage = page;
        loadAccounts();
      }
    });

    container.addEventListener('change', (e) => {
      if (e.target.dataset.action === 'filter-group') {
        currentGroup = e.target.value;
        currentPage = 1;
        loadAccounts();
      }
    });

    container.addEventListener('click', async (e) => {
      const addBtn = e.target.closest('[data-action="add-account"]');
      const viewBtn = e.target.closest('[data-action="view-ledger"]');
      const editBtn = e.target.closest('[data-action="edit-account"]');
      const trialBtn = e.target.closest('[data-action="view-trial-balance"]');

      if (addBtn) {
        window.router.navigate('/ledger/accounts/new');
      } else if (viewBtn) {
        window.router.navigate(`/ledger/accounts/${encodeURIComponent(viewBtn.dataset.name)}/ledger`);
      } else if (editBtn) {
        window.router.navigate(`/ledger/accounts/${encodeURIComponent(editBtn.dataset.name)}/edit`);
      } else if (trialBtn) {
        window.router.navigate('/ledger/trial-balance');
      }
    });
  }

  loadAccounts();

  return container;
}
