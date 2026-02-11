/**
 * HISTORY MODAL COMPONENT
 * Displays party item history with pagination
 */

export async function openPartyItemHistoryModal(stock, state, onFetchHistory) {
    if (!state.selectedParty || !state.selectedParty.id) {
        alert('Please select a party first to view history.');
        return;
    }

    const modal = document.getElementById('modal-backdrop');
    const content = document.getElementById('modal-content');
    if (!modal || !content) return;

    modal.classList.remove('hidden');

    // Fetch history data from API
    let historyData = [];
    try {
        const response = await fetch(`/api/inventory/sales/stock-movements?partyId=${state.selectedParty.id}&stockId=${stock.id}`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            historyData = await response.json();
        } else {
            console.warn('Failed to fetch history:', response.status);
            historyData = [];
        }
    } catch (error) {
        console.error('Error fetching history:', error);
        historyData = [];
    }

    const paginationState = {
        currentPage: 1,
        itemsPerPage: 10,
        filteredData: historyData || []
    };

    function renderPage() {
        const startIdx = (paginationState.currentPage - 1) * paginationState.itemsPerPage;
        const endIdx = Math.min(startIdx + paginationState.itemsPerPage, paginationState.filteredData.length);
        const pageData = paginationState.filteredData.slice(startIdx, endIdx);

        const totalRecords = paginationState.filteredData.length;
        const totalPages = Math.ceil(totalRecords / paginationState.itemsPerPage);

        content.innerHTML = `
            <div class="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div>
                    <h3 class="font-bold text-lg text-gray-800">${stock.item} - Purchase History</h3>
                    <p class="text-xs text-gray-500 mt-1">Party: <strong>${state.selectedParty.firm}</strong></p>
                </div>
                <button id="close-modal" class="text-gray-400 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>

            <div class="flex-1 overflow-y-auto p-0 bg-gray-50">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-white text-[11px] font-bold text-gray-500 uppercase sticky top-0 border-b border-gray-200 shadow-sm z-10">
                        <tr>
                            <th class="p-3">Date</th>
                            <th class="p-3">Batch</th>
                            <th class="p-3 text-right">Qty</th>
                            <th class="p-3 text-right">Rate</th>
                            <th class="p-3 text-right">Total</th>
                            <th class="p-3">Ref No</th>
                        </tr>
                    </thead>
                    <tbody class="text-xs text-gray-700 divide-y divide-gray-100 bg-white">
                        ${pageData.length === 0 
                            ? `<tr><td colspan="6" class="p-10 text-center text-gray-400 italic">No purchase history found</td></tr>`
                            : pageData.map(record => `
                                <tr class="hover:bg-blue-50 transition-colors">
                                    <td class="p-3">${record.date || '-'}</td>
                                    <td class="p-3 font-mono text-gray-500">${record.batch || '-'}</td>
                                    <td class="p-3 text-right">${record.qty}</td>
                                    <td class="p-3 text-right">${record.rate}</td>
                                    <td class="p-3 text-right font-bold">${record.total}</td>
                                    <td class="p-3 text-gray-500">${record.refNo || '-'}</td>
                                </tr>
                            `).join('')
                        }
                    </tbody>
                </table>
            </div>

            <div class="p-3 border-t border-gray-200 bg-white flex justify-between items-center text-xs">
                <div class="text-gray-600">
                    Showing ${startIdx + 1}-${endIdx} of ${totalRecords} records
                </div>
                <div class="flex gap-2">
                    <button id="prev-page" class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" ${paginationState.currentPage === 1 ? 'disabled' : ''}>
                        Previous
                    </button>
                    <div class="flex items-center gap-2">
                        ${Array.from({ length: totalPages }, (_, i) => i + 1).map(page => `
                            <button class="page-btn px-2 py-1 rounded ${page === paginationState.currentPage ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-100'}" data-page="${page}">
                                ${page}
                            </button>
                        `).join('')}
                    </div>
                    <button id="next-page" class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" ${paginationState.currentPage === totalPages ? 'disabled' : ''}>
                        Next
                    </button>
                </div>
            </div>
        `;

        // Attach pagination listeners
        document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');
        
        document.getElementById('prev-page').onclick = () => {
            if (paginationState.currentPage > 1) {
                paginationState.currentPage--;
                renderPage();
            }
        };

        document.getElementById('next-page').onclick = () => {
            if (paginationState.currentPage < totalPages) {
                paginationState.currentPage++;
                renderPage();
            }
        };

        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                paginationState.currentPage = parseInt(e.target.getAttribute('data-page'));
                renderPage();
            });
        });
    }

    renderPage();
}
