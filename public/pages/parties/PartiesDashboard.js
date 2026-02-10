/**
 * Parties Dashboard
 * Manages customers and suppliers
 */

import { DataTable, setupDataTableListeners } from '../../components/common/DataTable.js';
import { Modal, showModal, hideModal, setupModalListeners, showConfirm } from '../../components/common/Modal.js';
import { showSuccess, showError } from '../../components/common/Toast.js';
import { PartyForm } from '../../components/parties/PartyForm.js';

export function PartiesDashboard() {
  let currentPage = 1;
  let currentType = 'ALL';
  let currentStatus = 'Active';
  let sortColumn = 'party_name';
  let sortDirection = 'ASC';
  let parties = [];
  let pagination = {};

  const container = document.createElement('div');
  container.className = 'parties-dashboard p-6';

  async function loadParties() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/parties?type=${currentType}&status=${currentStatus}&page=${currentPage}&sortBy=${sortColumn}&sortOrder=${sortDirection}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to load parties');

      const data = await response.json();
      parties = data.parties;
      pagination = data.pagination;

      render();
    } catch (error) {
      console.error('Error loading parties:', error);
      showError('Failed to load parties');
    }
  }

  function render() {
    container.innerHTML = `
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Parties</h1>
            <p class="text-gray-600 mt-1">Manage customers and suppliers</p>
          </div>
          <button 
            data-action="add-party"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Party
            </span>
          </button>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg shadow p-4 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Party Type Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Party Type</label>
              <select 
                data-action="filter-type"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="ALL" ${currentType === 'ALL' ? 'selected' : ''}>All</option>
                <option value="CUSTOMER" ${currentType === 'CUSTOMER' ? 'selected' : ''}>Customers</option>
                <option value="SUPPLIER" ${currentType === 'SUPPLIER' ? 'selected' : ''}>Suppliers</option>
                <option value="BOTH" ${currentType === 'BOTH' ? 'selected' : ''}>Both</option>
              </select>
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
                data-action="search-parties"
                placeholder="Search by name, phone, email..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          ${renderStatsCards()}
        </div>

        <!-- Parties Table -->
        <div class="bg-white rounded-lg shadow">
          ${renderPartiesTable()}
        </div>
      </div>

      <!-- Add/Edit Party Modal -->
      ${Modal({
        id: 'party-modal',
        title: 'Add Party',
        content: '<div id="party-form-container"></div>',
        size: 'lg',
        primaryButton: 'Save',
        secondaryButton: 'Cancel'
      })}
    `;

    setupEventListeners();
  }

  function renderStatsCards() {
    const customers = parties.filter(p => p.party_type === 'CUSTOMER' || p.party_type === 'BOTH').length;
    const suppliers = parties.filter(p => p.party_type === 'SUPPLIER' || p.party_type === 'BOTH').length;
    const active = parties.filter(p => p.status === 'Active').length;

    return `
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="text-sm text-blue-600 font-medium">Total Parties</div>
        <div class="text-2xl font-bold text-blue-900 mt-1">${pagination.total || 0}</div>
      </div>
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="text-sm text-green-600 font-medium">Customers</div>
        <div class="text-2xl font-bold text-green-900 mt-1">${customers}</div>
      </div>
      <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div class="text-sm text-purple-600 font-medium">Suppliers</div>
        <div class="text-2xl font-bold text-purple-900 mt-1">${suppliers}</div>
      </div>
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div class="text-sm text-yellow-600 font-medium">Active</div>
        <div class="text-2xl font-bold text-yellow-900 mt-1">${active}</div>
      </div>
    `;
  }

  function renderPartiesTable() {
    const columns = [
      { key: 'party_name', label: 'Party Name', sortable: true },
      { key: 'party_type', label: 'Type', sortable: true, render: (row) => {
        const colors = { CUSTOMER: 'blue', SUPPLIER: 'purple', BOTH: 'green' };
        const color = colors[row.party_type] || 'gray';
        return `<span class="px-2 py-1 text-xs font-medium bg-${color}-100 text-${color}-800 rounded">${row.party_type}</span>`;
      }},
      { key: 'phone', label: 'Phone', sortable: false },
      { key: 'city', label: 'City', sortable: true },
      { key: 'default_gstin', label: 'GSTIN', sortable: false, render: (row) => row.default_gstin || 'UNREGISTERED' },
      { key: 'gst_count', label: 'GST Count', sortable: false, render: (row) => row.gst_count || 0 },
      { key: 'status', label: 'Status', sortable: true, render: (row) => {
        const color = row.status === 'Active' ? 'green' : 'red';
        return `<span class="px-2 py-1 text-xs font-medium bg-${color}-100 text-${color}-800 rounded">${row.status}</span>`;
      }},
      { key: 'actions', label: 'Actions', sortable: false, render: (row) => `
        <div class="flex gap-2">
          <button data-action="view-party" data-id="${row.id}" 
                  class="text-blue-600 hover:text-blue-800" title="View">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
          <button data-action="edit-party" data-id="${row.id}" 
                  class="text-green-600 hover:text-green-800" title="Edit">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button data-action="delete-party" data-id="${row.id}" 
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
      data: parties,
      currentPage,
      totalPages: pagination.totalPages || 1,
      sortColumn,
      sortDirection: sortDirection.toLowerCase(),
      emptyMessage: 'No parties found. Click "Add Party" to create one.'
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
        loadParties();
      },
      onPageChange: (page) => {
        currentPage = page;
        loadParties();
      }
    });

    // Filter listeners
    container.addEventListener('change', (e) => {
      if (e.target.dataset.action === 'filter-type') {
        currentType = e.target.value;
        currentPage = 1;
        loadParties();
      }
      if (e.target.dataset.action === 'filter-status') {
        currentStatus = e.target.value;
        currentPage = 1;
        loadParties();
      }
    });

    // Search listener
    let searchTimeout;
    container.addEventListener('input', (e) => {
      if (e.target.dataset.action === 'search-parties') {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          const query = e.target.value.trim();
          if (query.length >= 2) {
            searchParties(query);
          } else if (query.length === 0) {
            loadParties();
          }
        }, 300);
      }
    });

    // Action buttons
    container.addEventListener('click', async (e) => {
      const addBtn = e.target.closest('[data-action="add-party"]');
      const viewBtn = e.target.closest('[data-action="view-party"]');
      const editBtn = e.target.closest('[data-action="edit-party"]');
      const deleteBtn = e.target.closest('[data-action="delete-party"]');

      if (addBtn) {
        openPartyModal();
      } else if (viewBtn) {
        const id = viewBtn.dataset.id;
        window.router.navigate(`/parties/${id}`);
      } else if (editBtn) {
        const id = editBtn.dataset.id;
        openPartyModal(id);
      } else if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        deleteParty(id);
      }
    });

    // Modal listeners
    setupModalListeners('party-modal', {
      onPrimary: saveParty,
      onSecondary: () => hideModal('party-modal')
    });
  }

  async function searchParties(query) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/parties/search/${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Search failed');

      parties = await response.json();
      pagination = { page: 1, totalPages: 1, total: parties.length };
      render();
    } catch (error) {
      console.error('Error searching parties:', error);
      showError('Search failed');
    }
  }

  function openPartyModal(partyId = null) {
    const modalTitle = partyId ? 'Edit Party' : 'Add Party';
    document.querySelector('#party-modal h3').textContent = modalTitle;

    const formContainer = document.getElementById('party-form-container');
    formContainer.innerHTML = PartyForm({ partyId });

    showModal('party-modal');

    // Load party data if editing
    if (partyId) {
      loadPartyData(partyId);
    }
  }

  async function loadPartyData(partyId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/parties/${partyId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load party');

      const party = await response.json();

      // Populate form
      document.getElementById('party_name').value = party.party_name || '';
      document.getElementById('party_type').value = party.party_type || 'CUSTOMER';
      document.getElementById('contact_person').value = party.contact_person || '';
      document.getElementById('phone').value = party.phone || '';
      document.getElementById('email').value = party.email || '';
      document.getElementById('address').value = party.address || '';
      document.getElementById('city').value = party.city || '';
      document.getElementById('state').value = party.state || '';
      document.getElementById('pincode').value = party.pincode || '';
      document.getElementById('pan').value = party.pan || '';
      document.getElementById('opening_balance').value = party.opening_balance || 0;
      document.getElementById('balance_type').value = party.balance_type || 'Dr';
      document.getElementById('credit_limit').value = party.credit_limit || 0;
      document.getElementById('credit_days').value = party.credit_days || 0;
      document.getElementById('status').value = party.status || 'Active';

      // Store party ID for update
      document.getElementById('party-form-container').dataset.partyId = partyId;

    } catch (error) {
      console.error('Error loading party:', error);
      showError('Failed to load party data');
    }
  }

  async function saveParty() {
    try {
      const formContainer = document.getElementById('party-form-container');
      const partyId = formContainer.dataset.partyId;

      const formData = {
        party_name: document.getElementById('party_name').value.trim(),
        party_type: document.getElementById('party_type').value,
        contact_person: document.getElementById('contact_person').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        address: document.getElementById('address').value.trim(),
        city: document.getElementById('city').value.trim(),
        state: document.getElementById('state').value.trim(),
        pincode: document.getElementById('pincode').value.trim(),
        pan: document.getElementById('pan').value.trim(),
        opening_balance: parseFloat(document.getElementById('opening_balance').value) || 0,
        balance_type: document.getElementById('balance_type').value,
        credit_limit: parseFloat(document.getElementById('credit_limit').value) || 0,
        credit_days: parseInt(document.getElementById('credit_days').value) || 0,
        status: document.getElementById('status').value
      };

      if (!formData.party_name) {
        showError('Party name is required');
        return false;
      }

      const token = localStorage.getItem('token');
      const url = partyId ? `/api/parties/${partyId}` : '/api/parties';
      const method = partyId ? 'PUT' : 'POST';

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
        throw new Error(error.error || 'Failed to save party');
      }

      showSuccess(partyId ? 'Party updated successfully' : 'Party created successfully');
      hideModal('party-modal');
      loadParties();
      return true;

    } catch (error) {
      console.error('Error saving party:', error);
      showError(error.message);
      return false;
    }
  }

  async function deleteParty(partyId) {
    showConfirm({
      title: 'Delete Party',
      message: 'Are you sure you want to delete this party? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/parties/${partyId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete party');
          }

          showSuccess('Party deleted successfully');
          loadParties();

        } catch (error) {
          console.error('Error deleting party:', error);
          showError(error.message);
        }
      }
    });
  }

  // Initial load
  loadParties();

  return container;
}
