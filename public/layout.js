export function Layout(innerHtml, currentUser = null) {
  // Check if user is super admin
  const isSuperAdmin = currentUser && currentUser.role === 'super_admin';
  
  // Debug logging
  console.log('Layout rendering:', {
    currentUser: currentUser ? {
      username: currentUser.username,
      role: currentUser.role,
      firm_id: currentUser.firm_id
    } : null,
    isSuperAdmin
  });
  
  return `
    <!-- Top navbar -->
    <nav class="fixed top-0 left-0 w-full h-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-md flex items-center px-6 z-20">
      <a href="/" data-navigo class="font-bold text-lg">Home</a>
      ${currentUser && currentUser.firm_id ? `
      <div class="ml-6 flex gap-4">
        <a href="/reports" data-navigo class="hover:text-gray-200 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          Reports
        </a>
        <a href="/settings" data-navigo class="hover:text-gray-200 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Settings
        </a>
        <a href="/notes" data-navigo class="hover:text-gray-200 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Notes
        </a>
      </div>
      ` : ''}
      <div id="token-timer" class="ml-auto text-sm font-mono opacity-90"></div>
    </nav>

    <!-- Sidebar (fixed) -->
    <div id="sidebar" class="fixed top-16 left-0 bottom-0 bg-gradient-to-b from-purple-700 via-purple-600 to-indigo-700 text-white z-10 flex flex-col justify-between sidebar-collapsed overflow-y-auto" data-collapsed="true">

      <!-- Sidebar menu items -->
      <ul class="flex flex-col mt-4 space-y-2 relative pb-20">
        <li>
          <a href="/" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Home">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
</svg>
            <span class="ml-3 sidebar-text">Home</span>
          </a>
        </li>
        ${isSuperAdmin ? `
        <li class="bg-gradient-to-r from-yellow-500 to-orange-500 rounded mx-2 my-1">
          <a href="/admin" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-orange-600 rounded" data-tooltip="Admin Panel">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
</svg>
            <span class="ml-3 sidebar-text font-bold">Admin Panel</span>
          </a>
        </li>
        ` : ''}
        ${currentUser && currentUser.firm_id ? `
        <li>
          <a href="/masterroll" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Master Roll Dashboard">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
</svg>
            <span class="ml-3 sidebar-text">Master Roll</span>
          </a>
        </li>
        <li>
          <a href="/wages" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Wages Management">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879-2.593c.379-.843.645-1.507.845-2.110.852-2.488.852-4.183 0-6.671-.2-.603-.466-1.267-.845-2.11-.379-.842-.645-1.507-.845-2.109C6.999 2.811 6.765 2 6 2c-.892 0-1.458.754-1.737 2.233-.098.559-.214 1.35-.214 2.267s.116 1.708.214 2.267c-.279 1.479-.845 2.233-1.737 2.233-.638 0-.884.646-.884 1.5s.246 1.5.884 1.5c.892 0 1.458.754 1.737 2.233.098.559.214 1.35.214 2.267s-.116 1.708-.214 2.267c-.279 1.479-.845 2.233-1.737 2.233-.638 0-.884.646-.884 1.5s.246 1.5.884 1.5c.765 0 .999-.811 1.243-2.182.2-.603.466-1.267.845-2.11.379-.842.645-1.507.845-2.109.852-2.488.852-4.183 0-6.671-.2-.603-.466-1.267-.845-2.11-.379-.843-.645-1.507-.845-2.109C6.999 10.811 6.765 10 6 10c-.892 0-1.458.754-1.737 2.233-.098.559-.214 1.35-.214 2.267s.116 1.708.214 2.267m15.738-9.268c.279-1.479.845-2.233 1.737-2.233.638 0 .884-.646.884-1.5s-.246-1.5-.884-1.5c-.765 0-.999.811-1.243 2.182-.2.603-.466 1.267-.845 2.11-.379.842-.645 1.507-.845 2.109-.852 2.488-.852 4.183 0 6.671.2.603.466 1.267.845 2.11.379.843.645 1.507.845 2.109.244 1.371.478 2.182 1.243 2.182.638 0 .884-.646.884-1.5s-.246-1.5-.884-1.5c-.892 0-1.458-.754-1.737-2.233-.098-.559-.214-1.35-.214-2.267s.116-1.708.214-2.267m0-4.534c.279-1.479.845-2.233 1.737-2.233.638 0 .884-.646.884-1.5s-.246-1.5-.884-1.5c-.765 0-.999.811-1.243 2.182-.2.603-.466 1.267-.845 2.11-.379.842-.645 1.507-.845 2.109-.852 2.488-.852 4.183 0 6.671.2.603.466 1.267.845 2.11.379.843.645 1.507.845 2.109.244 1.371.478 2.182 1.243 2.182.638 0 .884-.646.884-1.5s-.246-1.5-.884-1.5c-.892 0-1.458-.754-1.737-2.233-.098-.559-.214-1.35-.214-2.267s.116-1.708.214-2.267" />
</svg>
            <span class="ml-3 sidebar-text">Wages</span>
          </a>
        </li>
        <li>
          <a href="/parties" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Parties Management">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <span class="ml-3 sidebar-text">Parties</span>
          </a>
        </li>
        <li>
          <a href="/stocks" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Stock Management">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <span class="ml-3 sidebar-text">Stocks</span>
          </a>
        </li>
        <li>
          <a href="/sales" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Sales Management">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            <span class="ml-3 sidebar-text">Sales</span>
          </a>
        </li>
        <li>
          <a href="/purchase" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Purchase Management">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span class="ml-3 sidebar-text">Purchase</span>
          </a>
        </li>
        <li>
          <a href="/ledger" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Ledger Management">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span class="ml-3 sidebar-text">Ledger</span>
          </a>
        </li>
        <li>
          <a href="/vouchers" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Vouchers">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span class="ml-3 sidebar-text">Vouchers</span>
          </a>
        </li>
        <li>
          <a href="/banking" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Banking">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
            <span class="ml-3 sidebar-text">Banking</span>
          </a>
        </li>
        ` : ''}
        <li>
          <a href="/auth" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Login/Signup">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
</svg>
            <span class="ml-3 sidebar-text">Login/Signup</span>
          </a>
        </li>
        ${currentUser ? `
        <li>
          <button id="logout-btn" class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-red-500 rounded w-full text-left" data-tooltip="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
</svg>
            <span class="ml-3 sidebar-text">Logout</span>
          </button>
        </li>
        ` : ''}
      </ul>


      <!-- Sidebar toggle button -->
      <button id="sidebar-toggle"
              class="absolute top-1/2 right-[-12px] transform -translate-y-1/2 w-6 h-6 bg-white text-black rounded-full flex items-center justify-center shadow-md cursor-pointer z-20">
        &gt;
      </button>
    </div>

    <!-- Main content -->
    <div class="ml-[60px] pt-16 pb-12 transition-all duration-300" id="main-content">
      <main class="px-6 py-4">
        ${innerHtml}
      </main>
    </div>

    <!-- Bottom footer -->
    <footer class="fixed bottom-0 left-0 w-full h-12 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white text-center flex items-center justify-center text-sm z-10">
      &copy; 2026 My SPA. All rights reserved.
    </footer>

    <!-- Google Material Icons -->
  `;
}
