/**
 * Party Form Component
 * Form for creating/editing parties
 */

export function PartyForm({ partyId = null }) {
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
    'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  return `
    <form id="party-form" class="space-y-6">
      <!-- Basic Information -->
      <div>
        <h4 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Party Name -->
          <div class="md:col-span-2">
            <label for="party_name" class="block text-sm font-medium text-gray-700 mb-1">
              Party Name <span class="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              id="party_name" 
              name="party_name"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter party name">
          </div>

          <!-- Party Type -->
          <div>
            <label for="party_type" class="block text-sm font-medium text-gray-700 mb-1">
              Party Type <span class="text-red-500">*</span>
            </label>
            <select 
              id="party_type" 
              name="party_type"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="CUSTOMER">Customer</option>
              <option value="SUPPLIER">Supplier</option>
              <option value="BOTH">Both</option>
            </select>
          </div>

          <!-- Status -->
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
        </div>
      </div>

      <!-- Contact Information -->
      <div>
        <h4 class="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Contact Person -->
          <div>
            <label for="contact_person" class="block text-sm font-medium text-gray-700 mb-1">
              Contact Person
            </label>
            <input 
              type="text" 
              id="contact_person" 
              name="contact_person"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter contact person name">
          </div>

          <!-- Phone -->
          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input 
              type="tel" 
              id="phone" 
              name="phone"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone number">
          </div>

          <!-- Email -->
          <div class="md:col-span-2">
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input 
              type="email" 
              id="email" 
              name="email"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address">
          </div>
        </div>
      </div>

      <!-- Address Information -->
      <div>
        <h4 class="text-lg font-semibold text-gray-900 mb-4">Address Information</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Address -->
          <div class="md:col-span-2">
            <label for="address" class="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea 
              id="address" 
              name="address"
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter full address"></textarea>
          </div>

          <!-- City -->
          <div>
            <label for="city" class="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input 
              type="text" 
              id="city" 
              name="city"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter city">
          </div>

          <!-- State -->
          <div>
            <label for="state" class="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <select 
              id="state" 
              name="state"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select State</option>
              ${indianStates.map(state => `<option value="${state}">${state}</option>`).join('')}
            </select>
          </div>

          <!-- Pincode -->
          <div>
            <label for="pincode" class="block text-sm font-medium text-gray-700 mb-1">
              Pincode
            </label>
            <input 
              type="text" 
              id="pincode" 
              name="pincode"
              maxlength="6"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter pincode">
          </div>

          <!-- PAN -->
          <div>
            <label for="pan" class="block text-sm font-medium text-gray-700 mb-1">
              PAN
            </label>
            <input 
              type="text" 
              id="pan" 
              name="pan"
              maxlength="10"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter PAN number"
              style="text-transform: uppercase;">
          </div>
        </div>
      </div>

      <!-- Financial Information -->
      <div>
        <h4 class="text-lg font-semibold text-gray-900 mb-4">Financial Information</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Opening Balance -->
          <div>
            <label for="opening_balance" class="block text-sm font-medium text-gray-700 mb-1">
              Opening Balance
            </label>
            <input 
              type="number" 
              id="opening_balance" 
              name="opening_balance"
              step="0.01"
              value="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00">
          </div>

          <!-- Balance Type -->
          <div>
            <label for="balance_type" class="block text-sm font-medium text-gray-700 mb-1">
              Balance Type
            </label>
            <select 
              id="balance_type" 
              name="balance_type"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Dr">Debit (Dr)</option>
              <option value="Cr">Credit (Cr)</option>
            </select>
          </div>

          <!-- Credit Limit -->
          <div>
            <label for="credit_limit" class="block text-sm font-medium text-gray-700 mb-1">
              Credit Limit
            </label>
            <input 
              type="number" 
              id="credit_limit" 
              name="credit_limit"
              step="0.01"
              value="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00">
          </div>

          <!-- Credit Days -->
          <div>
            <label for="credit_days" class="block text-sm font-medium text-gray-700 mb-1">
              Credit Days
            </label>
            <input 
              type="number" 
              id="credit_days" 
              name="credit_days"
              value="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0">
          </div>
        </div>
      </div>

      <!-- Help Text -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p class="text-sm text-blue-800">
          <strong>Note:</strong> GST numbers can be added after creating the party from the party details page.
        </p>
      </div>
    </form>
  `;
}
