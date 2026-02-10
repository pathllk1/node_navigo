/**
 * Stocks Dashboard
 * Manages inventory/stock items
 */

import { DataTable, setupDataTableListeners } from '../../components/common/DataTable.js';
import { Modal, showModal, hideModal, setupModalListeners, showConfirm } from '../../components/common/Modal.js';
import { showSuccess, showError } from '../../components/common/Toast.js';
import { StockForm } from '../../components/stocks/StockForm.js';

export function StocksDashboard() {
  let currentPage = 1;
  let currentCategory = '';
  let currentStatus = 'Active';
  let sortColumn = 'item_name';
  let sortDirection = 'ASC';
  let stocks = [];
  let pagination = {};
  let summary = {};

  const container = document.createElement('div');
  container.className = 'stocks-dashboard p-6';

  async function loadStocks() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/stocks?category=${currentCategory}&status=${currentStatus}&page=${currentPage}&sortBy=${sortColumn}&sortOrder=${sortDirection}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to load stocks');

      const data = await response.json();
      stocks = data.stocks;
      pagination = data.pagination;

      render();
    } catch (error) {
      console.error('Error loading stocks:', error);
      showError('Failed to load stocks');
    }
  }

  async function loadSummary() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stocks/reports/stock-summary', {
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
            <h1 class="text-3xl font-bold text-gray-900">Stock Management</h1>
            <p class="text-gray-600 mt-1">Manage inventory items and stock levels</p>
          </div>
          <div class="flex gap-2">
            <button 
              data-action="view-low-stock"
              class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500">
              <span class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                Low Stock
              </span>
            </button>
            <button 
              data-action="add-stock"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <span class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Add Stock Item
              </span>
            </button>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          ${renderStatsCards()}
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg shadow p-4 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Category Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input 
                type="text"
                data-action="filter-category"
                placeholder="Enter category..."
                value="${currentCategory}"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <!-- Status Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                data-action="filter-status"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="ALL" ${currentStatus === 'ALL' ? 'selected' : ''}>All</option>
                <option value="Active" ${currentStatus === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Inactive" ${currentStatus === 'Inactive' ? 'selected' : ''}>Inactive</option>
              </select>
            </div>

            <!-- Search -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input 
                type="text"
                data-action="search-stocks"
                placeholder="Search by name, code, HSN..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
        </div>

        <!-- Stocks Table -->
        <div class="bg-white rounded-lg shadow">
          ${renderStocksTable()}
        </div>
      </div>

      <!-- Add/Edit Stock Modal -->
      ${Modal({
        id: 'stock-modal',
        title: 'Add Stock Item',
        content: '<div id="stock-form-container"></div>',
        size: 'lg',
        primaryButton: 'Save',
        secondaryButton: 'Cancel'
      })}

      <!-- Low Stock Modal -->
      ${Modal({
        id: 'low-stock-modal',
        title: 'Low Stock Items',
        content: '<div id="low-stock-container"></div>',
        size: 'lg',
        primaryButton: null,
        secondaryButton: 'Close'
      })}
    `;

    setupEventListeners();
  }

  function renderStatsCards() {
    return `
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="text-sm text-blue-600 font-medium">Total Items</div>
        <div class="text-2xl font-bold text-blue-900 mt-1">${summary.total_items || 0}</div>
      </div>
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="text-sm text-green-600 font-medium">Total Value</div>
        <div class="text-2xl font-bold text-green-900 mt-1">₹${(summary.total_value || 0).toFixed(2)}</div>
      </div>
      <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div class="text-sm text-purple-600 font-medium">Active Items</div>
        <div class="text-2xl font-bold text-purple-900 mt-1">${summary.active_items || 0}</div>
      </div>
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div class="text-sm text-yellow-600 font-medium">Low Stock</div>
        <div class="text-2xl font-bold text-yellow-900 mt-1">${summary.low_stock_count || 0}</div>
      </div>
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="text-sm text-red-600 font-medium">Out of Stock</div>
        <div class="text-2xl font-bold text-red-900 mt-1">${summary.out_of_stock_count || 0}</div>
      </div>
    `;
  }

  function renderStocksTable() {
    const columns = [
      { key: 'item_name', label: 'Item Name', sortable: true },
      { key: 'item_code', label: 'Code', sortable: true },
      { key: 'hsn_code', label: 'HSN', sortable: false },
      { key: 'category', label: 'Category', sortable: true },
      { key: 'current_stock', label: 'Stock', sortable: true, render: (row) => {
        const color = row.stock_status === 'LOW' ? 'red' : row.stock_status === 'HIGH' ? 'blue' : 'green';
        return `<span class="text-${color}-600 font-semibold">${row.current_stock} ${row.unit}</span>`;
      }},
      { key: 'purchase_rate', label: 'Purchase Rate', sortable: true, render: (row) => `₹${row.purchase_rate.toFixed(2)}` },
      { key: 'sale_rate', label: 'Sale Rate', sortable: true, render: (row) => `₹${row.sale_rate.toFixed(2)}` },
      { key: 'stock_value', label: 'Value', sortable: false, render: (row) => `₹${row.stock_value.toFixed(2)}` },
      { key: 'status', label: 'Status', sortable: true, render: (row) => {
        const color = row.status === 'Active' ? 'green' : 'red';
        return `<span class="px-2 py-1 text-xs font-medium bg-${color}-100 text-${color}-800 rounded">${row.status}</span>`;
      }},
      { key: 'actions', label: 'Actions', sortable: false, render: (row) => `
        <div class="flex gap-2">
          <button data-action="view-movements" data-id="${row.id}" 
                  class="text-blue-600 hover:text-blue-800" title="View Movements">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </button>
          <button data-action="edit-stock" data-id="${row.id}" 
                  class="text-green-600 hover:text-green-800" title="Edit">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button data-action="adjust-stock" data-id="${row.id}" data-name="${row.item_name}" data-current="${row.current_stock}"
                  class="text-purple-600 hover:text-purple-800" title="Adjust Stock">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
            </svg>
          </button>
          <button data-action="delete-stock" data-id="${row.id}" 
                  class="text-red-600 hover:text-red-800" title="Delete">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      `}
    ];

    return DataTable({
      columns,
      data: stocks,
      currentPage,
      totalPages: pagination.totalPages || 1,
      sortColumn,
      sortDirection: sortDirection.toLowerCase(),
      emptyMessage: 'No stock items found. Click "Add Stock Item" to create one.'
    });
  }

  function setupEventListeners() {
    // Data table listeners
    setupDataTableListeners(container, {
      onSort: (column) => {
        if (sortColumn === column) {
          sortDirection = sortDirection === 'ASC' ? 'DESC' : 'ASC';
        } else {
          sortColumn = column;
          sortDirection = 'ASC';
        }
        loadStocks();
      },
      onPageChange: (page) => {
        currentPage = page;
        loadStocks();
      }
    });

    // Filter listeners
    container.addEventListener('change', (e) => {
      if (e.target.dataset.action === 'filter-status') {
        currentStatus = e.target.value;
        currentPage = 1;
        loadStocks();
      }
    });

    container.addEventListener('input', (e) => {
      if (e.target.dataset.action === 'filter-category') {
        clearTimeout(window.categoryTimeout);
        window.categoryTimeout = setTimeout(() => {
          currentCategory = e.target.value.trim();
          currentPage = 1;
          loadStocks();
        }, 500);
      }
    });

    // Search listener
    let searchTimeout;
    container.addEventListener('input', (e) => {
      if (e.target.dataset.action === 'search-stocks') {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          const query = e.target.value.trim();
          if (query.length >= 2) {
            searchStocks(query);
          } else if (query.length === 0) {
            loadStocks();
          }
        }, 300);
      }
    });

    // Action buttons
    container.addEventListener('click', async (e) => {
      const addBtn = e.target.closest('[data-action="add-stock"]');
      const editBtn = e.target.closest('[data-action="edit-stock"]');
      const deleteBtn = e.target.closest('[data-action="delete-stock"]');
      const adjustBtn = e.target.closest('[data-action="adjust-stock"]');
      const viewMovementsBtn = e.target.closest('[data-action="view-movements"]');
      const lowStockBtn = e.target.closest('[data-action="view-low-stock"]');

      if (addBtn) {
        openStockModal();
      } else if (editBtn) {
        const id = editBtn.dataset.id;
        openStockModal(id);
      } else if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        deleteStock(id);
      } else if (adjustBtn) {
        const id = adjustBtn.dataset.id;
        const name = adjustBtn.dataset.name;
        const current = adjustBtn.dataset.current;
        openAdjustModal(id, name, current);
      } else if (viewMovementsBtn) {
        const id = viewMovementsBtn.dataset.id;
        window.router.navigate(`/stocks/${id}/movements`);
      } else if (lowStockBtn) {
        showLowStockItems();
      }
    });

    // Modal listeners
    setupModalListeners('stock-modal', {
      onPrimary: saveStock,
      onSecondary: () => hideModal('stock-modal')
    });

    setupModalListeners('low-stock-modal', {
      onSecondary: () => hideModal('low-stock-modal')
    });
  }

  async function searchStocks(query) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/stocks/search/${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Search failed');

      stocks = await response.json();
      pagination = { page: 1, totalPages: 1, total: stocks.length };
      render();
    } catch (error) {
      console.error('Error searching stocks:', error);
      showError('Search failed');
    }
  }

  function openStockModal(stockId = null) {
    const modalTitle = stockId ? 'Edit Stock Item' : 'Add Stock Item';
    document.querySelector('#stock-modal h3').textContent = modalTitle;

    const formContainer = document.getElementById('stock-form-container');
    formContainer.innerHTML = StockForm({ stockId });

    showModal('stock-modal');

    if (stockId) {
      loadStockData(stockId);
    }
  }

  async function loadStockData(stockId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/stocks/${stockId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load stock');

      const stock = await response.json();

      // Populate form
      document.getElementById('item_name').value = stock.item_name || '';
      document.getElementById('item_code').value = stock.item_code || '';
      document.getElementById('hsn_code').value = stock.hsn_code || '';
      document.getElementById('unit').value = stock.unit || 'PCS';
      document.getElementById('category').value = stock.category || '';
      document.getElementById('min_stock').value = stock.min_stock || 0;
      document.getElementById('max_stock').value = stock.max_stock || 0;
      document.getElementById('purchase_rate').value = stock.purchase_rate || 0;
      document.getElementById('sale_rate').value = stock.sale_rate || 0;
      document.getElementById('gst_rate').value = stock.gst_rate || 0;
      document.getElementById('cess_rate').value = stock.cess_rate || 0;
      document.getElementById('description').value = stock.description || '';
      document.getElementById('status').value = stock.status || 'Active';

      // Store stock ID for update
      document.getElementById('stock-form-container').dataset.stockId = stockId;

    } catch (error) {
      console.error('Error loading stock:', error);
      showError('Failed to load stock data');
    }
  }

  async function saveStock() {
    try {
      const formContainer = document.getElementById('stock-form-container');
      const stockId = formContainer.dataset.stockId;

      const formData = {
        item_name: document.getElementById('item_name').value.trim(),
        item_code: document.getElementById('item_code').value.trim(),
        hsn_code: document.getElementById('hsn_code').value.trim(),
        unit: document.getElementById('unit').value,
        category: document.getElementById('category').value.trim(),
        min_stock: parseFloat(document.getElementById('min_stock').value) || 0,
        max_stock: parseFloat(document.getElementById('max_stock').value) || 0,
        purchase_rate: parseFloat(document.getElementById('purchase_rate').value) || 0,
        sale_rate: parseFloat(document.getElementById('sale_rate').value) || 0,
        gst_rate: parseFloat(document.getElementById('gst_rate').value) || 0,
        cess_rate: parseFloat(document.getElementById('cess_rate').value) || 0,
        description: document.getElementById('description').value.trim(),
        status: document.getElementById('status').value
      };

      if (!stockId) {
        formData.opening_stock = parseFloat(document.getElementById('opening_stock').value) || 0;
      }

      if (!formData.item_name) {
        showError('Item name is required');
        return false;
      }

      const token = localStorage.getItem('token');
      const url = stockId ? `/api/stocks/${stockId}` : '/api/stocks';
      const method = stockId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save stock');
      }

      showSuccess(stockId ? 'Stock updated successfully' : 'Stock created successfully');
      hideModal('stock-modal');
      loadStocks();
      loadSummary();
      return true;

    } catch (error) {
      console.error('Error saving stock:', error);
      showError(error.message);
      return false;
    }
  }

  async function deleteStock(stockId) {
    showConfirm({
      title: 'Delete Stock Item',
      message: 'Are you sure you want to delete this stock item? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/stocks/${stockId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete stock');
          }

          showSuccess('Stock deleted successfully');
          loadStocks();
          loadSummary();

        } catch (error) {
          console.error('Error deleting stock:', error);
          showError(error.message);
        }
      }
    });
  }

  function openAdjustModal(stockId, itemName, currentStock) {
    showConfirm({
      title: `Adjust Stock: ${itemName}`,
      message: `
        <div class="space-y-4">
          <p class="text-gray-700">Current Stock: <strong>${currentStock}</strong></p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">New Stock Quantity</label>
            <input 
              type="number" 
              id="adjust-qty"
              step="0.01"
              value="${currentStock}"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea 
              id="adjust-remarks"
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter adjustment reason..."></textarea>
          </div>
        </div>
      `,
      confirmText: 'Adjust',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const newQty = parseFloat(document.getElementById('adjust-qty').value);
        const remarks = document.getElementById('adjust-remarks').value.trim();

        if (isNaN(newQty) || newQty < 0) {
          showError('Invalid quantity');
          return;
        }

        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/stocks/${stockId}/adjust`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ new_qty: newQty, remarks })
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to adjust stock');
          }

          showSuccess('Stock adjusted successfully');
          loadStocks();
          loadSummary();

        } catch (error) {
          console.error('Error adjusting stock:', error);
          showError(error.message);
        }
      }
    });
  }

  async function showLowStockItems() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stocks/reports/low-stock', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load low stock items');

      const lowStockItems = await response.json();

      const container = document.getElementById('low-stock-container');
      
      if (lowStockItems.length === 0) {
        container.innerHTML = '<p class="text-gray-600 text-center py-8">No low stock items found!</p>';
      } else {
        container.innerHTML = `
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shortage</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${lowStockItems.map(item => `
                  <tr>
                    <td class="px-4 py-3 text-sm">${item.item_name}</td>
                    <td class="px-4 py-3 text-sm text-red-600 font-semibold">${item.current_stock} ${item.unit}</td>
                    <td class="px-4 py-3 text-sm">${item.min_stock} ${item.unit}</td>
                    <td class="px-4 py-3 text-sm text-red-600">${item.shortage_qty} ${item.unit}</td>
                    <td class="px-4 py-3 text-sm">₹${item.stock_value.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      showModal('low-stock-modal');

    } catch (error) {
      console.error('Error loading low stock items:', error);
      showError('Failed to load low stock items');
    }
  }

  // Initial load
  loadStocks();
  loadSummary();

  return container;
}
