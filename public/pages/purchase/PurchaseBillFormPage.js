/**
 * Purchase Bill Form Page
 * Create new purchase bill
 */

import { showSuccess, showError } from '../../components/common/Toast.js';

export function PurchaseBillFormPage() {
  const container = document.createElement('div');
  container.className = 'purchase-bill-form-page p-6';

  let parties = [];
  let items = [];
  let billItems = [];

  async function loadParties() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/parties?type=SUPPLIER', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        parties = Array.isArray(data) ? data : data.parties || [];
      }
    } catch (error) {
      console.error('Error loading parties:', error);
    }
  }

  async function loadItems() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stocks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        items = Array.isArray(data) ? data : data.items || [];
      }
    } catch (error) {
      console.error('Error loading items:', error);
    }
  }

  function addItem() {
    const itemId = container.querySelector('[name="item_id"]').value;
    const quantity = parseFloat(container.querySelector('[name="quantity"]').value);
    const rate = parseFloat(container.querySelector('[name="rate"]').value);
    const discount = parseFloat(container.querySelector('[name="discount"]').value) || 0;

    if (!itemId || !quantity || !rate) {
      showError('Please select item and enter quantity and rate');
      return;
    }

    const item = items.find(i => i.id == itemId);
    if (!item) return;

    const amount = (quantity * rate) - discount;
    
    billItems.push({
      item_id: itemId,
      item_name: item.item_name,
      quantity,
      rate,
      discount,
      amount
    });

    container.querySelector('[name="item_id"]').value = '';
    container.querySelector('[name="quantity"]').value = '';
    container.querySelector('[name="rate"]').value = '';
    container.querySelector('[name="discount"]').value = '';

    render();
  }

  function removeItem(index) {
    billItems.splice(index, 1);
    render();
  }

  function calculateTotals() {
    const subtotal = billItems.reduce((sum, item) => sum + item.amount, 0);
    const gstRate = parseFloat(container.querySelector('[name="gst_rate"]')?.value) || 0;
    const gstAmount = (subtotal * gstRate) / 100;
    const total = subtotal + gstAmount;

    return { subtotal, gstAmount, total };
  }

  async function handleSave() {
    try {
      const billDate = container.querySelector('[name="bill_date"]').value;
      const partyId = container.querySelector('[name="party_id"]').value;
      const gstRate = parseFloat(container.querySelector('[name="gst_rate"]').value) || 0;
      const notes = container.querySelector('[name="notes"]').value;

      if (!billDate || !partyId) {
        showError('Please select date and party');
        return;
      }

      if (billItems.length === 0) {
        showError('Please add at least one item');
        return;
      }

      const { subtotal, gstAmount, total } = calculateTotals();

      const billData = {
        bill_date: billDate,
        party_id: partyId,
        items: billItems,
        subtotal,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        total_amount: total,
        notes
      };

      const token = localStorage.getItem('token');
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(billData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create purchase bill');
      }

      showSuccess('Purchase bill created successfully');
      window.router.navigate('/purchase');
    } catch (error) {
      console.error('Error saving bill:', error);
      showError(error.message);
    }
  }

  function render() {
    const { subtotal, gstAmount, total } = billItems.length > 0 ? calculateTotals() : { subtotal: 0, gstAmount: 0, total: 0 };

    container.innerHTML = `
      <div class="max-w-6xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-3xl font-bold text-gray-900">New Purchase Bill</h1>
          <button data-action="cancel" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            Back to List
          </button>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Bill Date *</label>
              <input type="date" name="bill_date" value="${new Date().toISOString().split('T')[0]}"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
              <select name="party_id" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Select Supplier</option>
                ${parties.map(p => `<option value="${p.id}">${p.party_name}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="border-t pt-6 mb-6">
            <h3 class="text-lg font-semibold mb-4">Add Items</h3>
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Item</label>
                <select name="item_id" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">Select Item</option>
                  ${items.map(i => `<option value="${i.id}">${i.item_name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" name="quantity" step="0.01" min="0"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                <input type="number" name="rate" step="0.01" min="0"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Discount</label>
                <input type="number" name="discount" step="0.01" min="0" value="0"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md">
              </div>
            </div>
            <button data-action="add-item" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Add Item
            </button>
          </div>

          ${billItems.length > 0 ? `
            <div class="border-t pt-6 mb-6">
              <h3 class="text-lg font-semibold mb-4">Bill Items</h3>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    ${billItems.map((item, index) => `
                      <tr>
                        <td class="px-4 py-3 text-sm">${item.item_name}</td>
                        <td class="px-4 py-3 text-sm text-right">${item.quantity}</td>
                        <td class="px-4 py-3 text-sm text-right">₹${item.rate.toFixed(2)}</td>
                        <td class="px-4 py-3 text-sm text-right">₹${item.discount.toFixed(2)}</td>
                        <td class="px-4 py-3 text-sm text-right font-medium">₹${item.amount.toFixed(2)}</td>
                        <td class="px-4 py-3 text-center">
                          <button data-action="remove-item" data-index="${index}" class="text-red-600 hover:text-red-800">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}

          <div class="border-t pt-6 mb-6">
            <div class="max-w-md ml-auto">
              <div class="flex justify-between mb-2">
                <span class="text-gray-600">Subtotal:</span>
                <span class="font-medium">₹${subtotal.toFixed(2)}</span>
              </div>
              <div class="flex justify-between items-center mb-2">
                <span class="text-gray-600">GST Rate (%):</span>
                <input type="number" name="gst_rate" value="18" step="0.01" min="0"
                       class="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                       data-action="recalculate">
              </div>
              <div class="flex justify-between mb-2">
                <span class="text-gray-600">GST Amount:</span>
                <span class="font-medium">₹${gstAmount.toFixed(2)}</span>
              </div>
              <div class="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>₹${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
          </div>

          <div class="flex gap-2">
            <button data-action="save" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Save Bill
            </button>
            <button data-action="cancel" class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;

    setupEventListeners();
  }

  function setupEventListeners() {
    container.addEventListener('click', (e) => {
      const saveBtn = e.target.closest('[data-action="save"]');
      const cancelBtn = e.target.closest('[data-action="cancel"]');
      const addItemBtn = e.target.closest('[data-action="add-item"]');
      const removeBtn = e.target.closest('[data-action="remove-item"]');

      if (saveBtn) handleSave();
      else if (cancelBtn) window.router.navigate('/purchase');
      else if (addItemBtn) addItem();
      else if (removeBtn) removeItem(parseInt(removeBtn.dataset.index));
    });

    container.addEventListener('input', (e) => {
      if (e.target.dataset.action === 'recalculate') {
        render();
      }
    });
  }

  Promise.all([loadParties(), loadItems()]).then(() => render());

  return container;
}
