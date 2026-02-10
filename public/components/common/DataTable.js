/**
 * DataTable Component
 * Reusable data table with sorting, filtering, and pagination
 */

export function DataTable({ 
  columns, 
  data, 
  onSort, 
  onFilter, 
  onPageChange,
  currentPage = 1,
  totalPages = 1,
  sortColumn = null,
  sortDirection = 'asc',
  filters = {},
  emptyMessage = 'No data available'
}) {
  
  const renderTableHeader = () => {
    return `
      <thead class="bg-gray-50">
        <tr>
          ${columns.map(col => `
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}"
                data-action="${col.sortable ? 'sort-column' : ''}"
                data-column="${col.key}">
              <div class="flex items-center gap-2">
                <span>${col.label}</span>
                ${col.sortable ? `
                  <span class="sort-icon">
                    ${sortColumn === col.key ? 
                      (sortDirection === 'asc' ? '↑' : '↓') : 
                      '↕'}
                  </span>
                ` : ''}
              </div>
            </th>
          `).join('')}
        </tr>
      </thead>
    `;
  };
  
  const renderTableBody = () => {
    if (!data || data.length === 0) {
      return `
        <tbody>
          <tr>
            <td colspan="${columns.length}" class="px-6 py-8 text-center text-gray-500">
              ${emptyMessage}
            </td>
          </tr>
        </tbody>
      `;
    }
    
    return `
      <tbody class="bg-white divide-y divide-gray-200">
        ${data.map((row, index) => `
          <tr class="hover:bg-gray-50 ${row._highlight ? 'bg-yellow-50' : ''}">
            ${columns.map(col => {
              const value = col.render ? col.render(row, index) : row[col.key];
              return `
                <td class="px-6 py-4 whitespace-nowrap text-sm ${col.className || ''}">
                  ${value !== null && value !== undefined ? value : '-'}
                </td>
              `;
            }).join('')}
          </tr>
        `).join('')}
      </tbody>
    `;
  };
  
  const renderPagination = () => {
    if (totalPages <= 1) return '';
    
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return `
      <div class="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
        <div class="text-sm text-gray-700">
          Page ${currentPage} of ${totalPages}
        </div>
        <div class="flex gap-2">
          <button 
            data-action="page-change" 
            data-page="${currentPage - 1}"
            ${currentPage === 1 ? 'disabled' : ''}
            class="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
          
          ${startPage > 1 ? `
            <button data-action="page-change" data-page="1" 
                    class="px-3 py-1 text-sm border rounded hover:bg-gray-50">1</button>
            ${startPage > 2 ? '<span class="px-2 py-1">...</span>' : ''}
          ` : ''}
          
          ${pages.map(page => `
            <button 
              data-action="page-change" 
              data-page="${page}"
              class="px-3 py-1 text-sm border rounded ${page === currentPage ? 'bg-blue-500 text-white' : 'hover:bg-gray-50'}">
              ${page}
            </button>
          `).join('')}
          
          ${endPage < totalPages ? `
            ${endPage < totalPages - 1 ? '<span class="px-2 py-1">...</span>' : ''}
            <button data-action="page-change" data-page="${totalPages}" 
                    class="px-3 py-1 text-sm border rounded hover:bg-gray-50">${totalPages}</button>
          ` : ''}
          
          <button 
            data-action="page-change" 
            data-page="${currentPage + 1}"
            ${currentPage === totalPages ? 'disabled' : ''}
            class="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Next
          </button>
        </div>
      </div>
    `;
  };
  
  return `
    <div class="data-table overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          ${renderTableHeader()}
          ${renderTableBody()}
        </table>
      </div>
      ${renderPagination()}
    </div>
  `;
}

/**
 * Setup event listeners for DataTable
 * Call this after rendering the table
 */
export function setupDataTableListeners(container, { onSort, onPageChange }) {
  // Sort column click
  container.addEventListener('click', (e) => {
    const sortBtn = e.target.closest('[data-action="sort-column"]');
    if (sortBtn && onSort) {
      const column = sortBtn.dataset.column;
      onSort(column);
    }
    
    // Page change click
    const pageBtn = e.target.closest('[data-action="page-change"]');
    if (pageBtn && onPageChange && !pageBtn.disabled) {
      const page = parseInt(pageBtn.dataset.page);
      onPageChange(page);
    }
  });
}
