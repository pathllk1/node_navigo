export function TstPage() {
  const html = `
    <div class="max-w-12xl mx-auto p-6">
      <h1 class="text-2xl font-bold text-purple-700 mb-4">Countries</h1>
      <iframe id="countries-iframe" style="width:100%; height:70vh; border:1px solid #ccc;"></iframe>
    </div>
  `;

  function scripts() {
    fetch("/tst/countries")
      .then(res => res.json())
      .then(countries => {
        const iframe = document.getElementById("countries-iframe");
        const doc = iframe.contentDocument || iframe.contentWindow.document;

        const rowDataString = JSON.stringify(countries).replace(/</g, "\\u003c");

        doc.open();
        doc.write(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Countries Grid</title>

<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.2/themes/blitzer/jquery-ui.css">
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://code.jquery.com/ui/1.13.2/jquery-ui.min.js"></script>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/free-jqgrid@4.15.5/css/ui.jqgrid.min.css">
<script src="https://cdn.jsdelivr.net/npm/free-jqgrid@4.15.5/js/jquery.jqgrid.min.js"></script>

<style>
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}
body {
  display: flex;
  flex-direction: column;
}
#grid-container {
  flex: 1;
  padding: 10px;
  overflow: auto;
}
.ui-jqgrid,
.ui-jqgrid-view,
.ui-jqgrid-btable {
  width: 100% !important;
}
.ui-jqgrid-toppager {
  height: auto !important;
  padding: 5px !important;
}
#myGrid_toppager_center,
#myGrid_toppager_right {
  display: none !important;
}
</style>
</head>

<body>
<div id="grid-container">
  <table id="myGrid"></table>
  <div id="myPager"></div>
</div>

<script>
$(document).ready(function () {
  const rowData = ${rowDataString};

  /* ---- FIX 1: Stable numeric IDs (no reindexing bugs) ---- */
  let nextId = 1;
  rowData.forEach(row => {
    if (row.id == null) {
      row.id = nextId++;
    } else {
      nextId = Math.max(nextId, row.id + 1);
    }
  });

  $("#myGrid").jqGrid({
    datatype: "local",
    data: rowData,
    colModel: [
      { label: "#", name: "id", width: 50, key: true, editable: false },
      { label: "Name", name: "name", width: 150, editable: true, search: true },
      { label: "Area (km²)", name: "area", width: 120, sorttype: "number", formatter: "number", align: "right", editable: true },
      { label: "Population", name: "population", width: 120, sorttype: "number", formatter: "number", align: "right", editable: true },
      { label: "GDP (M USD)", name: "gdp", width: 120, sorttype: "number", formatter: "number", align: "right", editable: true },
      { label: "Continent", name: "continent", width: 100, editable: true, search: true },
      { label: "Capital", name: "capital", width: 120, editable: true, search: true },
      { label: "Currency", name: "currency", width: 100, editable: true, search: true }
    ],
    viewrecords: true,
    height: "auto",
    rowNum: 10,
    rowList: [10, 20, 50, 100],
    pager: "#myPager",
    sortname: "name",
    sortorder: "asc",
    caption: "Countries Information",
    autowidth: true,
    shrinkToFit: true,
    loadonce: false,
    ignoreCase: true,
    toppager: true
  });

  $("#myGrid").jqGrid("navGrid", "#myGrid_toppager",
    { edit: true, add: true, del: true, search: true, refresh: true, view: true, position: "left" },
    { closeAfterEdit: true, width: 500 },
    {
      closeAfterAdd: true,
      width: 500,
      beforeShowForm: function (form) {
        $("#id", form).val(nextId++).attr("readonly", "readonly");
      }
    },
    { closeAfterDelete: true, width: 400 },
    {
      multipleSearch: true,
      multipleGroup: true,
      showQuery: true,
      width: 650
    },
    { closeAfterView: true, width: 500 }
  );

  /* ---- FIX 2: CSV export (correct + safe) ---- */
  $("#myGrid").jqGrid("navButtonAdd", "#myGrid_toppager", {
    caption: "Export CSV",
    buttonicon: "ui-icon-arrowthickstop-1-s",
    onClickButton: function () {
      const escapeCsv = v => '"' + String(v ?? "").replace(/"/g, '""') + '"';
      const data = $("#myGrid").jqGrid("getGridParam", "data");

      let csv = "ID,Name,Area,Population,GDP,Continent,Capital,Currency\\n";
      data.forEach(r => {
        csv += [
          escapeCsv(r.id),
          escapeCsv(r.name),
          escapeCsv(r.area),
          escapeCsv(r.population),
          escapeCsv(r.gdp),
          escapeCsv(r.continent),
          escapeCsv(r.capital),
          escapeCsv(r.currency)
        ].join(",") + "\\n";
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "countries.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  });

  $("#myGrid").jqGrid("navButtonAdd", "#myGrid_toppager", {
    caption: "Clear Filters",
    buttonicon: "ui-icon-refresh",
    onClickButton: function () {
      $("#myGrid")[0].clearToolbar();
      $("#myGrid").jqGrid("setGridParam", { search: false, postData: { filters: "" } });
      $("#myGrid").trigger("reloadGrid");
    }
  });

  $("#myGrid").jqGrid("navButtonAdd", "#myGrid_toppager", {
    caption: "Fit Columns",
    buttonicon: "ui-icon-grip-dotted-horizontal",
    onClickButton: function () {
      $("#myGrid").jqGrid("setGridWidth", $("#grid-container").width() - 20, true);
    }
  });

  $("#myGrid").jqGrid("filterToolbar", {
    stringResult: true,
    searchOnEnter: false,
    defaultSearch: "cn"
  });

  $(window).on("resize", function () {
    $("#myGrid").jqGrid("setGridWidth", $("#grid-container").width() - 20, true);
  });
});
</script>
</body>
</html>
        `);
        doc.close();
      })
      .catch(console.error);
  }

  return { html, scripts };
}
