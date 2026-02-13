export function StcMovementPage() {
  const html = `
    <div class="relative min-h-screen bg-[#f8fafc] overflow-hidden font-sans">
      <div class="absolute top-0 left-0 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div class="absolute bottom-0 right-0 w-96 h-96 bg-indigo-300/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      <div class="relative z-10 p-8">
        <div class="max-w-9xl mx-auto mb-8 flex justify-between items-end">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 tracking-tight">
              Stock Movement
            </h1>
            <p class="text-gray-500 mt-2">
              Track inward and outward stock transactions across all batches.
            </p>
          </div>
          </div>

        <div class="max-w-9xl mx-auto rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl p-6">
          <iframe
            id="movGridFrame"
            class="w-full rounded-2xl border-0"
            style="height:65vh; background:white;">
          </iframe>
        </div>
      </div>
    </div>
  `;

  function scripts() {
    const iframe = document.getElementById("movGridFrame");

    function fetchMovements() {
      fetch("/api/inventory/sales/stock-movements")
        .then(res => res.json())
        .then(data => {
            if (data && data.rows) {
                iframe.contentWindow.postMessage(data.rows, "*");
            }
        })
        .catch(err => console.error("Failed to fetch movements:", err));
    }

    window.addEventListener("message", (event) => {
      if (event.data === "IFRAME_READY") {
        fetchMovements();
      }
    });

    iframe.onload = function () {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="/cdns/ag-grid-enterprise.min.js"></script>
  <style>
    html, body { margin:0; padding:0; height:100%; font-family: sans-serif; }
    #movGrid { width:100%; height:100%; }
    
    /* Type Colors */
    .type-in { color: #059669; font-weight: bold; }
    .type-out { color: #dc2626; font-weight: bold; }
    
    /* Header Styling */
    .ag-header {
        background-color: #e0e7ff !important; /* Indigo-100 */
        border-bottom: 2px solid #c7d2fe !important;
        font-family: 'Inter', sans-serif;
    }
    .ag-header-cell-label {
        color: #3730a3; /* Indigo-800 */
        font-weight: 700;
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.05em;
    }
    
    /* Group Row Styling */
    .ag-row-group {
        background-color: #f8fafc !important;
        font-weight: 600;
    }
    
    /* Status Bar Styling */
    .ag-status-bar { border-top: 1px solid #e2e8f0 !important; background: white !important; }
  </style>
</head>
<body class="bg-white">
  <div id="movGrid"></div>

  <div id="viewModal" class="fixed inset-0 z-[9999] hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onclick="closeViewModal()"></div>
    <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:w-full sm:max-w-2xl border border-gray-100">
          <div class="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 class="text-xl font-bold text-gray-900">Movement Details</h3>
              <button onclick="closeViewModal()" class="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
          </div>
          <div class="px-6 py-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                  <div><label class="block text-xs font-bold text-gray-400 uppercase">Bill No</label><p id="m_bno" class="text-sm font-medium text-gray-900">-</p></div>
                  <div><label class="block text-xs font-bold text-gray-400 uppercase">Date</label><p id="m_date" class="text-sm font-medium text-gray-900">-</p></div>
              </div>
              <div><label class="block text-xs font-bold text-gray-400 uppercase">Party</label><p id="m_party" class="text-sm font-medium text-gray-900">-</p></div>
              <hr class="border-gray-100">
              <div><label class="block text-xs font-bold text-gray-400 uppercase">Item</label><p id="m_item" class="text-sm font-medium text-gray-900">-</p></div>
              <div class="grid grid-cols-3 gap-4">
                  <div><label class="block text-xs font-bold text-gray-400 uppercase">Batch</label><p id="m_batch" class="text-sm font-medium text-gray-900">-</p></div>
                  <div><label class="block text-xs font-bold text-gray-400 uppercase">Qty</label><p id="m_qty" class="text-sm font-medium text-gray-900">-</p></div>
                  <div><label class="block text-xs font-bold text-gray-400 uppercase">Rate</label><p id="m_rate" class="text-sm font-medium text-gray-900">-</p></div>
              </div>
              <div class="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span class="text-sm font-bold text-gray-900">Total Value</span>
                  <span id="m_total" class="text-lg font-black text-indigo-600">₹0.00</span>
              </div>
          </div>
          <div class="bg-gray-50 px-6 py-4 flex justify-end">
            <button onclick="closeViewModal()" class="px-5 py-2 text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    (function(){
      const eGridDiv = document.querySelector('#movGrid');

      // --- CUSTOM FOOTER COMPONENT ---
      class CustomFooter {
          init(params) {
              this.eGui = document.createElement('div');
              this.eGui.className = "flex items-center gap-3 px-2";
              
              const btnExport = document.createElement('button');
              btnExport.className = "inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200 hover:bg-green-100 transition shadow-sm";
              btnExport.innerHTML = \`<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Export CSV\`;
              btnExport.onclick = () => params.api.exportDataAsCsv();

              const btnRefresh = document.createElement('button');
              btnRefresh.className = "inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-700 text-xs font-medium rounded border border-gray-200 hover:bg-gray-100 transition shadow-sm";
              btnRefresh.innerHTML = \`<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Refresh\`;
              btnRefresh.onclick = () => window.parent.postMessage("IFRAME_READY", "*");

              this.eGui.appendChild(btnRefresh);
              this.eGui.appendChild(btnExport);
          }
          getGui() { return this.eGui; }
      }

      // --- MODAL LOGIC ---
      window.showModal = function(id) {
         if(!window.gridApi) return;
         let selected = null;
         window.gridApi.forEachNode(node => { if (node.data && node.data.id == id) selected = node.data; });

         if (selected) {
             document.getElementById('m_bno').textContent = selected.bno || '-';
             document.getElementById('m_date').textContent = selected.bill_date || '-';
             document.getElementById('m_party').textContent = selected.party_name || '-';
             document.getElementById('m_item').textContent = selected.stock_item || '-';
             document.getElementById('m_batch').textContent = selected.batch || '-';
             document.getElementById('m_qty').textContent = selected.qty + ' ' + (selected.uom || '');
             document.getElementById('m_rate').textContent = '₹' + (selected.rate || 0).toFixed(2);
             document.getElementById('m_total').textContent = '₹' + (selected.total || 0).toFixed(2);
             document.getElementById('viewModal').classList.remove('hidden');
         }
      };
      window.closeViewModal = () => document.getElementById('viewModal').classList.add('hidden');

      const columnDefs = [
        { 
          headerName: 'Action', 
          width: 70,
          pinned: 'left',
          cellRenderer: (p) => {
            if (p.node.group) return ''; // Hide button on group row
            return \`<button class="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition inline-flex items-center justify-center mt-1" onclick="showModal('\${p.data.id}')" title="View Details">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>\`;
          }
        },
        // 'bno' is the grouping field. We hide it so it only appears in the AutoGroupColumn
        { field: 'bno', headerName: 'Bill No', rowGroup: true, hide: true },
        
        { 
          field: 'type', 
          headerName: 'Type', 
          width: 100,
          cellClassRules: {
            'type-in': p => p.value === 'RECEIPT' || p.value === 'OPENING',
            'type-out': p => p.value === 'SALE'
          }
        },
        { field: 'bill_date', headerName: 'Date', width: 120 },
        { field: 'party_name', headerName: 'Supplier/Customer', minWidth: 200 },
        { field: 'stock_item', headerName: 'Item Name', minWidth: 200 },
        { field: 'batch', headerName: 'Batch', width: 130 },
        { field: 'hsn', headerName: 'HSN', width: 100 },
        
        // Qty with Aggregation
        { 
          field: 'qty', 
          headerName: 'Qty', 
          aggFunc: 'sum', // Enables sum on group row
          type: 'numericColumn',
          valueFormatter: p => p.value ? p.value.toFixed(2) : '0.00',
          cellStyle: params => {
              if (params.node.group) return { fontWeight: 'bold', color: '#333' };
              return null;
          }
        },
        { field: 'uom', headerName: 'UOM', width: 80 },
        { 
          field: 'rate', 
          headerName: 'Rate', 
          type: 'numericColumn',
          valueFormatter: p => p.value ? '₹' + p.value.toFixed(2) : '₹0.00',
          // Use a cellRenderer to return empty string if it is a group row
          cellRenderer: params => {
              if (params.node.group) return ''; // Blank for group rows
              return '₹' + (params.value ? params.value.toFixed(2) : '0.00');
          }
        },
        
        // Total with Aggregation
        { 
          field: 'total', 
          headerName: 'Total', 
          aggFunc: 'sum', // Enables sum on group row
          type: 'numericColumn',
          valueFormatter: p => p.value ? '₹' + p.value.toFixed(2) : '₹0.00',
          cellStyle: { fontWeight: 'bold' }
        }
      ];

      const gridOptions = {
        columnDefs: columnDefs,
        theme: agGrid.themeQuartz,
        defaultColDef: { flex: 1, minWidth: 100, resizable: true, sortable: true, filter: true },
        
        // Configures the Group Column
        autoGroupColumnDef: { 
            headerName: 'Bill Details', 
            minWidth: 220,
            cellRendererParams: {
                suppressCount: false // Shows (count) next to bill number
            }
        },
        
        // REMOVED 'groupDisplayType: "groupRows"' to allow columns to align and show sums
        groupDefaultExpanded: 0,
        
        animateRows: true,
        pagination: true,
        paginationPageSize: 10,
        paginationPageSizeSelector: [10,20,50,100],
        cellSelection: true,
        components: { customFooter: CustomFooter },
        statusBar: {
          statusPanels: [
            { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
            { statusPanel: 'customFooter', align: 'right' }
          ]
        },
        onGridReady: (params) => {
          window.gridApi = params.api;
          window.parent.postMessage("IFRAME_READY", "*");
        }
      };

      agGrid.createGrid(eGridDiv, gridOptions);

      window.addEventListener('message', function(event) {
        if (Array.isArray(event.data)) {
          window.gridApi.setGridOption('rowData', event.data);
        }
      });
    })();
  </script>
</body>
</html>
      `);
      doc.close();
    };
    iframe.src = "about:blank";
  }

  return { html, scripts };
}