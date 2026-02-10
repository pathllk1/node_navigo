/**
 * Purchase Bill Form Component
 */

export function PurchaseBillForm({ billId = null }) {
  return `
    <form id="purchase-bill-form" class="space-y-6">
      <!-- Bill Header -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Bill No</label>
          <input type="text" id="bill_no" readonly
                 class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Bill Date *</label>
          <input type="date" id="bill_date" required
                 class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Supplier Invoice No</label>
          <input type="text" id="supplier_invoice_no"
                 class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
      </div>

      <!-- Supplier Selection -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
          <select id="party_id" required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="">Select Supplier</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
          <input type="text" id="party_gstin" readonly
                 class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
        </div>
      </div>

      <!-- Line Items -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium text-gray-700">Items</label>
          <button type="button" data-action="add-item"
                  class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
            + Add Item
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 border">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Rate</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">GST%</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">GST Amt</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody id="items-tbody" class="bg-white divide-y divide-gray-200">
              <!-- Items will be added here -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Totals -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <div class="grid grid-cols-2 gap-2 max-w-md ml-auto">
          <div class="text-right font-medium">Subtotal:</div>
          <div class="text-right" id="subtotal">₹0.00</div>
          
          <div class="text-right font-medium">CGST:</div>
          <div class="text-right" id="cgst">₹0.00</div>
          
          <div class="text-right font-medium">SGST:</div>
          <div class="text-right" id="sgst">₹0.00</div>
          
          <div class="text-right font-medium">IGST:</div>
          <div class="text-right" id="igst">₹0.00</div>
          
          <div class="text-right font-medium text-lg">Total:</div>
          <div class="text-right text-lg font-bold text-blue-600" id="total">₹0.00</div>
        </div>
      </div>

      <!-- Notes -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea id="notes" rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
      </div>
    </form>
  `;
}
