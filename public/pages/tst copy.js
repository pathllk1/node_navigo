export function TstPage() {
    const html = `
    <div class="max-w-12xl mx-auto p-6">
      <h1 class="text-2xl font-bold text-purple-700 mb-4">Countries</h1>
      <iframe id="countries-iframe"  style="width:100%; height:70vh; border:1px solid #ccc;"></iframe>
    </div>
  `;

    function scripts() {
        fetch("/tst/countries")
            .then(res => res.json())
            .then(countries => {
                const iframe = document.getElementById("countries-iframe");
                const doc = iframe.contentDocument || iframe.contentWindow.document;

                const rowDataString = JSON.stringify(countries).replace(/</g, '\\u003c');

                doc.open();
                doc.write(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>Countries Grid</title>

            <!-- ag-Grid Balham CSS -->
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/styles/ag-grid.css">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/styles/ag-theme-balham.css">

            <style>
              html, body { height: 100%; margin: 0; padding: 0; font-family: Arial, sans-serif; }
              body { display: flex; flex-direction: column; }

              /* Toolbar styles */
              .grid-toolbar {
                display: flex;
                gap: 8px;
                align-items: center;
                padding: 6px;
                background: linear-gradient(to right, #ff9800, #ffb74d, #ffcc80);
                color: white;
                font-weight: bold;
              }
              .grid-toolbar button {
                padding: 4px 12px;
                border: none;
                border-radius: 4px;
                background: rgba(255,255,255,0.2);
                color: white;
                cursor: pointer;
                font-weight: bold;
              }
              .grid-toolbar button:hover {
                background: rgba(255,255,255,0.4);
              }

              /* Grid header gradient */
              .ag-theme-balham .ag-header {
                background: linear-gradient(to right, #6b5b95, #b8a9c9, #4caf50);
                color: white;
                font-weight: bold;
              }
              .ag-theme-balham .ag-header-cell-label {
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
              }

              #myGrid { flex: 1; width: 100%; } /* fill remaining height */
            </style>
          </head>
          <body>
            <!-- Toolbar -->
            <div class="grid-toolbar">
              <button id="exportCsv">Export CSV</button>
              <button id="fitColumns">Fit Columns</button>
              <button id="clearFilters">Clear Filters</button>
            </div>

            <!-- Grid container -->
            <div id="myGrid" class="ag-theme-balham"></div>

            <!-- ag-Grid JS -->
            <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
            <script>
              let gridApi;
              let gridColumnApi;

              const columnDefs = [
                { headerName: "#", valueGetter: "node.rowIndex + 1", width: 70 },
                { headerName: "Name", field: "name",},
                { headerName: "Area (km²)", field: "area" },
                { headerName: "Population", field: "population" },
                { headerName: "GDP (M USD)", field: "gdp" },
                { headerName: "Continent", field: "continent" },
                { headerName: "Capital", field: "capital" },
                { headerName: "Currency", field: "currency" }
              ];

              const gridOptions = {
                columnDefs,
                rowData: ${rowDataString},
                pagination: true,
                paginationPageSize: 10,
                paginationPageSizeSelector: [10, 20, 50, 100],
                defaultColDef: { sortable: true, filter: true, resizable: true, flex: 1, minWidth: 100 },
                undoRedoCellEditing: true,
    undoRedoCellEditingLimit: 20,
    defaultColDef: { editable: true, filter: true, resizable: true },
                onGridReady: params => {
                  gridApi = params.api;
                  gridColumnApi = params.columnApi;

                  gridApi.sizeColumnsToFit();

                  // Toolbar button events
                  document.getElementById('exportCsv').addEventListener('click', () => gridApi.exportDataAsCsv());
                  document.getElementById('fitColumns').addEventListener('click', () => gridApi.sizeColumnsToFit());
                  document.getElementById('clearFilters').addEventListener('click', () => gridApi.setFilterModel(null));
                }
              };

              const eGridDiv = document.querySelector('#myGrid');
              agGrid.createGrid(eGridDiv, gridOptions);
            </script>
          </body>
          </html>
        `);
                doc.close();
            })
            .catch(err => console.error(err));
    }

    return { html, scripts };
}
