export function SlsRptPage() {
  const html = `
    <div style="padding:20px; height:100vh; box-sizing:border-box;">
      <h1 style="font-size:24px; font-weight:bold; margin-bottom:16px;">
        Sales Report
      </h1>

      <iframe
        id="agGridFrame"
        style="
          width:100%;
          height:calc(100% - 180px);
          border:none;
          border-radius:12px;
          background:white;
          box-shadow:0 10px 25px rgba(0,0,0,0.08);
        ">
      </iframe>
    </div>
  `;

function scripts() {
    const iframe = document.getElementById("agGridFrame");

    // Listen for messages from iframe
    window.addEventListener('message', (event) => {
      // Handle PDF print request from iframe
      if (event.data?.action === 'PRINT_PDF') {
        const billId = event.data.billId;
        console.log('Received print request for bill ID:', billId);
        
        const pdfUrl = `/api/inventory/sales/bills/${billId}/pdf`;
        
        fetch(pdfUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.blob();
          })
          .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `bill-${billId}.pdf`;
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
          })
          .catch(err => {
            console.error('Failed to download PDF:', err);
            alert('Failed to download PDF. Please check the console for details.');
          });
        return;
      }

      // Handle iframe ready signal
      if (event.data === 'IFRAME_READY') {
        console.log('Iframe ready, fetching data...');
        // Now fetch data and send to iframe
        fetch('/api/inventory/sales/bills')
          .then(res => res.json())
          .then(data => {
            iframe.contentWindow.postMessage(data, '*');
            console.log(data);
          })
          .catch(err => console.error('Failed to fetch sales bills:', err));
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
          <title>Sales Bills Report</title>
          <script src="https://cdn.tailwindcss.com"><\/script>
          <style>
            html, body { margin:0; padding:0; height:100%; }
            #myGrid { width:100%; height:100%; }
          </style>
        </head>
        <body>
          <div id="myGrid"></div>
          
          <div id="modal" class="hidden fixed inset-0 bg-black/50 z-50 items-center justify-center">
            <div class="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
              <div class="flex justify-between items-center mb-5 pb-3 border-b-2">
                <div class="text-xl font-bold text-gray-800">Bill Details</div>
                <button onclick="closeModal()" class="text-2xl text-gray-500 hover:bg-gray-100 w-8 h-8 flex items-center justify-center rounded-lg transition">&times;</button>
              </div>
              <div id="modalBody" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
              <div class="flex gap-3 justify-end mt-6 pt-4 border-t-2">
                <button onclick="closeModal()" class="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition font-medium">
                  Close
                </button>
                <button id="printBtn" onclick="printBillPDF()" class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                  </svg>
                  Print PDF
                </button>
              </div>
            </div>
          </div>
          
          <script src="/cdns/ag-grid-enterprise.min.js"><\/script>
          <script>
            console.log('Iframe script starting...');
            const eGridDiv = document.getElementById('myGrid');
            let globalRowData = []; // Store data locally to access by ID
            let currentBillId = null; // Store the current bill ID being viewed

            // Modal functions
            window.showModal = function(id) {
              const rowData = globalRowData.find(r => String(r.id) === String(id));
              if(!rowData) return;

              currentBillId = id; // Store bill ID for print function
              const modal = document.getElementById('modal');
              const modalBody = document.getElementById('modalBody');
              
              const fields = [
                { label: 'ID', key: 'id' },
                { label: 'Bill No', key: 'bno' },
                { label: 'Date', key: 'bdate' },
                { label: 'Supplier', key: 'supply' },
                { label: 'Gross Total', key: 'gtot' },
                { label: 'Net Total', key: 'ntot' },
                { label: 'ROF', key: 'rof' },
                { label: 'CGST', key: 'cgst' },
                { label: 'SGST', key: 'sgst' },
                { label: 'IGST', key: 'igst' },
                { label: 'Type', key: 'btype' },
                { label: 'Status', key: 'status' }
              ];
              
              // Correctly escaped backticks and interpolation
              modalBody.innerHTML = fields.map(field => \`
                <div class="flex p-3 bg-gray-50 rounded-lg">
                  <div class="font-semibold text-gray-700 min-w-[120px]">\${field.label}:</div>
                  <div class="text-gray-900 flex-1">\${rowData[field.key] || '-'}</div>
                </div>
              \`).join('');
              
              modal.classList.remove('hidden');
              modal.classList.add('flex');
            };
            
            window.closeModal = function() {
              const modal = document.getElementById('modal');
              modal.classList.add('hidden');
              modal.classList.remove('flex');
              currentBillId = null;
            };

            // Print PDF function - sends bill ID to parent
            window.printBillPDF = function() {
              if (!currentBillId) {
                alert('No bill selected');
                return;
              }
              // Send message to parent page with bill ID
              window.parent.postMessage({ action: 'PRINT_PDF', billId: currentBillId }, '*');
            };
            
            document.getElementById('modal').addEventListener('click', function(e) {
              if (e.target === this) closeModal();
            });

            // Listen for data from parent
            window.addEventListener('message', (event) => {
              const rowData = event.data;
              
              if(!Array.isArray(rowData)) return;
              globalRowData = rowData; // Save for modal lookup
              console.log('Valid row data, creating grid...');

              // compute total row for grand total
              const totalRow = {
                bno: 'Total Bills',
                gtot: rowData.reduce((sum,r)=>sum+(r.gtot||0),0),
                ntot: rowData.reduce((sum,r)=>sum+(r.ntot||0),0),
                rof: rowData.reduce((sum,r)=>sum+(r.rof||0),0),
                cgst: rowData.reduce((sum,r)=>sum+(r.cgst||0),0),
                sgst: rowData.reduce((sum,r)=>sum+(r.sgst||0),0),
                igst: rowData.reduce((sum,r)=>sum+(r.igst||0),0),
                status:''
              };

              const numberFormatter = (params) => 
  typeof params.value === 'number' ? params.value.toFixed(2) : params.value;

              const columnDefs = [
                { field: 'id', headerName: 'ID', hide: true },
                { 
                  field: 'action', 
                  headerName: 'Action', 
                  cellRenderer: (params) => {
                    if (params.data.bno === 'Total Bills') return '';
                    // Pass only the ID to avoid JSON stringification linting errors
                    return \`
                      <button class="p-2 rounded hover:bg-gray-200 transition inline-flex" onclick="showModal('\${params.data.id}')">
                        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      </button>
                    \`;
                  },
                  width: 80,
                  sortable: false,
                  filter: false,
                  pinned: 'left'
                },
                { field: 'bno', headerName: 'Bill No', sortable:true, filter:true },
                { field: 'bdate', headerName: 'Date', sortable:true, filter:true },
                { field: 'supply', headerName: 'Supplier', sortable:true, filter:true },
                { field: 'gtot', headerName: 'Gross Total', sortable:true, filter:'agNumberColumnFilter', valueFormatter: numberFormatter },
                { field: 'ntot', headerName: 'Net Total', sortable:true, filter:'agNumberColumnFilter', valueFormatter: numberFormatter },
                { field: 'rof', headerName: 'ROF', sortable:true, filter:'agNumberColumnFilter', valueFormatter: numberFormatter },
                { field: 'cgst', headerName: 'CGST', sortable:true, filter:'agNumberColumnFilter', valueFormatter: numberFormatter },
                { field: 'sgst', headerName: 'SGST', sortable:true, filter:'agNumberColumnFilter', valueFormatter: numberFormatter },
                { field: 'igst', headerName: 'IGST', sortable:true, filter:'agNumberColumnFilter', valueFormatter: numberFormatter },
                { field: 'btype', headerName: 'Type', sortable:true, filter:true },
                { field: 'status', headerName: 'Status', sortable:true, filter:true }
              ];

              const gridOptions = {
                theme: agGrid.themeQuartz,
                columnDefs,
                rowData,
                defaultColDef: { flex:1, minWidth:120, resizable:true },
                animateRows:true,
                pagination:true,
                paginationPageSize:10,
                paginationPageSizeSelector:[10,20,50],
                autoGroupColumnDef: {
                  headerName: 'Supplier',
                  minWidth:200,
                  cellRendererParams: {
                    footerValueGetter: (params) => {
                      if(params.node.footer && params.node.aggData){
                        return 'Total G: $' + params.node.aggData.gtot;
                      }
                      return null;
                    }
                  }
                },
                groupDefaultExpanded:0, // collapsed
                pinnedBottomRowData:[totalRow]
              };

              console.log('Creating grid with options:', gridOptions);
              agGrid.createGrid(eGridDiv, gridOptions);

              function resizeGrid(){
                eGridDiv.style.height = (window.innerHeight - 20) + 'px';
              }
              window.addEventListener('resize', resizeGrid);
              resizeGrid();

            });

            // Signal parent that iframe is ready
            console.log('Sending ready signal to parent');
            window.parent.postMessage('IFRAME_READY', '*');
          <\/script>
        </body>
        </html>
      `);
      doc.close();
    };

    iframe.src = 'about:blank';
  }

  return { html, scripts };
}