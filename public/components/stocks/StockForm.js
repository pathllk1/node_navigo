/**
 * Stock Form Component
 * Form for creating/editing stock items
 */

export function StockForm({ stockId = null }) {
  const units = ['PCS', 'KG', 'GRAM', 'LITER', 'METER', 'BOX', 'DOZEN', 'SET', 'PAIR', 'BUNDLE'];

  return `
    <form id="stock-form" class="space-y-6">
      <!-- Basic Information -->
      <div>
        <h4 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Item Name -->
          <div class="md:col-span-2">
            <label for="item_name" class="block text-sm font-medium text-gray-700 mb-1">
              Item Name <span class="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              id="item_name" 
              name="item_name"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter item name">
          </div>

          <!-- Item Code -->
          <div>
            <label for="item_code" class="block text-sm font-medium text-gray-700 mb-1">
              Item Code
            </label>
            <input 
              type="text" 
              id="item_code" 
              name="item_code"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter item code">
          </div>

          <!-- HSN Code -->
          <div>
            <label for="hsn_code" class="block text-sm font-medium text-gray-700 mb-1">
              HSN Code
            </label>
            <input 
              type="text" 
              id="hsn_code" 
              name="hsn_code"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter HSN code">
          </div>

          <!-- Unit -->
          <div>
            <label for="unit" class="block text-sm font-medium text-gray-700 mb-1">
              Unit <span class="text-red-500">*</span>
            </label>
            <select 
              id="unit" 
              name="unit"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              ${units.map(unit => `<option value="${unit}">${unit}</option>`).join('')}
            </select>
          </div>

          <!-- Category -->
          <div>
            <label for="category" class="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input 
              type="text" 
              id="category" 
              name="category"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter category">
          </div>

          <!-- Status -->
          ${stockId ? `
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select 
              id="status" 
              name="status"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Stock Levels -->
      <div>
        <h4 class="text-lg font-semibold text-gray-900 mb-4">Stock Levels</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${!stockId ? `
          <!-- Opening Stock -->
          <div>
            <label for="opening_stock" class="block text-sm font-medium text-gray-700 mb-1">
              Opening Stock
            </label>
            <input 
              type="number" 
              id="opening_stock" 
              name="opening_stock"
              step="0.01"
              value="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00">
          </div>
          ` : ''}

          <!-- Min Stock -->
          <div>
            <label for="min_stock" class="block text-sm font-medium text-gray-700 mb-1">
              Min Stock (Alert Level)
            </label>
            <input 
              type="number" 
              id="min_stock" 
              name="min_stock"
              step="0.01"
              value="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00">
          </div>

          <!-- Max Stock -->
          <div>
            <label for="max_stock" class="block text-sm font-medium text-gray-700 mb-1">
              Max Stock
            </label>
            <input 
              type="number" 
              id="max_stock" 
              name="max_stock"
              step="0.01"
              value="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00">
          </div>
        </div>
      </div>

      <!-- Pricing -->
      <div>
        <h4 class="text-lg font-semibold text-gray-900 mb-4">Pricing</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Purchase Rate -->
          <div>
            <label for="purchase_rate" class="block text-sm font-medium text-gray-700 mb-1">
              Purchase Rate
            </label>
            <input 
              type="number" 
              id="purchase_rate" 
              name="purchase_rate"
              step="0.01"
              value="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00">
          </div>

          <!-- Sale Rate -->
          <div>
            <label for="sale_rate" class="block text-sm font-medium text-gray-700 mb-1">
              Sale Rate
            </label>
            <input 
              type="number" 
              id="sale_rate" 
              name="sale_rate"
              step="0.01"
              value="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00">
          </div>
        </div>
      </div>

      <!-- Tax Information -->
      <div>
        <h4 class="text-lg font-semibold text-gray-900 mb-4">Tax Information</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- GST Rate -->
          <div>
            <label for="gst_rate" class="block text-sm font-medium text-gray-700 mb-1">
              GST Rate (%)
            </label>
            <select 
              id="gst_rate" 
              name="gst_rate"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
          </div>

          <!-- Cess Rate -->
          <div>
            <label for="cess_rate" class="block text-sm font-medium text-gray-700 mb-1">
              Cess Rate (%)
            </label>
            <input 
              type="number" 
              id="cess_rate" 
              name="cess_rate"
              step="0.01"
              value="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00">
          </div>
        </div>
      </div>

      <!-- Description -->
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea 
          id="description" 
          name="description"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter item description..."></textarea>
      </div>

      ${!stockId ? `
      <!-- Help Text -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p class="text-sm text-blue-800">
          <strong>Note:</strong> Opening stock will be recorded in the stock register. You can adjust stock levels later from the stock movements page.
        </p>
      </div>
      ` : ''}
    </form>
  `;
}
