export function AdminPanel() {
  let html = `
    <div class="container mx-auto px-4 py-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-purple-700">Admin Panel</h1>
        <p class="text-gray-600">Manage firms and user registrations</p>
      </div>

      <!-- Stats Cards -->
      <div id="admin-stats" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="text-gray-500 text-sm">Total Firms</div>
          <div class="text-2xl font-bold text-purple-700" id="stat-total-firms">-</div>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="text-gray-500 text-sm">Pending Firms</div>
          <div class="text-2xl font-bold text-orange-600" id="stat-pending-firms">-</div>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="text-gray-500 text-sm">Pending Users</div>
          <div class="text-2xl font-bold text-orange-600" id="stat-pending-users">-</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white rounded-lg shadow mb-6">
        <div class="flex border-b">
          <button id="tab-create-firm" class="px-6 py-3 font-semibold text-purple-700 border-b-2 border-purple-700">Create Firm</button>
          <button id="tab-firms" class="px-6 py-3 font-semibold text-gray-500 hover:text-purple-700">Manage Firms</button>
          <button id="tab-users" class="px-6 py-3 font-semibold text-gray-500 hover:text-purple-700">Pending Users</button>
        </div>

        <!-- Create Firm Tab -->
        <div id="content-create-firm" class="p-6">
          <h2 class="text-xl font-semibold text-purple-700 mb-4">Create New Firm</h2>
          <div class="max-w-2xl">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Firm Name</label>
                <input type="text" id="create-firm-name" class="w-full border rounded px-3 py-2" placeholder="ABC Corporation">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Firm Code</label>
                <input type="text" id="create-firm-code" class="w-full border rounded px-3 py-2" placeholder="ABC123">
              </div>
            </div>
            <h3 class="text-lg font-semibold text-gray-700 mb-3 mt-6">Admin Account</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" id="create-admin-name" class="w-full border rounded px-3 py-2" placeholder="John Doe">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" id="create-admin-username" class="w-full border rounded px-3 py-2" placeholder="johndoe">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" id="create-admin-email" class="w-full border rounded px-3 py-2" placeholder="john@example.com">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" id="create-admin-password" class="w-full border rounded px-3 py-2" placeholder="••••••••">
              </div>
            </div>
            <button id="btn-create-firm" class="bg-purple-600 text-white px-6 py-2 rounded shadow hover:bg-purple-700 transition">
              Create Firm & Admin
            </button>
            <p id="create-firm-msg" class="mt-2 text-sm"></p>
          </div>
        </div>

        <!-- Manage Firms Tab -->
        <div id="content-firms" class="p-6 hidden">
          <h2 class="text-xl font-semibold text-purple-700 mb-4">All Firms</h2>
          <div id="firms-list" class="overflow-x-auto">
            <p class="text-gray-500">Loading...</p>
          </div>
        </div>

        <!-- Pending Users Tab -->
        <div id="content-users" class="p-6 hidden">
          <h2 class="text-xl font-semibold text-purple-700 mb-4">Pending User Registrations</h2>
          <div id="users-list" class="overflow-x-auto">
            <p class="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  function scripts() {
    // Tab switching
    const tabs = {
      'tab-create-firm': 'content-create-firm',
      'tab-firms': 'content-firms',
      'tab-users': 'content-users'
    };

    Object.keys(tabs).forEach(tabId => {
      document.getElementById(tabId).addEventListener('click', () => {
        // Update tab styles
        Object.keys(tabs).forEach(id => {
          const tab = document.getElementById(id);
          const content = document.getElementById(tabs[id]);
          if (id === tabId) {
            tab.classList.add('text-purple-700', 'border-b-2', 'border-purple-700');
            tab.classList.remove('text-gray-500');
            content.classList.remove('hidden');
          } else {
            tab.classList.remove('text-purple-700', 'border-b-2', 'border-purple-700');
            tab.classList.add('text-gray-500');
            content.classList.add('hidden');
          }
        });

        // Load data when switching to firms or users tab
        if (tabId === 'tab-firms') loadFirms();
        if (tabId === 'tab-users') loadPendingUsers();
      });
    });

    // Load stats
    async function loadStats() {
      try {
        const res = await fetch('/admin/stats');
        const data = await res.json();
        if (data.success) {
          document.getElementById('stat-total-firms').textContent = data.stats.totalFirms;
          document.getElementById('stat-pending-firms').textContent = data.stats.pendingFirms;
          document.getElementById('stat-pending-users').textContent = data.stats.pendingUsers;
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    }

    // Create firm
    document.getElementById('btn-create-firm').addEventListener('click', async () => {
      const firmName = document.getElementById('create-firm-name').value;
      const firmCode = document.getElementById('create-firm-code').value;
      const adminName = document.getElementById('create-admin-name').value;
      const adminUsername = document.getElementById('create-admin-username').value;
      const adminEmail = document.getElementById('create-admin-email').value;
      const adminPassword = document.getElementById('create-admin-password').value;
      const msg = document.getElementById('create-firm-msg');

      if (!firmName || !firmCode || !adminName || !adminUsername || !adminEmail || !adminPassword) {
        msg.textContent = 'Please fill all fields';
        msg.className = 'mt-2 text-sm text-red-500';
        return;
      }

      try {
        const res = await fetch('/admin/firms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firmName, firmCode, adminName, adminUsername, adminEmail, adminPassword })
        });

        const data = await res.json();

        if (data.success) {
          msg.textContent = 'Firm and admin created successfully!';
          msg.className = 'mt-2 text-sm text-green-600';
          
          // Clear form
          document.getElementById('create-firm-name').value = '';
          document.getElementById('create-firm-code').value = '';
          document.getElementById('create-admin-name').value = '';
          document.getElementById('create-admin-username').value = '';
          document.getElementById('create-admin-email').value = '';
          document.getElementById('create-admin-password').value = '';

          loadStats();
        } else {
          msg.textContent = data.error;
          msg.className = 'mt-2 text-sm text-red-500';
        }
      } catch (err) {
        msg.textContent = 'Server error';
        msg.className = 'mt-2 text-sm text-red-500';
      }
    });

    // Load firms
    async function loadFirms() {
      const container = document.getElementById('firms-list');
      container.innerHTML = '<p class="text-gray-500">Loading...</p>';

      try {
        const res = await fetch('/admin/firms');
        const data = await res.json();

        if (data.success && data.firms.length > 0) {
          const table = `
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firm Name</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${data.firms.map(firm => `
                  <tr>
                    <td class="px-4 py-3 text-sm text-gray-900">${firm.name}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${firm.code}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${firm.user_count} (${firm.pending_users} pending)</td>
                    <td class="px-4 py-3 text-sm">
                      <span class="px-2 py-1 text-xs rounded ${
                        firm.status === 'approved' ? 'bg-green-100 text-green-800' :
                        firm.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }">
                        ${firm.status}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm">
                      ${firm.status === 'pending' ? `
                        <button class="text-green-600 hover:text-green-800 mr-2" onclick="updateFirmStatus(${firm.id}, 'approved')">Approve</button>
                        <button class="text-red-600 hover:text-red-800" onclick="updateFirmStatus(${firm.id}, 'rejected')">Reject</button>
                      ` : firm.status === 'rejected' ? `
                        <button class="text-green-600 hover:text-green-800" onclick="updateFirmStatus(${firm.id}, 'approved')">Approve</button>
                      ` : `
                        <button class="text-red-600 hover:text-red-800" onclick="updateFirmStatus(${firm.id}, 'rejected')">Revoke</button>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
          container.innerHTML = table;
        } else {
          container.innerHTML = '<p class="text-gray-500">No firms found</p>';
        }
      } catch (err) {
        container.innerHTML = '<p class="text-red-500">Failed to load firms</p>';
      }
    }

    // Load pending users
    async function loadPendingUsers() {
      const container = document.getElementById('users-list');
      container.innerHTML = '<p class="text-gray-500">Loading...</p>';

      try {
        const res = await fetch('/admin/users/pending');
        const data = await res.json();

        if (data.success && data.users.length > 0) {
          const table = `
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firm</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${data.users.map(user => `
                  <tr>
                    <td class="px-4 py-3 text-sm text-gray-900">${user.fullname}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${user.username}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${user.email}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${user.firm_name}</td>
                    <td class="px-4 py-3 text-sm">
                      <span class="px-2 py-1 text-xs rounded ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }">
                        ${user.role}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm">
                      <button class="text-green-600 hover:text-green-800 mr-2" onclick="updateUserStatus(${user.id}, 'approved')">Approve</button>
                      <button class="text-red-600 hover:text-red-800" onclick="updateUserStatus(${user.id}, 'rejected')">Reject</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
          container.innerHTML = table;
        } else {
          container.innerHTML = '<p class="text-gray-500">No pending users</p>';
        }
      } catch (err) {
        container.innerHTML = '<p class="text-red-500">Failed to load users</p>';
      }
    }

    // Global functions for inline handlers
    window.updateFirmStatus = async (firmId, status) => {
      try {
        const res = await fetch(`/admin/firms/${firmId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });

        const data = await res.json();
        if (data.success) {
          loadFirms();
          loadStats();
        } else {
          alert(data.error);
        }
      } catch (err) {
        alert('Failed to update firm status');
      }
    };

    window.updateUserStatus = async (userId, status) => {
      try {
        const res = await fetch(`/admin/users/${userId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });

        const data = await res.json();
        if (data.success) {
          loadPendingUsers();
          loadStats();
        } else {
          alert(data.error);
        }
      } catch (err) {
        alert('Failed to update user status');
      }
    };

    // Initial load
    loadStats();
  }

  return { html, scripts };
}
