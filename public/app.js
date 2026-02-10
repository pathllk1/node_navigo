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
import { PartiesDashboard } from "./pages/parties/PartiesDashboard.js";
import { StocksDashboard } from "./pages/stocks/StocksDashboard.js";
import { SalesDashboard } from "./pages/sales/SalesDashboard.js";
import { PurchaseDashboard } from "./pages/purchase/PurchaseDashboard.js";
import { LedgerDashboard } from "./pages/ledger/LedgerDashboard.js";
import { VouchersDashboard } from "./pages/vouchers/VouchersDashboard.js";
import { BankingDashboard } from "./pages/banking/BankingDashboard.js";
import { ReportsDashboard } from "./pages/reports/ReportsDashboard.js";
import { NotesDashboard } from "./pages/notes/NotesDashboard.js";
import { SettingsPage } from "./pages/settings/SettingsPage.js";
// Form Pages
import { SalesBillFormPage } from "./pages/sales/SalesBillFormPage.js";
import { SalesBillDetailPage } from "./pages/sales/SalesBillDetailPage.js";
import { PurchaseBillFormPage } from "./pages/purchase/PurchaseBillFormPage.js";
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
  .on("/parties", () => renderPage({ html: '<div id="parties-dashboard"></div>', scripts: () => {
    const container = document.getElementById('parties-dashboard');
    container.appendChild(PartiesDashboard());
  }}))
  .on("/stocks", () => renderPage({ html: '<div id="stocks-dashboard"></div>', scripts: () => {
    const container = document.getElementById('stocks-dashboard');
    container.appendChild(StocksDashboard());
  }}))
  .on("/sales", () => renderPage({ html: '<div id="sales-dashboard"></div>', scripts: () => {
    const container = document.getElementById('sales-dashboard');
    container.appendChild(SalesDashboard());
  }}))
  .on("/purchase", () => renderPage({ html: '<div id="purchase-dashboard"></div>', scripts: () => {
    const container = document.getElementById('purchase-dashboard');
    container.appendChild(PurchaseDashboard());
  }}))
  .on("/ledger", () => renderPage({ html: '<div id="ledger-dashboard"></div>', scripts: () => {
    const container = document.getElementById('ledger-dashboard');
    container.appendChild(LedgerDashboard());
  }}))
  .on("/vouchers", () => renderPage({ html: '<div id="vouchers-dashboard"></div>', scripts: () => {
    const container = document.getElementById('vouchers-dashboard');
    container.appendChild(VouchersDashboard());
  }}))
  .on("/banking", () => renderPage({ html: '<div id="banking-dashboard"></div>', scripts: () => {
    const container = document.getElementById('banking-dashboard');
    container.appendChild(BankingDashboard());
  }}))
  .on("/reports", () => renderPage({ html: '<div id="reports-dashboard"></div>', scripts: () => {
    const container = document.getElementById('reports-dashboard');
    container.appendChild(ReportsDashboard());
  }}))
  .on("/notes", () => renderPage({ html: '<div id="notes-dashboard"></div>', scripts: () => {
    const container = document.getElementById('notes-dashboard');
    container.appendChild(NotesDashboard());
  }}))
  .on("/settings", () => renderPage({ html: '<div id="settings-page"></div>', scripts: () => {
    const container = document.getElementById('settings-page');
    container.appendChild(SettingsPage());
  }}))
  // Sales routes - IMPORTANT: /new must come before /:id
  .on("/sales/new", () => renderPage({ html: '<div id="sales-form"></div>', scripts: () => {
    const container = document.getElementById('sales-form');
    container.appendChild(SalesBillFormPage());
  }}))
  .on("/sales/:id", ({ data }) => {
    // Don't match if id is "new"
    if (data.id === 'new') {
      return false; // Let other routes handle it
    }
    renderPage({ html: '<div id="sales-detail"></div>', scripts: () => {
      const container = document.getElementById('sales-detail');
      container.appendChild(SalesBillDetailPage(data.id));
    }});
  })
  // Purchase routes - IMPORTANT: /new must come before /:id
  .on("/purchase/new", () => renderPage({ html: '<div id="purchase-form"></div>', scripts: () => {
    const container = document.getElementById('purchase-form');
    container.appendChild(PurchaseBillFormPage());
  }}))
  .on("/purchase/:id", ({ data }) => {
    // Don't match if id is "new"
    if (data.id === 'new') {
      return false;
    }
    renderPage({ html: '<div id="purchase-detail"></div>', scripts: () => {
      const container = document.getElementById('purchase-detail');
      // TODO: Create PurchaseBillDetailPage
      container.innerHTML = '<div class="p-6"><h1>Purchase Bill Detail</h1><p>Coming soon...</p></div>';
    }});
  })
  // Placeholder routes for remaining pages
  .on("/vouchers/payment/new", () => renderPage({ html: '<div class="p-6"><h1 class="text-2xl font-bold">Payment Voucher Form</h1><p class="mt-4">Form page coming soon...</p><button data-action="back-to-vouchers" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Back to Vouchers</button></div>', scripts: () => {
    document.querySelector('[data-action="back-to-vouchers"]')?.addEventListener('click', () => window.router.navigate('/vouchers'));
  }}))
  .on("/vouchers/receipt/new", () => renderPage({ html: '<div class="p-6"><h1 class="text-2xl font-bold">Receipt Voucher Form</h1><p class="mt-4">Form page coming soon...</p><button data-action="back-to-vouchers" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Back to Vouchers</button></div>', scripts: () => {
    document.querySelector('[data-action="back-to-vouchers"]')?.addEventListener('click', () => window.router.navigate('/vouchers'));
  }}))
  .on("/vouchers/journal/new", () => renderPage({ html: '<div class="p-6"><h1 class="text-2xl font-bold">Journal Voucher Form</h1><p class="mt-4">Form page coming soon...</p><button data-action="back-to-vouchers" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Back to Vouchers</button></div>', scripts: () => {
    document.querySelector('[data-action="back-to-vouchers"]')?.addEventListener('click', () => window.router.navigate('/vouchers'));
  }}))
  .on("/banking/accounts/new", () => renderPage({ html: '<div class="p-6"><h1 class="text-2xl font-bold">New Bank Account Form</h1><p class="mt-4">Form page coming soon...</p><button data-action="back-to-banking" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Back to Banking</button></div>', scripts: () => {
    document.querySelector('[data-action="back-to-banking"]')?.addEventListener('click', () => window.router.navigate('/banking'));
  }}))
  .on("/banking/transactions/new", () => renderPage({ html: '<div class="p-6"><h1 class="text-2xl font-bold">New Transaction Form</h1><p class="mt-4">Form page coming soon...</p><button data-action="back-to-banking" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Back to Banking</button></div>', scripts: () => {
    document.querySelector('[data-action="back-to-banking"]')?.addEventListener('click', () => window.router.navigate('/banking'));
  }}))
  .on("/ledger/accounts/new", () => renderPage({ html: '<div class="p-6"><h1 class="text-2xl font-bold">New Ledger Account Form</h1><p class="mt-4">Form page coming soon...</p><button data-action="back-to-ledger" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Back to Ledger</button></div>', scripts: () => {
    document.querySelector('[data-action="back-to-ledger"]')?.addEventListener('click', () => window.router.navigate('/ledger'));
  }}))
  .on("/reports/sales-summary", () => renderPage({ html: '<div class="p-6"><h1 class="text-2xl font-bold">Sales Summary Report</h1><p class="mt-4">Report page coming soon...</p><button data-action="back-to-reports" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Back to Reports</button></div>', scripts: () => {
    document.querySelector('[data-action="back-to-reports"]')?.addEventListener('click', () => window.router.navigate('/reports'));
  }}))
  .on("/notes/credit/new", () => renderPage({ html: '<div class="p-6"><h1 class="text-2xl font-bold">Credit Note Form</h1><p class="mt-4">Form page coming soon...</p><button data-action="back-to-notes" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Back to Notes</button></div>', scripts: () => {
    document.querySelector('[data-action="back-to-notes"]')?.addEventListener('click', () => window.router.navigate('/notes'));
  }}))
  .on("/notes/debit/new", () => renderPage({ html: '<div class="p-6"><h1 class="text-2xl font-bold">Debit Note Form</h1><p class="mt-4">Form page coming soon...</p><button data-action="back-to-notes" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Back to Notes</button></div>', scripts: () => {
    document.querySelector('[data-action="back-to-notes"]')?.addEventListener('click', () => window.router.navigate('/notes'));
  }}))
  .on("/notes/delivery/new", () => renderPage({ html: '<div class="p-6"><h1 class="text-2xl font-bold">Delivery Note Form</h1><p class="mt-4">Form page coming soon...</p><button data-action="back-to-notes" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Back to Notes</button></div>', scripts: () => {
    document.querySelector('[data-action="back-to-notes"]')?.addEventListener('click', () => window.router.navigate('/notes'));
  }}))
  .on("/tst", () => renderPage(TstPage()))
  .on("/not-found", () =>
    renderPage({ html: "<h1>404 - Page not found</h1>", scripts: () => { } })
  )
  .resolve();
