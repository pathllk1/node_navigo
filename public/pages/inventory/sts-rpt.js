import { openCreateStockModal } from '../../components/inventory/sls/stockCrud.js';

export function StockPage() {
  const html = `
    <div class="relative min-h-screen bg-[#f8fafc] overflow-hidden font-sans">
      <div class="absolute top-0 left-0 w-96 h-96 bg-indigo-300/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div class="absolute bottom-0 right-0 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      <div class="relative z-10 p-8">
        <div class="max-w-9xl mx-auto mb-8 flex justify-between items-end">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 tracking-tight">
              Stock Report
            </h1>
            <p class="text-gray-500 mt-2">
              Real-time inventory overview and stock analytics.
            </p>
          </div>
          
          <button id="openStockModalBtn" 
            class="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add New Stock
          </button>
        </div>

        <div class="max-w-9xl mx-auto rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl p-6">
          <iframe
            id="agGridFrame"
            class="w-full rounded-2xl border-0"
            style="height:65vh; background:white;">
          </iframe>
        </div>
      </div>

      <div id="sub-modal-backdrop" class="fixed inset-0 z-[60] hidden bg-gray-900/50 backdrop-blur-sm flex justify-center items-center transition-opacity p-4">
          <div id="sub-modal-content" class="w-full max-w-2xl lg:max-w-4xl bg-white h-auto rounded-2xl shadow-2xl transform transition-transform duration-300 overflow-hidden relative">
          </div>
      </div>
      
    </div>
  `;

  function scripts() {
    const iframe = document.getElementById("agGridFrame");
    
    // --- Data Fetching Logic (Used for Refresh) ---
    function fetchStocks() {
      fetch("/api/inventory/sales/stocks")
        .then(res => res.json())
        .then(data => {
            iframe.contentWindow.postMessage(data, "*");
        })
        .catch(err => {
            console.error("Failed to fetch stocks:", err);
        });
    }

    // --- Wire up the Add Stock Button ---
    document.getElementById("openStockModalBtn").addEventListener("click", () => {
        // We pass 'fetchStocks' as the callback so the grid auto-refreshes after save
        openCreateStockModal({}, fetchStocks);
    });

    // --- Iframe Communication ---
    window.addEventListener("message", async (event) => {
      if (event.data === "IFRAME_READY") {
        fetchStocks();
      } else if (event.data.type === "UPDATE_STOCK") {
        // Handle stock update request from iframe
        const { id, data } = event.data;
        
        try {
          const response = await fetch(`/api/inventory/sales/stocks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
          });
          
          const result = await response.json();
          
          if (response.ok) {
            // Notify iframe of successful update
            iframe.contentWindow.postMessage({ type: 'UPDATE_SUCCESS', id }, '*');
            
            // Refresh the grid with updated data
            fetchStocks();
          } else {
            // Notify iframe of error
            iframe.contentWindow.postMessage({ 
              type: 'UPDATE_ERROR', 
              message: result.error || 'Failed to update stock' 
            }, '*');
          }
        } catch (error) {
          // Notify iframe of error
          iframe.contentWindow.postMessage({ 
            type: 'UPDATE_ERROR', 
            message: error.message 
          }, '*');
        }
      } else if (event.data.type === "DELETE_STOCK") {
        // Handle stock delete request from iframe
        const { id } = event.data;
        
        try {
          const response = await fetch(`/api/inventory/sales/stocks/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });
          
          const result = await response.json();
          
          if (response.ok) {
            // Notify iframe of successful deletion
            iframe.contentWindow.postMessage({ type: 'DELETE_SUCCESS', id }, '*');
            
            // Refresh the grid with updated data
            fetchStocks();
          } else {
            // Notify iframe of error
            iframe.contentWindow.postMessage({ 
              type: 'DELETE_ERROR', 
              message: result.error || 'Failed to delete stock' 
            }, '*');
          }
        } catch (error) {
          // Notify iframe of error
          iframe.contentWindow.postMessage({ 
            type: 'DELETE_ERROR', 
            message: error.message 
          }, '*');
        }
      }
    });

    // --- Initialize Iframe ---
    iframe.onload = function () {
      const doc = iframe.contentDocument || iframe.contentWindow.document;

      doc.open();
      doc.write(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Stock Grid</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="/cdns/ag-grid-enterprise.min.js"></script>
<link rel="stylesheet" href="/cdns/toastify.css">
<script src="/cdns/toastify.js"></script>
<style>
  html, body { margin:0; padding:0; height:100%; font-family: sans-serif; }
  #myGrid { width:100%; height:100%; }
  
  /* Details Row Background */
  .ag-details-row { background-color: #f8fafc; } 
  
  /* Custom Scrollbar for Batch Table inside Modal */
  .batch-scroll::-webkit-scrollbar { width: 6px; }
  .batch-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
  .batch-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
  
  /* Status Bar Customization */
  .ag-status-bar { 
      border-top: 1px solid #e2e8f0 !important; 
      background: white !important; 
      padding-top: 0 !important;
      padding-bottom: 0 !important;
  }
</style>
</head>
<body class="bg-white">

<div id="myGrid"></div>

<div id="viewModal" class="fixed inset-0 z-[9999] hidden relative" aria-labelledby="modal-title" role="dialog" aria-modal="true">
  <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onclick="closeViewModal()"></div>

  <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
    <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
      
      <div class="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl border border-gray-100">
        
        <div class="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 class="text-xl font-bold text-gray-900" id="modal-title">Stock Details</h3>
            <button onclick="closeViewModal()" class="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div class="bg-white px-6 py-6">
            <form id="viewForm">
                
                <div class="mb-6">
                    <h4 class="text-sm uppercase tracking-wide text-indigo-600 font-bold mb-3 border-b pb-1 border-indigo-100">Item Information</h4>
                    
                    <div class="grid grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                                <input type="text" id="modal_item" class="w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition shadow-sm">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">OEM / Manufacturer</label>
                                <input type="text" id="modal_oem" class="w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition shadow-sm">
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                                    <input type="text" id="modal_hsn" class="w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition shadow-sm">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">UOM</label>
                                    <input type="text" id="modal_uom" class="w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition shadow-sm">
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                                <input type="number" id="modal_grate" class="w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition shadow-sm">
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <div class="flex justify-between items-end mb-2 border-b pb-1 border-indigo-100">
                        <h4 class="text-sm uppercase tracking-wide text-indigo-600 font-bold">Batch Inventory</h4>
                        <span class="text-xs text-indigo-500">Detailed view of all batches</span>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                        <div class="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 text-xs font-semibold text-gray-600 border-b border-gray-200">
                            <div class="col-span-3">Batch No</div>
                            <div class="col-span-2 text-right">Qty</div>
                            <div class="col-span-2 text-right">Rate</div>
                            <div class="col-span-2 text-right">MRP</div>
                            <div class="col-span-3 pl-2">Expiry</div>
                        </div>
                        
                        <div id="modal_batches_container" class="max-h-60 overflow-y-auto batch-scroll">
                            </div>
                        
                        <div class="grid grid-cols-12 gap-2 px-4 py-3 bg-indigo-50 border-t border-indigo-100 font-bold text-sm text-indigo-900">
                            <div class="col-span-3">Total</div>
                            <div class="col-span-2 text-right" id="modal_total_qty">0</div>
                            <div class="col-span-7 text-right" id="modal_grand_total_val">₹0.00</div>
                        </div>
                    </div>
                    
                    <div class="mt-4 flex justify-end">
                        <button type="button" id="add_batch_btn" class="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded border border-gray-300 hover:bg-gray-200 transition shadow-sm">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                            Add Batch
                        </button>
                    </div>
                </div>

            </form>
        </div>

        <div class="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse gap-3">
          <button type="button" id="save_modal_btn" class="mt-3 inline-flex w-full justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:mt-0 sm:w-auto transition-all">Save Changes</button>
          <button type="button" id="delete_modal_btn" class="mt-3 inline-flex w-full justify-center rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:mt-0 sm:w-auto transition-all">Delete Stock</button>
          <button type="button" class="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-all" onclick="closeViewModal()">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
(function(){

  const eGridDiv = document.getElementById('myGrid');

  // --- 1. DEFINE CUSTOM FOOTER COMPONENT ---
  class CustomFooter {
      init(params) {
          this.eGui = document.createElement('div');
          this.eGui.className = "flex items-center gap-3 px-2";
          
          // Button 1: Export CSV
          const btnExport = document.createElement('button');
          btnExport.className = "inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200 hover:bg-green-100 transition shadow-sm";
          btnExport.innerHTML = \`
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Export CSV
          \`;
          btnExport.onclick = () => params.api.exportDataAsCsv();

          // Button 2: Refresh Data
          const btnRefresh = document.createElement('button');
          btnRefresh.className = "inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-700 text-xs font-medium rounded border border-gray-200 hover:bg-gray-100 transition shadow-sm";
          btnRefresh.innerHTML = \`
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Refresh
          \`;
          btnRefresh.onclick = () => window.parent.postMessage("IFRAME_READY", "*");

          this.eGui.appendChild(btnRefresh);
          this.eGui.appendChild(btnExport);
      }
      getGui() { return this.eGui; }
  }

  // --- 2. MODAL LOGIC (View Mode) ---
  window.showModal = function(id) {
     if(!window.currentGridApi) return;
       
     // Find the row data
     let selectedData = null;
     window.currentGridApi.forEachNode(node => {
         if (node.data && node.data.id == id) {
             selectedData = node.data;
         }
     });
  
     if (selectedData) {
         // Store the original data for comparison
         window.currentModalData = {...selectedData};
           
         // Populate Global Fields
         document.getElementById('modal_item').value = selectedData.item || '';
         document.getElementById('modal_oem').value = selectedData.oem || '';
         document.getElementById('modal_hsn').value = selectedData.hsn || '';
         document.getElementById('modal_uom').value = selectedData.uom || '';
         document.getElementById('modal_grate').value = selectedData.grate || 0;
           
         document.getElementById('modal_total_qty').textContent = selectedData.qty || 0;
         document.getElementById('modal_grand_total_val').textContent = '₹' + (selectedData.total ? selectedData.total.toFixed(2) : '0.00');
  
         // Populate Batch Rows
         const container = document.getElementById('modal_batches_container');
         container.innerHTML = ''; // Clear previous
  
         let batches = [];
         try {
             const raw = selectedData.batches;
             batches = typeof raw === 'string' ? JSON.parse(raw) : (raw || []);
         } catch(e) { batches = []; }
  
         if (batches.length === 0) {
             container.innerHTML = '<div class="p-4 text-center text-gray-400 text-sm italic">No batches found for this item.</div>';
         } else {
             batches.forEach((b, index) => {
                 // Date Formatting
                 let exp = '';
                 if(b.expiry) {
                     try { exp = new Date(b.expiry).toISOString().split('T')[0]; } catch(e){}
                 }
                   
                 const rowHtml = '<div class="grid grid-cols-12 gap-2 px-4 py-2 border-b border-gray-100 items-center hover:bg-gray-50 transition text-gray-700 batch-row" data-index="' + index + '"><div class="col-span-3"><input type="text" class="w-full rounded border-gray-300 border px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition shadow-sm" value="' + (b.batch || '') + '" placeholder="Batch No"></div><div class="col-span-2"><input type="number" class="w-full rounded border-gray-300 border px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition shadow-sm" value="' + (b.qty || 0) + '" placeholder="Qty"></div><div class="col-span-2"><input type="number" class="w-full rounded border-gray-300 border px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition shadow-sm" value="' + (b.rate || 0) + '" step="0.01" placeholder="Rate"></div><div class="col-span-2"><input type="number" class="w-full rounded border-gray-300 border px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition shadow-sm" value="' + (b.mrp || 0) + '" step="0.01" placeholder="MRP"></div><div class="col-span-3 pl-2"><input type="date" class="w-full rounded border-gray-300 border px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition shadow-sm" value="' + exp + '" placeholder="Expiry"><button type="button" class="remove-batch-btn text-red-500 text-xs ml-2" title="Remove Batch">✕</button></div></div>';
                 container.insertAdjacentHTML('beforeend', rowHtml);
             });
         }
           
         // Show Modal
         document.getElementById('viewModal').classList.remove('hidden');
     }
  };
  
  window.closeViewModal = function() {
      document.getElementById('viewModal').classList.add('hidden');
  };
    
  // Add batch functionality
  document.addEventListener('DOMContentLoaded', function() {
      document.getElementById('add_batch_btn')?.addEventListener('click', function() {
          const container = document.getElementById('modal_batches_container');
          const batchCount = container.querySelectorAll('.batch-row').length;
            
          const newRowHtml = '<div class="grid grid-cols-12 gap-2 px-4 py-2 border-b border-gray-100 items-center hover:bg-gray-50 transition text-gray-700 batch-row" data-index="' + batchCount + '"><div class="col-span-3"><input type="text" class="w-full rounded border-gray-300 border px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition shadow-sm" value="" placeholder="Batch No"></div><div class="col-span-2"><input type="number" class="w-full rounded border-gray-300 border px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition shadow-sm" value="0" placeholder="Qty"></div><div class="col-span-2"><input type="number" class="w-full rounded border-gray-300 border px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition shadow-sm" value="0" step="0.01" placeholder="Rate"></div><div class="col-span-2"><input type="number" class="w-full rounded border-gray-300 border px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition shadow-sm" value="0" step="0.01" placeholder="MRP"></div><div class="col-span-3 pl-2"><input type="date" class="w-full rounded border-gray-300 border px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition shadow-sm" value="" placeholder="Expiry"><button type="button" class="remove-batch-btn text-red-500 text-xs ml-2" title="Remove Batch">✕</button></div></div>';
            
          container.insertAdjacentHTML('beforeend', newRowHtml);
      });
        
      // Event delegation for removing batches
      document.getElementById('modal_batches_container')?.addEventListener('click', function(e) {
          if (e.target.classList.contains('remove-batch-btn')) {
              e.target.closest('.batch-row').remove();
          }
      });
        
      // Save button functionality
      document.getElementById('save_modal_btn')?.addEventListener('click', function() {
          // Disable the save button to prevent duplicate submissions
          this.disabled = true;
                
          // Collect updated data
          const updatedData = {
              id: window.currentModalData.id,
              item: document.getElementById('modal_item').value,
              oem: document.getElementById('modal_oem').value,
              hsn: document.getElementById('modal_hsn').value,
              uom: document.getElementById('modal_uom').value,
              grate: parseFloat(document.getElementById('modal_grate').value) || 0,
              batches: []
          };
                
          // Collect batch data
          const batchRows = document.querySelectorAll('.batch-row');
          batchRows.forEach(row => {
              const inputs = row.querySelectorAll('input');
              const batchData = {
                  batch: inputs[0].value || null,
                  qty: parseFloat(inputs[1].value) || 0,
                  rate: parseFloat(inputs[2].value) || 0,
                  mrp: parseFloat(inputs[3].value) || 0,
                  expiry: inputs[4].value || null
              };
              updatedData.batches.push(batchData);
          });
                
          // Validate required fields
          if (!updatedData.item.trim()) {
              alert('Item name is required');
              // Re-enable the save button
              this.disabled = false;
              return;
          }
                
          // Send update request to parent
          window.parent.postMessage({
              type: 'UPDATE_STOCK',
              id: updatedData.id,
              data: updatedData
          }, '*');
                
          // Close the modal
          closeViewModal();
      });
            
      // Delete button functionality
      document.getElementById('delete_modal_btn')?.addEventListener('click', function() {
          // Confirm deletion with user
          if (!confirm('Are you sure you want to delete this stock item? This action cannot be undone.')) {
              return;
          }
                
          // Send delete request to parent
          window.parent.postMessage({
              type: 'DELETE_STOCK',
              id: window.currentModalData.id
          }, '*');
                
          // Close the modal
          closeViewModal();
      });
  });

  function numberFormatter(params) {
    if (params.value === null || params.value === undefined) return '';
    return typeof params.value === 'number' ? params.value.toFixed(2) : params.value;
  }

  // --- 3. MAIN GRID LOGIC ---
  window.addEventListener('message', function(event) {
    const rowData = event.data;
    if (!Array.isArray(rowData)) return;

    // Calculate Total Row
    const totalRow = {
      item: 'Total',
      qty: rowData.reduce((sum,r)=>sum+(r.qty||0),0),
      total: rowData.reduce((sum,r)=>sum+(r.total||0),0)
    };

    // Column Definitions
    const columnDefs = [
      { field: 'id', hide:true },
      { 
          field: 'action', 
          headerName: 'Action', 
          cellRenderer: (params) => {
            if (params.data.item === 'Total' || params.node.isRowPinned()) return '';
            return \`
              <button class="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition inline-flex items-center justify-center mt-1" onclick="showModal('\${params.data.id}')" title="View Details">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
            \`;
          },
          width: 70,
          sortable: false,
          filter: false,
          pinned: 'left',
          cellStyle: { display: 'flex', justifyContent: 'center' }
      },
      { 
        field: 'item', 
        headerName: 'Item',
        cellRenderer: 'agGroupCellRenderer',
        minWidth: 220,
        filter: 'agTextColumnFilter'
      },
      { field: 'oem', headerName: 'OEM', filter: 'agTextColumnFilter' },
      { field: 'hsn', headerName: 'HSN' },
      { 
        field: 'qty', 
        headerName: 'Total Qty',
        filter: 'agNumberColumnFilter', 
        valueFormatter: numberFormatter,
        cellStyle: { color: '#4f46e5', fontWeight: '500' }
      },
      { field: 'uom', headerName: 'UOM', width: 90 },
      { 
        field: 'rate', 
        headerName: 'Avg Rate',
        filter: 'agNumberColumnFilter', 
        valueFormatter: numberFormatter 
      },
      { 
        field: 'grate', 
        headerName: 'GST %',
        filter: 'agNumberColumnFilter', 
        valueFormatter: numberFormatter,
        width: 100
      },
      { 
        field: 'mrp', 
        headerName: 'MRP',
        filter: 'agNumberColumnFilter', 
        valueFormatter: numberFormatter 
      },
      { 
        field: 'total', 
        headerName: 'Total Value',
        filter: 'agNumberColumnFilter', 
        valueFormatter: numberFormatter,
        cellStyle: { fontWeight: 'bold' }
      }
    ];

    // Destroy existing grid to prevent memory leaks
    if(window.currentGridApi) {
        window.currentGridApi.destroy();
    }

    // Create Grid
    window.currentGridApi = agGrid.createGrid(eGridDiv, {
      theme: agGrid.themeQuartz,
      columnDefs: columnDefs,
      rowData: rowData,
      
      masterDetail: true,
      detailRowHeight: 180,
      
      detailCellRendererParams: {
        detailGridOptions: {
          columnDefs: [
            { 
              field: 'batchNo', 
              headerName: 'Batch Number',
              valueGetter: function(params) {
                return params.data.batchNo || params.data.batch || '-';
              },
              cellStyle: { fontWeight: '500' }
            },
            { field: 'qty', headerName: 'Batch Qty' },
            { field: 'mrp', headerName: 'Batch MRP', valueFormatter: numberFormatter },
            { 
               field: 'expiry', 
               headerName: 'Exp Date',
               valueFormatter: function(params) {
                 return params.value ? new Date(params.value).toLocaleDateString() : '-';
               }
            }
          ],
          defaultColDef: { flex: 1, sortable: true },
          headerHeight: 40,
        },
        
        getDetailRowData: function(params) {
          let batches = [];
          const raw = params.data.batches;
          
          if (raw) {
             try {
               batches = typeof raw === 'string' ? JSON.parse(raw) : raw;
             } catch(e) { 
               console.warn('Error parsing batches', e); 
             }
          }
          
          params.successCallback(batches);
        }
      },

      defaultColDef: { flex:1, minWidth:100, resizable:true, sortable: true, filter: true },
      animateRows: true,
      pagination: true,
      paginationPageSize: 20,
      paginationPageSizeSelector: [10,20,50,100],
      pinnedBottomRowData: [totalRow],

      // --- STATUS BAR CONFIGURATION ---
      components: {
          customFooter: CustomFooter
      },
      statusBar: {
          statusPanels: [
              // Default: Total and filtered row count
              {
                  statusPanel: 'agTotalAndFilteredRowCountComponent',
                  align: 'left'
              },
              // Custom: Refresh and Export Buttons
              {
                  statusPanel: 'customFooter',
                  align: 'right'
              }
          ]
      }
    });

  });

  // Toast notification functions
  function showToast(message, type = 'info') {
    const backgroundColor = {
      success: 'linear-gradient(to right, #00b09b, #96c93d)',
      error: 'linear-gradient(to right, #ff416c, #ff4b2b)',
      warning: 'linear-gradient(to right, #ffb347, #ffcc33)',
      info: 'linear-gradient(to right, #4facfe, #00f2fe)'
    }[type] || 'linear-gradient(to right, #4facfe, #00f2fe)';
    
    Toastify({
      text: message,
      duration: 3000,
      close: true,
      gravity: "top",
      position: "right",
      backgroundColor: backgroundColor,
      stopOnFocus: true,
    }).showToast();
  }

  // Listen for responses from parent page
  window.addEventListener('message', function(event) {
    if (event.data.type === 'UPDATE_SUCCESS') {
      showToast('Stock updated successfully!', 'success');
    } else if (event.data.type === 'UPDATE_ERROR') {
      showToast('Error updating stock: ' + (event.data.message || 'Unknown error'), 'error');
      // Re-enable save button
      document.getElementById('save_modal_btn')?.removeAttribute('disabled');
    } else if (event.data.type === 'DELETE_SUCCESS') {
      showToast('Stock deleted successfully!', 'success');
    } else if (event.data.type === 'DELETE_ERROR') {
      showToast('Error deleting stock: ' + (event.data.message || 'Unknown error'), 'error');
    }
  });
  
  // Signal parent that we are ready to receive data
  window.parent.postMessage("IFRAME_READY", "*");

})();
<\/script>
</body>
</html>
      `);
      doc.close();
    };

    iframe.src = "about:blank";
  }

  return { html, scripts };
}