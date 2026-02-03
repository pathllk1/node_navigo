export function Layout(innerHtml) {
  return `
    <!-- Top navbar -->
    <nav class="fixed top-0 left-0 w-full h-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-md flex items-center px-6 z-20">
      <a href="/" data-navigo class="font-bold text-lg">Home</a>
    </nav>

    <!-- Sidebar (fixed) -->
    <div id="sidebar" class="fixed top-16 left-0 bottom-0 bg-gradient-to-b from-purple-700 via-purple-600 to-indigo-700 text-white z-10 flex flex-col justify-between" data-collapsed="true" style="width:60px; transition: width 0.3s;">

      <!-- Sidebar menu items -->
      <ul class="flex flex-col mt-4 space-y-2 relative">
        <li>
          <a href="/" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Home">
            <span class="material-icons">home</span>
            <span class="ml-3 sidebar-text">Home</span>
          </a>
        </li>
        <li>
          <a href="/about" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="About">
            <span class="material-icons">info</span>
            <span class="ml-3 sidebar-text">About</span>
          </a>
        </li>
        <li>
          <a href="/contact" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Contact">
            <span class="material-icons">contact_mail</span>
            <span class="ml-3 sidebar-text">Contact</span>
          </a>
        </li>
        <li>
          <a href="/services" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Services">
            <span class="material-icons">build</span>
            <span class="ml-3 sidebar-text">Services</span>
          </a>
        </li>
        <li>
          <a href="/server-info" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Server Info">
            <span class="material-icons">storage</span>
            <span class="ml-3 sidebar-text">Server Info</span>
          </a>
        </li>
        <li>
          <a href="/auth" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Login/Signup">
            <span class="material-icons">person</span>
            <span class="ml-3 sidebar-text">Login/Signup</span>
          </a>
        </li>
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
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  `;
}
