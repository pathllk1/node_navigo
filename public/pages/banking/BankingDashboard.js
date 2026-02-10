/**
 * Banking Dashboard
 * Manages bank accounts and transactions
 */

import { DataTable, setupDataTableListeners } from '../../components/common/DataTable.js';
import { showSuccess, showError } from '../../components/common/Toast.js';

export function BankingDashboard() {
  let currentPage = 1;
  let currentAccount = 'ALL';
  let sortColumn = 'transaction_date';
  let sortDirection = 'DESC';
  let transactions = [];
  let accounts = [];
  let pagination = {};

  const container = document.createElement('div');
  container.className = 'banking-dashboard p-6';

  async function loadAccounts() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/banking/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load accounts');

      accounts = await response.json();
      render();
    } catch (error) {
      console.error('Error loading accounts:', error);
      showError('Failed to load bank accounts');
    }
  }

  async function loadTransactions() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/banking/transactions?account=${currentAccount}&page=${currentPage}&sortBy=${sortColumn}&sortOrder=${sortDirection}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to load transactions');

      const data = await response.json();
      
      // Handle both array and object responses
      if (Array.isArray(data)) {
        transactions = data;
        pagination = { total: data.length, totalPages: 1, currentPage: 1 };
      } else {
        transactions = data.transactions || [];
        pagination = data.pagination || { total: 0, totalPages: 1, currentPage: 1 };
      }
      
      render();
    } catch (error) {
      console.error('Error loading transactions:', error);
      showError('Failed to load transactions');
    }
  }

  function render() {
    container.innerHTML = `
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Banking Management</h1>
            <p class="text-gray-600 mt-1">Manage bank accounts and transactions</p>
          </div>
          <div class="flex gap-2">
            <button 
              data-action="add-account"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              New Bank Account
            </button>
            <button 
              data-action="add-transaction"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              New Transaction
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          ${renderAccountCards()}
        </div>

        <div class="bg-white rounded-lg shadow p-4 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
              <select 
                data-action="filter-account"
                class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="ALL">All Accounts</option>
                ${accounts.map(acc => `<option value="${acc.id}">${acc.account_name} - ${acc.account_number}</option>`).join('')}
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
                data-action="search-transactions"
                placeholder="Search by reference..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow">
          ${renderTransactionsTable()}
        </div>
      </div>
    `;

    setupEventListeners();
  }

  function renderAccountCards() {
    if (accounts.length === 0) {
      return `
        <div class="col-span-4 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p class="text-gray-600">No bank accounts found. Create one to get started.</p>
        </div>
      `;
    }

    return accounts.slice(0, 4).map(acc => `
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="text-sm text-blue-600 font-medium">${acc.account_name}</div>
        <div class="text-xs text-gray-600 mt-1">${acc.account_number}</div>
        <div class="text-2xl font-bold text-blue-900 mt-2">₹${(acc.current_balance || 0).toFixed(2)}</div>
      </div>
    `).join('');
  }

  function renderTransactionsTable() {
    const columns = [
      { key: 'transaction_date', label: 'Date', sortable: true, render: (row) => new Date(row.transaction_date).toLocaleDateString('en-IN') },
      { key: 'account_name', label: 'Account', sortable: false },
      { key: 'transaction_type', label: 'Type', sortable: true, render: (row) => {
        const color = row.transaction_type === 'DEPOSIT' ? 'green' : 'red';
        return `<span class="px-2 py-1 text-xs font-medium bg-${color}-100 text-${color}-800 rounded">${row.transaction_type}</span>`;
      }},
      { key: 'amount', label: 'Amount', sortable: true, render: (row) => `₹${row.amount.toFixed(2)}` },
      { key: 'reference_no', label: 'Reference', sortable: false },
      { key: 'description', label: 'Description', sortable: false },
      { key: 'actions', label: 'Actions', sortable: false, render: (row) => `
        <div class="flex gap-2">
          <button data-action="edit-transaction" data-id="${row.id}" class="text-green-600 hover:text-green-800" title="Edit">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button data-action="delete-transaction" data-id="${row.id}" class="text-red-600 hover:text-red-800" title="Delete">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      `}
    ];

    return DataTable({
      columns,
      data: transactions,
      currentPage,
      totalPages: pagination.totalPages || 1,
      sortColumn,
      sortDirection: sortDirection.toLowerCase(),
      emptyMessage: 'No transactions found.'
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
        loadTransactions();
      },
      onPageChange: (page) => {
        currentPage = page;
        loadTransactions();
      }
    });

    container.addEventListener('change', (e) => {
      if (e.target.dataset.action === 'filter-account') {
        currentAccount = e.target.value;
        currentPage = 1;
        loadTransactions();
      }
    });

    container.addEventListener('click', async (e) => {
      const addAccountBtn = e.target.closest('[data-action="add-account"]');
      const addTransactionBtn = e.target.closest('[data-action="add-transaction"]');
      const editBtn = e.target.closest('[data-action="edit-transaction"]');
      const deleteBtn = e.target.closest('[data-action="delete-transaction"]');

      if (addAccountBtn) {
        window.router.navigate('/banking/accounts/new');
      } else if (addTransactionBtn) {
        window.router.navigate('/banking/transactions/new');
      } else if (editBtn) {
        window.router.navigate(`/banking/transactions/${editBtn.dataset.id}/edit`);
      } else if (deleteBtn) {
        deleteTransaction(deleteBtn.dataset.id);
      }
    });
  }

  async function deleteTransaction(transactionId) {
    const confirmed = confirm('Are you sure you want to delete this transaction?');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/banking/transactions/${transactionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete transaction');

      showSuccess('Transaction deleted successfully');
      loadTransactions();
      loadAccounts();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showError(error.message);
    }
  }

  loadAccounts();
  loadTransactions();

  return container;
}
