export function Layout(innerHtml) {
  return `
    <!-- Top navbar -->
    <nav class="fixed top-0 left-0 w-full h-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-md flex items-center px-6 z-20">
      <a href="/" data-navigo class="font-bold text-lg">Home</a>
      <div id="token-timer" class="ml-auto text-sm font-mono opacity-90"></div>
    </nav>

    <!-- Sidebar (fixed) -->
    <div id="sidebar" class="fixed top-16 left-0 bottom-0 bg-gradient-to-b from-purple-700 via-purple-600 to-indigo-700 text-white z-10 flex flex-col justify-between sidebar-collapsed" data-collapsed="true">

      <!-- Sidebar menu items -->
      <ul class="flex flex-col mt-4 space-y-2 relative">
        <li>
          <a href="/" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Home">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
</svg>
            <span class="ml-3 sidebar-text">Home</span>
          </a>
        </li>
        <li>
          <a href="/about" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="About">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
</svg>
            <span class="ml-3 sidebar-text">About</span>
          </a>
        </li>
        <li>
          <a href="/contact" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Contact">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
</svg>
            <span class="ml-3 sidebar-text">Contact</span>
          </a>
        </li>
        <li>
          <a href="/services" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Services">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75a4.5 4.5 0 0 1-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 1 1-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 0 1 6.336-4.486l-3.276 3.276a3.004 3.004 0 0 0 2.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852Z" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M4.867 19.125h.008v.008h-.008v-.008Z" />
</svg>
            <span class="ml-3 sidebar-text">Services</span>
          </a>
        </li>
        <li>
          <a href="/server-info" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Server Info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 0 0-.12-1.03l-2.268-9.64a3.375 3.375 0 0 0-3.285-2.602H7.923a3.375 3.375 0 0 0-3.285 2.602l-2.268 9.64a4.5 4.5 0 0 0-.12 1.03v.228m19.5 0a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3m19.5 0a3 3 0 0 0-3-3H5.25a3 3 0 0 0-3 3m16.5 0h.008v.008h-.008v-.008Zm-3 0h.008v.008h-.008v-.008Z" />
</svg>
            <span class="ml-3 sidebar-text">Server Info</span>
          </a>
        </li>
        <li>
          <a href="/auth" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Login/Signup">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
</svg>
            <span class="ml-3 sidebar-text">Login/Signup</span>
          </a>
        </li>
        <li>
          <a href="/tst" data-navigo class="sidebar-item flex items-center px-4 py-3 cursor-pointer hover:bg-purple-500 rounded" data-tooltip="Test">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 9.75V10.5" />
</svg>
            <span class="ml-3 sidebar-text">Test</span>
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
  `;
}
