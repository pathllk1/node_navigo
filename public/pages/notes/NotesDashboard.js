/**
 * Notes Dashboard
 * Manages credit notes, debit notes, and delivery notes
 */

import { DataTable, setupDataTableListeners } from '../../components/common/DataTable.js';
import { showSuccess, showError } from '../../components/common/Toast.js';

export function NotesDashboard() {
  let currentPage = 1;
  let currentType = 'CREDIT';
  let sortColumn = 'note_date';
  let sortDirection = 'DESC';
  let notes = [];
  let pagination = {};
  let summary = {};

  const container = document.createElement('div');
  container.className = 'notes-dashboard p-6';

  async function loadNotes() {
    try {
      const token = localStorage.getItem('token');
      const endpoint = currentType === 'CREDIT' ? 'credit' : currentType === 'DEBIT' ? 'debit' : 'delivery';
      const response = await fetch(
        `/api/notes/${endpoint}?page=${currentPage}&sortBy=${sortColumn}&sortOrder=${sortDirection}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to load notes');

      const data = await response.json();
      
      // Handle both array and object responses
      if (Array.isArray(data)) {
        notes = data;
        pagination = { total: data.length, totalPages: 1, currentPage: 1 };
      } else {
        notes = data.notes || [];
        pagination = data.pagination || { total: 0, totalPages: 1, currentPage: 1 };
      }
      
      render();
    } catch (error) {
      console.error('Error loading notes:', error);
      showError('Failed to load notes');
    }
  }

  function render() {
    container.innerHTML = `
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Notes Management</h1>
            <p class="text-gray-600 mt-1">Credit notes, debit notes, and delivery notes</p>
          </div>
          <div class="flex gap-2">
            <button 
              data-action="add-credit"
              class="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Credit Note
            </button>
            <button 
              data-action="add-debit"
              class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Debit Note
            </button>
            <button 
              data-action="add-delivery"
              class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Delivery Note
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          ${renderStatsCards()}
        </div>

        <div class="bg-white rounded-lg shadow p-4 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Note Type</label>
              <select 
                data-action="filter-type"
                class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="CREDIT">Credit Notes</option>
                <option value="DEBIT">Debit Notes</option>
                <option value="DELIVERY">Delivery Notes</option>
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
                data-action="search-notes"
                placeholder="Search by note no, party..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow">
          ${renderNotesTable()}
        </div>
      </div>
    `;

    setupEventListeners();
  }

  function renderStatsCards() {
    return `
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="text-sm text-green-600 font-medium">Credit Notes</div>
        <div class="text-2xl font-bold text-green-900 mt-1">${summary.total_credit_notes || 0}</div>
        <div class="text-xs text-gray-600 mt-1">₹${(summary.credit_amount || 0).toFixed(2)}</div>
      </div>
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="text-sm text-red-600 font-medium">Debit Notes</div>
        <div class="text-2xl font-bold text-red-900 mt-1">${summary.total_debit_notes || 0}</div>
        <div class="text-xs text-gray-600 mt-1">₹${(summary.debit_amount || 0).toFixed(2)}</div>
      </div>
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="text-sm text-blue-600 font-medium">Delivery Notes</div>
        <div class="text-2xl font-bold text-blue-900 mt-1">${summary.total_delivery_notes || 0}</div>
        <div class="text-xs text-gray-600 mt-1">Pending conversion</div>
      </div>
    `;
  }

  function renderNotesTable() {
    const columns = [
      { key: 'note_no', label: 'Note No', sortable: true },
      { key: 'note_date', label: 'Date', sortable: true, render: (row) => new Date(row.note_date).toLocaleDateString('en-IN') },
      { key: 'party_name', label: 'Party', sortable: true },
      { key: 'total_amount', label: 'Amount', sortable: true, render: (row) => `₹${row.total_amount.toFixed(2)}` },
      { key: 'reason', label: 'Reason', sortable: false, render: (row) => row.reason || '-' },
      { key: 'actions', label: 'Actions', sortable: false, render: (row) => `
        <div class="flex gap-2">
          <button data-action="view-note" data-id="${row.id}" class="text-blue-600 hover:text-blue-800" title="View">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
          <button data-action="edit-note" data-id="${row.id}" class="text-green-600 hover:text-green-800" title="Edit">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button data-action="print-note" data-id="${row.id}" class="text-purple-600 hover:text-purple-800" title="Print">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
          </button>
          <button data-action="delete-note" data-id="${row.id}" class="text-red-600 hover:text-red-800" title="Delete">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      `}
    ];

    return DataTable({
      columns,
      data: notes,
      currentPage,
      totalPages: pagination.totalPages || 1,
      sortColumn,
      sortDirection: sortDirection.toLowerCase(),
      emptyMessage: 'No notes found. Create a new note using the buttons above.'
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
        loadNotes();
      },
      onPageChange: (page) => {
        currentPage = page;
        loadNotes();
      }
    });

    container.addEventListener('change', (e) => {
      if (e.target.dataset.action === 'filter-type') {
        currentType = e.target.value;
        currentPage = 1;
        loadNotes();
      }
    });

    container.addEventListener('click', async (e) => {
      const addCreditBtn = e.target.closest('[data-action="add-credit"]');
      const addDebitBtn = e.target.closest('[data-action="add-debit"]');
      const addDeliveryBtn = e.target.closest('[data-action="add-delivery"]');
      const viewBtn = e.target.closest('[data-action="view-note"]');
      const editBtn = e.target.closest('[data-action="edit-note"]');
      const deleteBtn = e.target.closest('[data-action="delete-note"]');
      const printBtn = e.target.closest('[data-action="print-note"]');

      if (addCreditBtn) {
        window.router.navigate('/notes/credit/new');
      } else if (addDebitBtn) {
        window.router.navigate('/notes/debit/new');
      } else if (addDeliveryBtn) {
        window.router.navigate('/notes/delivery/new');
      } else if (viewBtn) {
        const type = currentType.toLowerCase();
        window.router.navigate(`/notes/${type}/${viewBtn.dataset.id}`);
      } else if (editBtn) {
        const type = currentType.toLowerCase();
        window.router.navigate(`/notes/${type}/${editBtn.dataset.id}/edit`);
      } else if (printBtn) {
        const type = currentType.toLowerCase();
        window.open(`/api/notes/${type}/${printBtn.dataset.id}/pdf`, '_blank');
      } else if (deleteBtn) {
        deleteNote(deleteBtn.dataset.id);
      }
    });
  }

  async function deleteNote(noteId) {
    const confirmed = confirm('Are you sure you want to delete this note? This will reverse stock and ledger entries.');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const type = currentType.toLowerCase();
      const response = await fetch(`/api/notes/${type}/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete note');

      showSuccess('Note deleted successfully');
      loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      showError(error.message);
    }
  }

  loadNotes();

  return container;
}
