/**
 * Sidebar Module - Handles sidebar initialization and interactions
 * Uses addEventListener instead of inline event handlers for CSP compliance
 * Uses CSS classes instead of inline styles for CSP compliance
 */

export function initSidebar(currentUser, handleLogout) {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("sidebar-toggle");
  const mainContent = document.getElementById("main-content");
  const sidebarItems = sidebar.querySelectorAll(".sidebar-text");
  const logoutBtn = document.getElementById("logout-btn");

  // Handle logout button visibility and click
  if (logoutBtn) {
    if (currentUser) {
      logoutBtn.classList.remove("hidden-element");
      logoutBtn.classList.add("visible-element");
      logoutBtn.addEventListener("click", handleLogout);
    } else {
      logoutBtn.classList.add("hidden-element");
      logoutBtn.classList.remove("visible-element");
    }
  }

  /**
   * Update sidebar layout based on collapsed state
   * Uses CSS classes instead of inline styles
   */
  function updateSidebar(collapsed) {
    if (collapsed) {
      // Sidebar collapsed to 60px
      sidebar.classList.add("sidebar-collapsed");
      sidebar.classList.remove("sidebar-expanded");
      mainContent.classList.add("main-content-collapsed");
      mainContent.classList.remove("main-content-expanded");
      toggle.classList.add("toggle-collapsed");
      toggle.classList.remove("toggle-expanded");
      
      // Hide text items
      sidebarItems.forEach(item => {
        item.classList.add("sidebar-text-hidden");
        item.classList.remove("sidebar-text-visible");
      });

      // Hide last login info
      const lastLoginEl = sidebar.querySelector(".sidebar-last-login");
      if (lastLoginEl) {
        lastLoginEl.classList.add("hidden-element");
        lastLoginEl.classList.remove("visible-element");
      }
    } else {
      // Sidebar expanded to 180px
      sidebar.classList.add("sidebar-expanded");
      sidebar.classList.remove("sidebar-collapsed");
      mainContent.classList.add("main-content-expanded");
      mainContent.classList.remove("main-content-collapsed");
      toggle.classList.add("toggle-expanded");
      toggle.classList.remove("toggle-collapsed");
      
      // Show text items
      sidebarItems.forEach(item => {
        item.classList.add("sidebar-text-visible");
        item.classList.remove("sidebar-text-hidden");
      });

      // Show last login info
      const lastLoginEl = sidebar.querySelector(".sidebar-last-login");
      if (lastLoginEl) {
        lastLoginEl.classList.add("visible-element");
        lastLoginEl.classList.remove("hidden-element");
      }
    }
  }

  // Sidebar toggle button
  if (sidebar && toggle) {
    toggle.addEventListener("click", () => {
      const collapsed = sidebar.dataset.collapsed === "true";
      const newCollapsedState = !collapsed;
      sidebar.dataset.collapsed = String(newCollapsedState);
      updateSidebar(newCollapsedState);
    });
    // Initialize sidebar in collapsed state
    updateSidebar(true);
  }

  // Setup tooltips with event delegation
  sidebar.querySelectorAll(".sidebar-item").forEach(item => {
    item.addEventListener("mouseenter", () => {
      if (sidebar.dataset.collapsed === "true") {
        const tooltip = document.createElement("div");
        tooltip.innerText = item.dataset.tooltip;
        tooltip.className =
          "absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-50";
        tooltip.id = "sidebar-tooltip";
        item.appendChild(tooltip);
      }
    });

    item.addEventListener("mouseleave", () => {
      const existing = item.querySelector("#sidebar-tooltip");
      if (existing) existing.remove();
    });
  });

  // Update sidebar if logged in
  if (currentUser) {
    const authItem = sidebar.querySelector('a[href="/auth"]');
    if (authItem) {
      authItem.querySelector(".sidebar-text").textContent = currentUser.name;
      authItem.dataset.tooltip = currentUser.name;

      let existingLogin = authItem.querySelector(".sidebar-last-login");
      if (existingLogin) existingLogin.remove();

      const lastLoginContainer = document.createElement("div");
      lastLoginContainer.className = "text-xs text-gray-300 sidebar-last-login";

      let lastLogin = "Never";
      if (currentUser.logins && currentUser.logins.length > 0) {
        const latest = currentUser.logins[currentUser.logins.length - 1];
        lastLogin = new Date(latest).toLocaleString();
      }
      lastLoginContainer.textContent = `Last login: ${lastLogin}`;
      authItem.appendChild(lastLoginContainer);

      // Set initial visibility based on collapse state
      if (sidebar.dataset.collapsed === "true") {
        lastLoginContainer.classList.add("hidden-element");
      } else {
        lastLoginContainer.classList.add("visible-element");
      }
    }
  }
}
