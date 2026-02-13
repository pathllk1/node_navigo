export function SlsDashPage() {
  const html = `
  <div class="relative min-h-screen bg-[#f8fafc] overflow-hidden">

    <!-- Background Glow Effects -->
    <div class="absolute top-0 left-0 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
    <div class="absolute bottom-0 right-0 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

    <div class="relative z-10 p-8">

      <!-- Header -->
      <div class="max-w-7xl mx-auto mb-12">
        <nav class="text-sm text-gray-400 mb-3">
          <span class="hover:text-gray-600 cursor-pointer transition">Dashboard</span>
          <span class="mx-2">/</span>
          <span class="text-gray-700 font-medium">Inventory</span>
        </nav>

        <h1 class="text-4xl font-bold text-gray-900 tracking-tight">
          Sales Dashboard
        </h1>
        <p class="text-gray-500 mt-2 text-lg">
          Manage sales, reports and stock insights in one place.
        </p>
      </div>

      <!-- Cards Grid -->
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

        <!-- SALES CARD -->
        <div class="group relative p-8 rounded-3xl bg-white/70 backdrop-blur-xl 
                    border border-white/40 shadow-xl 
                    transition duration-500 hover:scale-[1.03] hover:shadow-2xl">

          <!-- Gradient Glow -->
          <div class="absolute inset-0 rounded-3xl bg-gradient-to-br 
                      from-emerald-400/0 to-emerald-500/0 
                      group-hover:from-emerald-400/10 group-hover:to-emerald-500/10 
                      transition duration-500"></div>

          <div class="relative z-10">

            <div class="w-14 h-14 flex items-center justify-center rounded-2xl 
                        bg-gradient-to-br from-emerald-500 to-green-600 
                        text-white shadow-lg mb-6">
              <!-- Trending Up Icon -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                   viewBox="0 0 24 24" stroke-width="1.8"
                   stroke="currentColor" class="w-7 h-7">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M3 17l6-6 4 4 8-8M14 7h7v7" />
              </svg>
            </div>

            <h2 class="text-xl font-semibold text-gray-900 mb-2">Sales</h2>
            <p class="text-gray-500 mb-6">
              Track transactions and manage daily sales operations.
            </p>

            <a href="/inventory/sls" data-navigo
               class="inline-flex items-center justify-center px-5 py-3 
                      rounded-xl bg-emerald-600 text-white font-medium
                      shadow-md hover:bg-emerald-700 
                      transition duration-300">
              Open Sales
            </a>
          </div>
        </div>


        <!-- REPORTS CARD -->
        <div class="group relative p-8 rounded-3xl bg-white/70 backdrop-blur-xl 
                    border border-white/40 shadow-xl 
                    transition duration-500 hover:scale-[1.03] hover:shadow-2xl">

          <div class="absolute inset-0 rounded-3xl bg-gradient-to-br 
                      from-blue-400/0 to-indigo-500/0 
                      group-hover:from-blue-400/10 group-hover:to-indigo-500/10 
                      transition duration-500"></div>

          <div class="relative z-10">

            <div class="w-14 h-14 flex items-center justify-center rounded-2xl 
                        bg-gradient-to-br from-blue-500 to-indigo-600 
                        text-white shadow-lg mb-6">
              <!-- Chart Icon -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                   viewBox="0 0 24 24" stroke-width="1.8"
                   stroke="currentColor" class="w-7 h-7">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M3 3v18h18M9 17V9m4 8V5m4 12v-6" />
              </svg>
            </div>

            <h2 class="text-xl font-semibold text-gray-900 mb-2">Reports</h2>
            <p class="text-gray-500 mb-6">
              Analyze performance and generate sales insights.
            </p>

            <a href="/inventory/sls/rpt" data-navigo
               class="inline-flex items-center justify-center px-5 py-3 
                      rounded-xl bg-blue-600 text-white font-medium
                      shadow-md hover:bg-blue-700 
                      transition duration-300">
              View Reports
            </a>
          </div>
        </div>


        <!-- STOCK CARD -->
        <div class="group relative p-8 rounded-3xl bg-white/70 backdrop-blur-xl 
                    border border-white/40 shadow-xl 
                    transition duration-500 hover:scale-[1.03] hover:shadow-2xl">

          <div class="absolute inset-0 rounded-3xl bg-gradient-to-br 
                      from-orange-400/0 to-amber-500/0 
                      group-hover:from-orange-400/10 group-hover:to-amber-500/10 
                      transition duration-500"></div>

          <div class="relative z-10">

            <div class="w-14 h-14 flex items-center justify-center rounded-2xl 
                        bg-gradient-to-br from-orange-500 to-amber-600 
                        text-white shadow-lg mb-6">
              <!-- Box Icon -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                   viewBox="0 0 24 24" stroke-width="1.8"
                   stroke="currentColor" class="w-7 h-7">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M3 7.5l9-4.5 9 4.5M3 7.5v9l9 4.5 9-4.5v-9M12 3v18" />
              </svg>
            </div>

            <h2 class="text-xl font-semibold text-gray-900 mb-2">Stocks</h2>
            <p class="text-gray-500 mb-6">
              Monitor inventory levels and stock movement insights.
            </p>

            <a href="/inventory/sls/sts" data-navigo
               class="inline-flex items-center justify-center px-5 py-3 
                      rounded-xl bg-orange-600 text-white font-medium
                      shadow-md hover:bg-orange-700 
                      transition duration-300">
              View Stocks
            </a>
          </div>
        </div>

      </div>
    </div>
  </div>
  `;

  function scripts() {
    console.log("Sales Dashboard Loaded - Modern SaaS UI");
  }

  return { html, scripts };
}
