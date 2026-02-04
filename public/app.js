
import { HomePage } from "./pages/home.js";
import { AboutPage } from "./pages/about.js";
import { ContactPage } from "./pages/contact.js";
import { ServicesPage } from "./pages/services.js";
import { AuthPage } from "./pages/AuthPage.js";
import { ServerInfoPage } from "./pages/server-info.js";
import { TstPage } from "./pages/tst.js";
import { Layout } from "./layout.js";
import "./api.js";
import { startAccessTokenTimer } from "./api.js";

const root = document.getElementById("app");
const router = new Navigo("/", { hash: false });

let currentUser = null;

// Load user from localStorage
const savedUser = localStorage.getItem("currentUser");
if (savedUser) currentUser = JSON.parse(savedUser);

// ---------------- Auth Success ----------------
function handleAuthSuccess(user) {
  currentUser = user;
  router.navigate("/");
}

// ---------------- Logout ----------------
function handleLogout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  router.navigate("/auth");
  renderPage(AuthPage(handleAuthSuccess)); // force re-render
}

// ---------------- Sidebar Init ----------------
function initSidebar() {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("sidebar-toggle");
  const mainContent = document.getElementById("main-content");
  const sidebarItems = sidebar.querySelectorAll(".sidebar-text");

  const logoutBtn = document.getElementById("logout-btn");

  if (logoutBtn) {
    if (currentUser) {
      logoutBtn.style.display = "block";
      logoutBtn.onclick = handleLogout;
    } else {
      logoutBtn.style.display = "none"; // hide when no user
    }
  }

  function updateSidebar(collapsed) {
    if (collapsed) {
      sidebar.style.width = "60px";
      mainContent.style.marginLeft = "60px";
      sidebarItems.forEach(item => item.style.display = "none");

      // hide last login
      const lastLoginEl = sidebar.querySelector(".sidebar-last-login");
      if (lastLoginEl) lastLoginEl.style.display = "none";
    } else {
      sidebar.style.width = "180px";
      mainContent.style.marginLeft = "180px";
      sidebarItems.forEach(item => item.style.display = "inline");

      // show last login
      const lastLoginEl = sidebar.querySelector(".sidebar-last-login");
      if (lastLoginEl) lastLoginEl.style.display = "block";
    }
    toggle.style.transform = collapsed
      ? "translateY(-50%) rotate(0deg)"
      : "translateY(-50%) rotate(180deg)";
  }

  if (sidebar && toggle) {
    toggle.onclick = () => {
      const collapsed = sidebar.dataset.collapsed === "true";
      sidebar.dataset.collapsed = String(!collapsed);
      updateSidebar(!collapsed);
    };
    updateSidebar(true);
  }

  // Tooltip
  sidebar.querySelectorAll(".sidebar-item").forEach(item => {
    item.onmouseenter = () => {
      if (sidebar.dataset.collapsed === "true") {
        const tooltip = document.createElement("div");
        tooltip.innerText = item.dataset.tooltip;
        tooltip.className =
          "absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-50";
        tooltip.id = "sidebar-tooltip";
        item.appendChild(tooltip);
      }
    };
    item.onmouseleave = () => {
      const existing = item.querySelector("#sidebar-tooltip");
      if (existing) existing.remove();
    };
  });

  // Update sidebar if logged in
  if (currentUser) {
    const authItem = sidebar.querySelector('a[href="/auth"]');
    if (authItem) {
      authItem.querySelector(".sidebar-text").textContent = currentUser.name;
      authItem.dataset.tooltip = currentUser.name;

      // Remove existing last login if any
      let existingLogin = authItem.querySelector(".sidebar-last-login");
      if (existingLogin) existingLogin.remove();

      // Create last login subtext
      let lastLoginContainer = document.createElement("div");
      lastLoginContainer.className = "text-xs text-gray-300 sidebar-last-login";

      let lastLogin = "Never";
      if (currentUser.logins && currentUser.logins.length > 0) {
        const latest = currentUser.logins[currentUser.logins.length - 1];
        lastLogin = new Date(latest).toLocaleString();
      }
      lastLoginContainer.textContent = `Last login: ${lastLogin}`;
      authItem.appendChild(lastLoginContainer);

      // Set initial visibility based on collapse
      lastLoginContainer.style.display =
        sidebar.dataset.collapsed === "true" ? "none" : "block";
    }
  }
}

// ---------------- Render Pages ----------------
function renderPage(page) {
  root.innerHTML = Layout(page.html);
  router.updatePageLinks();
  initSidebar();
  startAccessTokenTimer();
  if (page.scripts) page.scripts();
}

// ---------------- SPA Routes ----------------
router
  .on("/", () => renderPage(HomePage()))
  .on("/about", () => renderPage(AboutPage()))
  .on("/contact", () => renderPage(ContactPage()))
  .on("/services", () => renderPage(ServicesPage()))
  .on("/server-info", () => renderPage(ServerInfoPage()))
  .on("/auth", () => renderPage(AuthPage(handleAuthSuccess)))
  .on("/tst", () => renderPage(TstPage()))
  .on("/not-found", () =>
    renderPage({ html: "<h1>404 - Page not found</h1>", scripts: () => { } })
  )
  .resolve();
