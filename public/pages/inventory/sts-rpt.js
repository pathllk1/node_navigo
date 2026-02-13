export function StockPage() {
  const html = `
    <div class="relative min-h-screen bg-[#f8fafc] overflow-hidden">
      <div class="absolute top-0 left-0 w-96 h-96 bg-indigo-300/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div class="absolute bottom-0 right-0 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      <div class="relative z-10 p-8">
        <div class="max-w-7xl mx-auto mb-8">
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight">
            Stock Report
          </h1>
          <p class="text-gray-500 mt-2">
            Real-time inventory overview and stock analytics.
          </p>
        </div>

        <div class="max-w-7xl mx-auto rounded-3xl bg-white/70 backdrop-blur-xl
                    border border-white/40 shadow-xl p-6">

          <iframe
            id="agGridFrame"
            class="w-full rounded-2xl border-0"
            style="height:75vh; background:white;">
          </iframe>

        </div>
      </div>
    </div>
  `;

  function scripts() {
    const iframe = document.getElementById("agGridFrame");

    window.addEventListener("message", (event) => {
      if (event.data === "IFRAME_READY") {
        fetch("/api/inventory/sales/stocks")
          .then(res => res.json())
          .then(data => iframe.contentWindow.postMessage(data, "*"))
          .catch(err => console.error("Failed to fetch stocks:", err));
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
<title>Stock Grid</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<script src="/cdns/ag-grid-enterprise.min.js"><\/script>
<style>
html, body { margin:0; padding:0; height:100%; }
#myGrid { width:100%; height:100%; }
</style>
</head>
<body>
<div id="myGrid"></div>

<script>
(function(){

  const eGridDiv = document.getElementById('myGrid');

  function numberFormatter(params) {
    return typeof params.value === 'number' ? params.value.toFixed(2) : params.value;
  }

  window.addEventListener('message', function(event) {
    const rowData = event.data;
    if (!Array.isArray(rowData)) return;

    const totalRow = {
      item: 'Total',
      qty: rowData.reduce((sum,r)=>sum+(r.qty||0),0),
      total: rowData.reduce((sum,r)=>sum+(r.total||0),0)
    };

    const columnDefs = [
      { field: 'id', hide:true },
      { field: 'item', sortable:true, filter:true },
      { field: 'oem', sortable:true, filter:true },
      { field: 'hsn', sortable:true, filter:true },
      { field: 'qty', filter:'agNumberColumnFilter', valueFormatter:numberFormatter },
      { field: 'uom' },
      { field: 'rate', filter:'agNumberColumnFilter', valueFormatter:numberFormatter },
      { field: 'grate', filter:'agNumberColumnFilter', valueFormatter:numberFormatter },
      { field: 'mrp', filter:'agNumberColumnFilter', valueFormatter:numberFormatter },
      { field: 'total', filter:'agNumberColumnFilter', valueFormatter:numberFormatter },
      {
        field: 'batches',
        headerName: 'Batches',
        flex: 2,
        cellRenderer: function(params) {
          if (!params.value) return '';

          let batches = [];
          try {
            batches = typeof params.value === 'string' ? JSON.parse(params.value) : params.value;
          } catch { batches = []; }

          if (!batches.length) return '-';

          const container = document.createElement('div');
          container.style.position = 'relative';

          const btn = document.createElement('button');
          btn.textContent = 'View (' + batches.length + ')';
          btn.className = 'px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition';

          const dropdown = document.createElement('div');
          dropdown.style.position = 'absolute';
          dropdown.style.top = '28px';
          dropdown.style.left = '0';
          dropdown.style.zIndex = '9999';
          dropdown.style.display = 'none';
          dropdown.className = 'bg-white border border-gray-200 shadow-xl rounded-xl p-2 w-56 max-h-60 overflow-y-auto';

          batches.forEach(b => {
            const row = document.createElement('div');
            row.className = 'flex justify-between px-2 py-1 text-sm hover:bg-gray-100 rounded';
            const name = document.createElement('span');
            name.textContent = b.batchNo || b.batch || '-';
            const qty = document.createElement('span');
            qty.textContent = b.qty || 0;
            qty.className = 'text-gray-500';
            row.appendChild(name);
            row.appendChild(qty);
            dropdown.appendChild(row);
          });

          btn.addEventListener('click', e => {
            e.stopPropagation();
            const isVisible = dropdown.style.display === 'block';
            document.querySelectorAll('.shadow-xl').forEach(d => d.style.display = 'none');
            dropdown.style.display = isVisible ? 'none' : 'block';
          });

          container.appendChild(btn);
          container.appendChild(dropdown);
          return container;
        }
      }
    ];

    agGrid.createGrid(eGridDiv, {
      theme: agGrid.themeQuartz,
      columnDefs,
      rowData,
      defaultColDef: { flex:1, minWidth:120, resizable:true },
      animateRows:true,
      pagination:true,
      paginationPageSize:20,
      paginationPageSizeSelector:[10,20,50,100],
      pinnedBottomRowData:[totalRow]
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.shadow-xl').forEach(d => d.style.display = 'none');
    });

  });

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
