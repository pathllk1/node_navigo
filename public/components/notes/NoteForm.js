/**
 * Note Form Component (Credit/Debit/Delivery)
 */

export function NoteForm({ noteType = 'CREDIT', noteId = null }) {
  return `
    <form id="note-form" class="space-y-6">
      <!-- Note Header -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Note No</label>
          <input type="text" id="note_no" readonly
                 class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Note Date *</label>
          <input type="date" id="note_date" required
                 class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <input type="text" value="${noteType} NOTE" readonly
                 class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
        </div>
      </div>

      <!-- Party & Reference -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Party *</label>
          <select id="party_id" required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="">Select Party</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Reference Bill No</label>
          <input type="text" id="reference_bill_no"
                 class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
      </div>

      <!-- Reason -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
        <textarea id="reason" rows="2" required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
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
          
          <div class="text-right font-medium">GST:</div>
          <div class="text-right" id="gst">₹0.00</div>
          
          <div class="text-right font-medium text-lg">Total:</div>
          <div class="text-right text-lg font-bold text-blue-600" id="total">₹0.00</div>
        </div>
      </div>
    </form>
  `;
}
