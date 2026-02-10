/**
 * DatePicker Component
 * Simple date picker with DD-MM-YYYY format
 */

export function DatePicker({ 
  id,
  name,
  label,
  value = '',
  required = false,
  disabled = false,
  minDate = null,
  maxDate = null,
  placeholder = 'DD-MM-YYYY',
  className = ''
}) {
  
  // Convert DD-MM-YYYY to YYYY-MM-DD for input[type="date"]
  const toInputValue = (ddmmyyyy) => {
    if (!ddmmyyyy) return '';
    const parts = ddmmyyyy.split('-');
    if (parts.length !== 3) return '';
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };
  
  const inputValue = toInputValue(value);
  
  return `
    <div class="date-picker-wrapper ${className}">
      ${label ? `
        <label for="${id}" class="block text-sm font-medium text-gray-700 mb-1">
          ${label}
          ${required ? '<span class="text-red-500">*</span>' : ''}
        </label>
      ` : ''}
      <div class="relative">
        <input 
          type="date"
          id="${id}"
          name="${name}"
          value="${inputValue}"
          ${required ? 'required' : ''}
          ${disabled ? 'disabled' : ''}
          ${minDate ? `min="${toInputValue(minDate)}"` : ''}
          ${maxDate ? `max="${toInputValue(maxDate)}"` : ''}
          placeholder="${placeholder}"
          class="date-picker-input block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}"
          data-format="dd-mm-yyyy"
        />
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
      </div>
    </div>
  `;
}

/**
 * Get date value in DD-MM-YYYY format from input
 */
export function getDateValue(inputId) {
  const input = document.getElementById(inputId);
  if (!input || !input.value) return '';
  
  // Convert YYYY-MM-DD to DD-MM-YYYY
  const parts = input.value.split('-');
  if (parts.length !== 3) return '';
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

/**
 * Set date value in DD-MM-YYYY format to input
 */
export function setDateValue(inputId, ddmmyyyy) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  if (!ddmmyyyy) {
    input.value = '';
    return;
  }
  
  // Convert DD-MM-YYYY to YYYY-MM-DD
  const parts = ddmmyyyy.split('-');
  if (parts.length !== 3) return;
  input.value = `${parts[2]}-${parts[1]}-${parts[0]}`;
}

/**
 * Get current date in DD-MM-YYYY format
 */
export function getCurrentDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format date to DD-MM-YYYY
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Parse DD-MM-YYYY to Date object
 */
export function parseDate(ddmmyyyy) {
  if (!ddmmyyyy) return null;
  const parts = ddmmyyyy.split('-');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Validate date format DD-MM-YYYY
 */
export function isValidDate(ddmmyyyy) {
  if (!ddmmyyyy) return false;
  const date = parseDate(ddmmyyyy);
  return date !== null;
}

/**
 * Compare two dates in DD-MM-YYYY format
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDates(date1, date2) {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  
  if (!d1 || !d2) return 0;
  
  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
}

/**
 * Add days to a date
 */
export function addDays(ddmmyyyy, days) {
  const date = parseDate(ddmmyyyy);
  if (!date) return '';
  
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/**
 * Get date range for common periods
 */
export function getDateRange(period) {
  const today = new Date();
  let fromDate, toDate;
  
  switch (period) {
    case 'today':
      fromDate = toDate = formatDate(today);
      break;
      
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      fromDate = toDate = formatDate(yesterday);
      break;
      
    case 'this_week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      fromDate = formatDate(weekStart);
      toDate = formatDate(today);
      break;
      
    case 'this_month':
      fromDate = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
      toDate = formatDate(today);
      break;
      
    case 'last_month':
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      fromDate = formatDate(lastMonth);
      toDate = formatDate(new Date(today.getFullYear(), today.getMonth(), 0));
      break;
      
    case 'this_year':
      fromDate = formatDate(new Date(today.getFullYear(), 0, 1));
      toDate = formatDate(today);
      break;
      
    case 'last_year':
      fromDate = formatDate(new Date(today.getFullYear() - 1, 0, 1));
      toDate = formatDate(new Date(today.getFullYear() - 1, 11, 31));
      break;
      
    default:
      fromDate = toDate = formatDate(today);
  }
  
  return { fromDate, toDate };
}

/**
 * Setup date picker listeners for form validation
 */
export function setupDatePickerValidation(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  const dateInputs = form.querySelectorAll('input[type="date"][data-format="dd-mm-yyyy"]');
  
  dateInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      const value = e.target.value;
      
      // Validate min/max dates
      if (input.min && value < input.min) {
        input.setCustomValidity('Date is before minimum allowed date');
      } else if (input.max && value > input.max) {
        input.setCustomValidity('Date is after maximum allowed date');
      } else {
        input.setCustomValidity('');
      }
    });
  });
}
