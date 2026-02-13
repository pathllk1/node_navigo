export function SlsDashPage() {
  const html = `
   <div class="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">

  <!-- Dashboard Header -->
  <div class="max-w-6xl mx-auto mb-10">
    <nav class="text-sm text-gray-500 mb-2">
      <span class="hover:text-gray-700 cursor-pointer">Dashboard</span>
      <span class="mx-2">/</span>
      <span class="text-gray-700 font-medium">Inventory</span>
    </nav>
    <h1 class="text-3xl font-bold text-gray-800">Sales Dashboard</h1>
    <p class="text-gray-500 mt-1">Overview of sales activity and reporting</p>
  </div>

  <!-- Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-10 max-w-6xl mx-auto">

    <!-- Sales Card -->
    <div class="group relative backdrop-blur-lg bg-white/60 border border-white/40 
                rounded-2xl p-8 shadow-lg transition-all duration-300 
                hover:-translate-y-2 hover:shadow-2xl">
      
      <!-- Animated Gradient Icon -->
      <div class="mx-auto mb-6 flex items-center justify-center w-16 h-16 
                  rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 
                  bg-[length:200%_200%] animate-gradient-x text-white shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg"
             fill="none"
             viewBox="0 0 24 24"
             stroke-width="1.5"
             stroke="currentColor"
             class="w-8 h-8">
          <path stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835L5.76 8.25m0 0h12.99c.51 0 .955.343 1.087.835l.833 3.333a1.125 1.125 0 0 1-1.087 1.415H6.75m-1-5.583L4.5 5.25m1.26 3h13.24M6.75 16.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm12 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
        </svg>
      </div>

      <h2 class="text-xl font-semibold text-gray-800 mb-2 text-center">Sales</h2>
      <p class="text-sm text-gray-600 text-center mb-6">
        Manage transactions and daily sales operations.
      </p>

      <!-- Stats Preview -->
      <div class="grid grid-cols-2 gap-4 mb-6 text-center">
        
      </div>

      <a href="/inventory/sls" data-navigo
         class="block w-full text-center bg-purple-600 text-white py-3 rounded-xl 
                font-medium shadow hover:bg-purple-700 transition">
        Go to Sales Page
      </a>
    </div>


    <!-- Reports Card -->
    <div class="group relative backdrop-blur-lg bg-white/60 border border-white/40 
                rounded-2xl p-8 shadow-lg transition-all duration-300 
                hover:-translate-y-2 hover:shadow-2xl">
      
      <!-- Animated Gradient Icon -->
      <div class="mx-auto mb-6 flex items-center justify-center w-16 h-16 
                  rounded-xl bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500 
                  bg-[length:200%_200%] animate-gradient-x text-white shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg"
             fill="none"
             viewBox="0 0 24 24"
             stroke-width="1.5"
             stroke="currentColor"
             class="w-8 h-8">
          <path stroke-linecap="round"
                stroke-linejoin="round"
                d="M19.5 14.25v-8.25a2.25 2.25 0 0 0-2.25-2.25H8.25A2.25 2.25 0 0 0 6 6v12a2.25 2.25 0 0 0 2.25 2.25h6.75M15 3v4.5a.75.75 0 0 0 .75.75H20M9 13.5h6m-6 3h6m-6-6h3" />
        </svg>
      </div>

      <h2 class="text-xl font-semibold text-gray-800 mb-2 text-center">Reports</h2>
      <p class="text-sm text-gray-600 text-center mb-6">
        View analytics and sales performance insights.
      </p>

      <!-- Stats Preview -->
      <div class="grid grid-cols-2 gap-4 mb-6 text-center">
        
      </div>

      <a href="/inventory/sls/rpt" data-navigo
         class="block w-full text-center bg-indigo-600 text-white py-3 rounded-xl 
                font-medium shadow hover:bg-indigo-700 transition">
        View Sales Reports
      </a>
    </div>

  </div>
</div>

  `;

  function scripts() {
    // Optional scripts for Contact page
    console.log("Contact page loaded");
  }

  return { html, scripts };
}
