/**
 * Ledger Account Form Component
 */

export function AccountForm({ accountName = null }) {
  return `
    <form id="account-form" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Account Name *</label>
          <input type="text" id="account_name" required
                 class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Account Group *</label>
          <select id="group" required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="">Select Group</option>
            <option value="ASSETS">Assets</option>
            <option value="LIABILITIES">Liabilities</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSES">Expenses</option>
            <option value="EQUITY">Equity</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Sub Group</label>
          <input type="text" id="sub_group"
                 class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Opening Balance</label>
          <input type="number" id="opening_balance" step="0.01" value="0"
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
