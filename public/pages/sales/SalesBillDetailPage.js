/**
 * Sales Bill Detail Page
 * View sales bill details
 */

import { showSuccess, showError } from '../../components/common/Toast.js';

export function SalesBillDetailPage(billId) {
  const container = document.createElement('div');
  container.className = 'sales-bill-detail-page p-6';

  // Check if billId is "new" - this shouldn't happen but handle it
  if (billId === 'new') {
    container.innerHTML = '<div class="p-6"><p>Invalid bill ID. Redirecting...</p></div>';
    setTimeout(() => window.router.navigate('/sales'), 100);
    return container;
  }

  let bill = null;

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
      showError('Failed to load bill details');
      window.router.navigate('/sales');
    }
  }

  async function handleDelete() {
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

  function handlePrint() {
    window.open(`/api/sales/${billId}/pdf`, '_blank');
  }

  function render() {
    if (!bill) {
      container.innerHTML = '<div class="text-center py-12">Loading...</div>';
      return;
    }

    container.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-3xl font-bold text-gray-900">Sales Bill #${bill.bill_no}</h1>
          <div class="flex gap-2">
            <button data-action="print" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Print
            </button>
            <button data-action="edit" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Edit
            </button>
            <button data-action="delete" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Delete
            </button>
            <button data-action="back" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Back
            </button>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <!-- Bill Header -->
          <div class="grid grid-cols-2 gap-6 mb-6 pb-6 border-b">
            <div>
              <h3 class="text-sm font-medium text-gray-500 mb-2">Bill Information</h3>
              <p class="text-sm mb-1"><span class="font-medium">Bill No:</span> ${bill.bill_no}</p>
              <p class="text-sm mb-1"><span class="font-medium">Date:</span> ${new Date(bill.bill_date).toLocaleDateString('en-IN')}</p>
              <p class="text-sm mb-1"><span class="font-medium">Status:</span> 
                <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">${bill.status || 'COMPLETED'}</span>
              </p>
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-500 mb-2">Party Details</h3>
              <p class="text-sm mb-1"><span class="font-medium">Name:</span> ${bill.party_name}</p>
              <p class="text-sm mb-1"><span class="font-medium">Type:</span> ${bill.party_type}</p>
            </div>
          </div>

          <!-- Items Table -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-4">Items</h3>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  ${(bill.items || []).map(item => `
                    <tr>
                      <td class="px-4 py-3 text-sm">${item.item_name}</td>
                      <td class="px-4 py-3 text-sm text-right">${item.quantity}</td>
                      <td class="px-4 py-3 text-sm text-right">₹${item.rate.toFixed(2)}</td>
                      <td class="px-4 py-3 text-sm text-right">₹${(item.discount || 0).toFixed(2)}</td>
                      <td class="px-4 py-3 text-sm text-right font-medium">₹${item.amount.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Totals -->
          <div class="border-t pt-6">
            <div class="max-w-md ml-auto">
              <div class="flex justify-between mb-2">
                <span class="text-gray-600">Subtotal:</span>
                <span class="font-medium">₹${(bill.subtotal || 0).toFixed(2)}</span>
              </div>
              <div class="flex justify-between mb-2">
                <span class="text-gray-600">GST (${bill.gst_rate || 0}%):</span>
                <span class="font-medium">₹${(bill.gst_amount || 0).toFixed(2)}</span>
              </div>
              <div class="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>₹${(bill.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          ${bill.notes ? `
            <div class="mt-6 pt-6 border-t">
              <h3 class="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <p class="text-sm text-gray-700">${bill.notes}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    setupEventListeners();
  }

  function setupEventListeners() {
    container.addEventListener('click', (e) => {
      const printBtn = e.target.closest('[data-action="print"]');
      const editBtn = e.target.closest('[data-action="edit"]');
      const deleteBtn = e.target.closest('[data-action="delete"]');
      const backBtn = e.target.closest('[data-action="back"]');

      if (printBtn) handlePrint();
      else if (editBtn) window.router.navigate(`/sales/${billId}/edit`);
      else if (deleteBtn) handleDelete();
      else if (backBtn) window.router.navigate('/sales');
    });
  }

  loadBill();

  return container;
}
