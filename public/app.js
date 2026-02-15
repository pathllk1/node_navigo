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
import { SlsDashPage } from "./pages/inventory/sls-dash.js";
import { SlsRptPage } from "./pages/inventory/sls-rpt.js";
import { StockPage } from "./pages/inventory/sts-rpt.js";
import { StcMovementPage } from "./pages/inventory/sts-mov.js";


import { Layout } from "./layout.js";
import { clearAccessTokenTimer, startAccessTokenTimer } from "./api.js";
import { initSidebar } from "./sidebar.js";

const root = document.getElementById("app");
const router = new Navigo("/", { hash: false });

// Expose router globally for use in other modules
window.router = router;

let currentUser = null;
let pollingInterval;
let lastExpiresAt = null;

function startPolling() {
  console.log('startPolling called');
  if (pollingInterval) clearInterval(pollingInterval);
  
  // Fetch immediately
  (async () => {
    console.log('Fetching /auth/auth/session immediately');
    try {
      const res = await fetch('/auth/auth/session');
      console.log('Immediate fetch result:', res.status, res.ok);
      if (res.ok) {
        const data = await res.json();
        console.log('Session data:', data);
        // Only restart the timer if the expiration time has changed
        // This prevents unnecessary timer restarts during active sessions
        console.log('Comparing expiration times:', {
          current: data.expiresAt,
          last: lastExpiresAt,
          areEqual: data.expiresAt === lastExpiresAt,
          currentTime: new Date().toISOString()
        });
        
        if (data.expiresAt !== lastExpiresAt) {
          console.log('Expiration time changed, restarting timer');
          lastExpiresAt = data.expiresAt;
          startAccessTokenTimer(data.expiresAt);
        } else {
          console.log('Expiration time unchanged, keeping current timer');
        }
      } else {
        console.log('Fetch failed, clearing timer');
        // Only clear the timer if we're still logged in
        if (currentUser) {
          clearAccessTokenTimer();
        }
      }
    } catch (err) {
      console.log('Fetch error:', err);
      // Only clear the timer if we're still logged in
      if (currentUser) {
        clearAccessTokenTimer();
      }
    }
  })();
  
  // Then poll every 3 min
  pollingInterval = setInterval(async () => {
    console.log('Polling fetch');
    try {
      const res = await fetch('/auth/auth/session');
      console.log('Polling fetch result:', res.status, res.ok);
      if (res.ok) {
        const data = await res.json();
        console.log('Polling session data:', data);
        
        // Only restart the timer if the expiration time has changed
        // This prevents unnecessary timer restarts during active sessions
        // and allows the timer to count down to completion
        console.log('Polling - Comparing expiration times:', {
          current: data.expiresAt,
          last: lastExpiresAt,
          areEqual: data.expiresAt === lastExpiresAt,
          currentTime: new Date().toISOString()
        });
        
        if (data.expiresAt !== lastExpiresAt) {
          console.log('Polling - Expiration time changed, restarting timer');
          lastExpiresAt = data.expiresAt;
          startAccessTokenTimer(data.expiresAt);
        } else {
          console.log('Polling - Expiration time unchanged, keeping current timer');
        }
      } else {
        console.log('Polling fetch failed, clearing timer');
        // Only clear the timer if we're still logged in
        // If user logs out, the handleLogout function will properly clear everything
        if (currentUser) {
          clearAccessTokenTimer();
        }
      }
    } catch (err) {
      console.log('Polling fetch error:', err);
      // Only clear the timer if we're still logged in
      if (currentUser) {
        clearAccessTokenTimer();
      }
    }
  }, 180000);
}

// Load user from server
async function loadUser() {
  try {
    const res = await fetch('/auth/me');
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      if (currentUser) startPolling();
      // Re-render if needed
      if (window.location.pathname !== '/auth') {
        renderPage(getCurrentPage());
      }
    }
  } catch (err) {
    // leave currentUser null
  }
}

// ---------------- Auth Success ----------------
function handleAuthSuccess(user) {
  currentUser = user;
  startPolling();
  // Re-render the auth page to show logged-in state
  renderPage(AuthPage(handleAuthSuccess, currentUser));
  // Then navigate to home after a brief delay
  setTimeout(() => {
    router.navigate("/");
  }, 500);
}

// ---------------- Logout ----------------
function handleLogout() {
  currentUser = null;
  clearAccessTokenTimer();
  if (pollingInterval) clearInterval(pollingInterval);
  lastExpiresAt = null;
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
  if (page.scripts) page.scripts();
  // Restart timer if needed
  if (currentUser && lastExpiresAt) {
    startAccessTokenTimer(lastExpiresAt);
  }
}

// ---------------- SPA Routes ----------------
router
  .on("/", () => renderPage({ html: '<h1>Welcome to My SPA</h1><p>This is the home page.</p>', scripts: () => {} }))
  .on("/about", () => renderPage(AboutPage()))
  .on("/contact", () => renderPage(ContactPage()))
  .on("/services", () => renderPage(ServicesPage()))
  .on("/server-info", () => renderPage(ServerInfoPage()))
  .on("/auth", () => renderPage(AuthPage(handleAuthSuccess, currentUser)))
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
  .on("/inventory/sls/dash", () => renderPage(SlsDashPage()))
  .on("/inventory/sls/rpt", () => renderPage(SlsRptPage()))
  .on("/inventory/sls/sts", () => renderPage(StockPage()))  
  .on("/inventory/sls/mov", () => renderPage(StcMovementPage()))
  .on("/tst", () => renderPage(TstPage()))
  .on("/not-found", () =>
    renderPage({ html: "<h1>404 - Page not found</h1>", scripts: () => { } })
  )
  .resolve();

loadUser();
