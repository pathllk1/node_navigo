/**
 * Bank Transaction Form Component
 */

export function TransactionForm({ transactionId = null }) {
  return `
    <form id="transaction-form" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Bank Account *</label>
          <select id="bank_account_id" required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="">Select Account</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Transaction Date *</label>
          <input type="date" id="transaction_date" required
                 class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Transaction Type *</label>
          <select id="transaction_type" required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="DEPOSIT">Deposit</option>
            <option value="WITHDRAWAL">Withdrawal</option>
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
          <label class="block text-sm font-medium text-gray-700 mb-1">Reference No</label>
          <input type="text" id="reference_no"
                 class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Cheque No</label>
          <input type="text" id="cheque_no"
                 class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea id="description" rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
      </div>
    </form>
  `;
}
