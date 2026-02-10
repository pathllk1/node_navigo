/**
 * Sales Bill Detail View
 */

import { showError, showSuccess } from '../../components/common/Toast.js';

export function SalesBillDetail(billId) {
  let bill = null;

  const container = document.createElement('div');
  container.className = 'bill-detail p-6';

  async function loadBill() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sales/${billId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load bill');

      bill = await response.json();
      render();
    } catch (error) {
      console.error('Error loading bill:', error);
      showError('Failed to load bill');
    }
  }

  function render() {
    if (!bill) {
      container.innerHTML = '<div class="text-center py-12">Loading...</div>';
      return;
    }

    container.innerHTML = `
      <div class="max-w-5xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Sales Bill #${bill.bill_no}</h1>
            <p class="text-gray-600 mt-1">Date: ${new Date(bill.bill_date).toLocaleDateString('en-IN')}</p>
          </div>
          <div class="flex gap-2">
            <button data-action="edit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Edit
            </button>
            <button data-action="print" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Print
            </button>
            <button data-action="delete" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Delete
            </button>
          </div>
        </div>

        <!-- Bill Content -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <!-- Party Info -->
          <div class="grid grid-cols-2 gap-6 mb-6 pb-6 border-b">
            <div>
              <h3 class="text-sm font-medium text-gray-500 mb-2">Bill To:</h3>
              <div class="text-lg font-semibold">${bill.party_name}</div>
              <div class="text-sm text-gray-600 mt-1">${bill.party_address || ''}</div>
              <div class="text-sm text-gray-600">GSTIN: ${bill.party_gstin || 'N/A'}</div>
            </div>
            <div class="text-right">
              <div class="mb-2">
                <span class="text-sm text-gray-500">Status:</span>
                <span class="ml-2 px-3 py-1 text-sm font-medium rounded ${
                  bill.status === 'PAID' ? 'bg-green-100 text-green-800' :
                  bill.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }">${bill.status}</span>
              </div>
              <div class="text-sm text-gray-600">Due Date: ${bill.due_date ? new Date(bill.due_date).toLocaleDateString('en-IN') : 'N/A'}</div>
            </div>
          </div>

          <!-- Line Items -->
          <table class="min-w-full divide-y divide-gray-200 mb-6">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">GST</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${(bill.items || []).map(item => `
                <tr>
                  <td class="px-4 py-3 text-sm">${item.item_name}</td>
                  <td class="px-4 py-3 text-sm text-right">${item.quantity} ${item.unit}</td>
                  <td class="px-4 py-3 text-sm text-right">₹${item.rate.toFixed(2)}</td>
                  <td class="px-4 py-3 text-sm text-right">₹${item.amount.toFixed(2)}</td>
                  <td class="px-4 py-3 text-sm text-right">₹${item.gst_amount.toFixed(2)}</td>
                  <td class="px-4 py-3 text-sm text-right font-semibold">₹${item.total_amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Totals -->
          <div class="flex justify-end">
            <div class="w-80">
              <div class="flex justify-between py-2 border-t">
                <span class="text-gray-600">Subtotal:</span>
                <span class="font-medium">₹${bill.subtotal.toFixed(2)}</span>
              </div>
              <div class="flex justify-between py-2">
                <span class="text-gray-600">CGST:</span>
                <span class="font-medium">₹${bill.cgst_amount.toFixed(2)}</span>
              </div>
              <div class="flex justify-between py-2">
                <span class="text-gray-600">SGST:</span>
                <span class="font-medium">₹${bill.sgst_amount.toFixed(2)}</span>
              </div>
              <div class="flex justify-between py-2">
                <span class="text-gray-600">IGST:</span>
                <span class="font-medium">₹${bill.igst_amount.toFixed(2)}</span>
              </div>
              <div class="flex justify-between py-3 border-t-2 border-gray-300">
                <span class="text-lg font-bold">Total:</span>
                <span class="text-lg font-bold text-blue-600">₹${bill.total_amount.toFixed(2)}</span>
              </div>
              <div class="flex justify-between py-2 text-green-600">
                <span>Paid:</span>
                <span class="font-medium">₹${(bill.paid_amount || 0).toFixed(2)}</span>
              </div>
              <div class="flex justify-between py-2 text-yellow-600">
                <span>Balance:</span>
                <span class="font-medium">₹${(bill.total_amount - (bill.paid_amount || 0)).toFixed(2)}</span>
              </div>
            </div>
          </div>

          ${bill.notes ? `
          <div class="mt-6 pt-6 border-t">
            <h4 class="text-sm font-medium text-gray-700 mb-2">Notes:</h4>
            <p class="text-sm text-gray-600">${bill.notes}</p>
          </div>
          ` : ''}
        </div>
      </div>
    `;

    setupEventListeners();
  }

  function setupEventListeners() {
    container.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-action="edit"]');
      const printBtn = e.target.closest('[data-action="print"]');
      const deleteBtn = e.target.closest('[data-action="delete"]');

      if (editBtn) {
        window.router.navigate(`/sales/${billId}/edit`);
      } else if (printBtn) {
        window.open(`/api/sales/${billId}/pdf`, '_blank');
      } else if (deleteBtn) {
        deleteBill();
      }
    });
  }

  async function deleteBill() {
    if (!confirm('Are you sure you want to delete this bill? This will reverse stock and ledger entries.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sales/${billId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete bill');

      showSuccess('Bill deleted successfully');
      window.router.navigate('/sales');
    } catch (error) {
      console.error('Error deleting bill:', error);
      showError(error.message);
    }
  }

  loadBill();

  return container;
}
