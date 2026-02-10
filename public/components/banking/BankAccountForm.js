/**
 * Bank Account Form Component
 */

export function BankAccountForm({ accountId = null }) {
  return `
    <form id="bank-account-form" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Account Name *</label>
          <input type="text" id="account_name" required
                 class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
          <input type="text" id="account_number" required
                 class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
          <input type="text" id="bank_name" required
                 class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Branch</label>
          <input type="text" id="branch"
                 class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
          <input type="text" id="ifsc_code"
                 class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
          <select id="account_type"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="SAVINGS">Savings</option>
            <option value="CURRENT">Current</option>
            <option value="OD">Overdraft</option>
            <option value="CC">Cash Credit</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Opening Balance</label>
          <input type="number" id="opening_balance" step="0.01" value="0"
                 class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select id="status"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>
    </form>
  `;
}
