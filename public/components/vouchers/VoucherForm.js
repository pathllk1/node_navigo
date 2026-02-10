/**
 * Voucher Form Component (Payment/Receipt/Journal)
 */

export function VoucherForm({ voucherType = 'PAYMENT', voucherId = null }) {
  const isJournal = voucherType === 'JOURNAL';
  
  return `
    <form id="voucher-form" class="space-y-6">
      <!-- Voucher Header -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Voucher No</label>
          <input type="text" id="voucher_no" readonly
                 class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input type="date" id="voucher_date" required
                 class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <input type="text" value="${voucherType}" readonly
                 class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
        </div>
      </div>

      ${!isJournal ? `
      <!-- Single Entry (Payment/Receipt) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">${voucherType === 'PAYMENT' ? 'Pay To' : 'Receive From'} *</label>
          <select id="account_name" required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="">Select Account</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
          <input type="number" id="amount" step="0.01" required
                 class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
          <select id="payment_mode"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="UPI">UPI</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Reference No</label>
          <input type="text" id="reference_no"
                 class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
      </div>
      ` : `
      <!-- Journal Entries -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium text-gray-700">Journal Entries</label>
          <button type="button" data-action="add-entry"
                  class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
            + Add Entry
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 border">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Account</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Debit</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Credit</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody id="entries-tbody" class="bg-white divide-y divide-gray-200">
              <!-- Entries will be added here -->
            </tbody>
            <tfoot class="bg-gray-50">
              <tr>
                <td class="px-3 py-2 text-right font-medium">Total:</td>
                <td class="px-3 py-2 font-bold" id="total-debit">₹0.00</td>
                <td class="px-3 py-2 font-bold" id="total-credit">₹0.00</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      `}

      <!-- Narration -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Narration *</label>
        <textarea id="narration" rows="3" required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
      </div>
    </form>
  `;
}
