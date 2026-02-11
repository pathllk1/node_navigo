import { HomePage } from "./pages/home.js";
import { AboutPage } from "./pages/about.js";
import { ContactPage } from "./pages/contact.js";
import { ServicesPage } from "./pages/services.js";
import { AuthPage } from "./pages/AuthPage.js";
import { AdminPanel } from "./pages/AdminPanel.js";
import { ServerInfoPage } from "./pages/server-info.js";
import { TstPage } from "./pages/tst.js";
import {MasterRollDashboard} from "./pages/MasterRollDashboard.js";
import { WagesDashboard } from "./pages/WagesDashboard.js";
import { initSalesSystem } from "./components/inventory/sls/index.js";
import { SettingsPage } from "./pages/settings.js";


import { Layout } from "./layout.js";
import "./api.js";
import { startAccessTokenTimer } from "./api.js";
import { initSidebar } from "./sidebar.js";

const root = document.getElementById("app");
const router = new Navigo("/", { hash: false });

// Expose router globally for use in other modules
window.router = router;

let currentUser = null;

// Load user from localStorage
const savedUser = localStorage.getItem("currentUser");
if (savedUser) currentUser = JSON.parse(savedUser);

// ---------------- Auth Success ----------------
function handleAuthSuccess(user) {
  currentUser = user;
  // Re-render the auth page to show logged-in state
  renderPage(AuthPage(handleAuthSuccess));
  // Then navigate to home after a brief delay
  setTimeout(() => {
    router.navigate("/");
  }, 500);
}

// ---------------- Logout ----------------
function handleLogout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  router.navigate("/auth");
  renderPage(AuthPage(handleAuthSuccess)); // force re-render
}

// ---------------- Sidebar Init ----------------
function renderSidebar() {
  initSidebar(currentUser, handleLogout);
}

// ============================================

// ---------------- Render Pages ----------------
function renderPage(page) {
  root.innerHTML = Layout(page.html, currentUser);
  router.updatePageLinks();
  renderSidebar();
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
  .on("/settings", () => {
    if (currentUser) {
      renderPage(SettingsPage());
    } else {
      renderPage({ html: "<h1>403 - Access Denied</h1><p>You must be logged in to access settings.</p>", scripts: () => {} });
    }
  })
  .on("/admin", () => {
    // Check if user is super_admin
    if (currentUser && currentUser.role === 'super_admin') {
      renderPage(AdminPanel());
    } else {
      renderPage({ html: "<h1>403 - Access Denied</h1><p>Only super admins can access this page.</p>", scripts: () => {} });
    }
  })
  .on("/masterroll", () => renderPage(MasterRollDashboard()))
  .on("/wages", () => renderPage({ html: '<div id="wages-dashboard"></div>', scripts: () => WagesDashboard() }))
  .on("/inventory/sls", () => renderPage({ html: '<div id="sales-system"></div>', scripts: () => initSalesSystem() }))
  .on("/tst", () => renderPage(TstPage()))
  .on("/not-found", () =>
    renderPage({ html: "<h1>404 - Page not found</h1>", scripts: () => { } })
  )
  .resolve();
