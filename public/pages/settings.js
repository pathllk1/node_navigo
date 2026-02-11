export function SettingsPage() {
  const html = `
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold mb-6 text-gray-800">Settings</h1>
      
      <!-- Settings Tabs -->
      <div class="flex gap-4 mb-6 border-b border-gray-200">
        <button class="settings-tab px-4 py-2 font-semibold text-indigo-600 border-b-2 border-indigo-600" data-tab="global">
          Global Settings
        </button>
        <button class="settings-tab px-4 py-2 font-semibold text-gray-600 hover:text-indigo-600" data-tab="gst">
          GST Configuration
        </button>
      </div>

      <!-- Global Settings Tab -->
      <div id="global-tab" class="settings-tab-content">
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold mb-4 text-gray-800">Global Settings</h2>
          <div id="global-settings-list" class="space-y-4">
            <div class="flex justify-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          </div>
          <button id="add-global-setting-btn" class="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            + Add New Setting
          </button>
        </div>
      </div>

      <!-- GST Configuration Tab -->
      <div id="gst-tab" class="settings-tab-content hidden">
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold mb-4 text-gray-800">GST Configuration</h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 class="font-semibold text-gray-800">Enable GST Calculation</h3>
                <p class="text-sm text-gray-600">Toggle GST calculation for invoices</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="gst-toggle" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div id="gst-status" class="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
              Loading GST status...
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Setting Modal -->
    <div id="edit-setting-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-6 w-96">
        <h2 class="text-xl font-bold mb-4 text-gray-800">Edit Setting</h2>
        <form id="edit-setting-form" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Setting Key</label>
            <input type="text" id="setting-key" class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" readonly>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Setting Value</label>
            <textarea id="setting-value" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600" rows="4"></textarea>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea id="setting-description" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600" rows="2"></textarea>
          </div>
          <div class="flex gap-3 justify-end">
            <button type="button" id="cancel-edit-btn" class="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition">
              Cancel
            </button>
            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Setting Modal -->
    <div id="add-setting-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-6 w-96">
        <h2 class="text-xl font-bold mb-4 text-gray-800">Add New Setting</h2>
        <form id="add-setting-form" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Setting Key</label>
            <input type="text" id="new-setting-key" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600" placeholder="e.g., app_name">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Setting Value</label>
            <textarea id="new-setting-value" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600" rows="4" placeholder="Enter the setting value"></textarea>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea id="new-setting-description" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600" rows="2" placeholder="Optional description"></textarea>
          </div>
          <div class="flex gap-3 justify-end">
            <button type="button" id="cancel-add-btn" class="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition">
              Cancel
            </button>
            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              Add Setting
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const scripts = () => {
    initSettingsPage();
  };

  return { html, scripts };
}

function initSettingsPage() {
  // Tab switching
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // Update active tab
      document.querySelectorAll('.settings-tab').forEach(t => {
        t.classList.remove('border-b-2', 'border-indigo-600', 'text-indigo-600');
        t.classList.add('text-gray-600');
      });
      tab.classList.add('border-b-2', 'border-indigo-600', 'text-indigo-600');
      tab.classList.remove('text-gray-600');
      
      // Update active content
      document.querySelectorAll('.settings-tab-content').forEach(content => {
        content.classList.add('hidden');
      });
      document.getElementById(`${tabName}-tab`).classList.remove('hidden');
      
      // Load content
      if (tabName === 'global') {
        loadGlobalSettings();
      } else if (tabName === 'gst') {
        loadGstStatus();
      }
    });
  });

  // Load initial content
  loadGlobalSettings();

  // Modal handlers
  setupModalHandlers();
}

function setupModalHandlers() {
  const editModal = document.getElementById('edit-setting-modal');
  const addModal = document.getElementById('add-setting-modal');
  const editForm = document.getElementById('edit-setting-form');
  const addForm = document.getElementById('add-setting-form');

  // Close modals
  document.getElementById('cancel-edit-btn').addEventListener('click', () => {
    editModal.classList.add('hidden');
  });

  document.getElementById('cancel-add-btn').addEventListener('click', () => {
    addModal.classList.add('hidden');
  });

  // Close on background click
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) editModal.classList.add('hidden');
  });

  addModal.addEventListener('click', (e) => {
    if (e.target === addModal) addModal.classList.add('hidden');
  });

  // Add setting button
  document.getElementById('add-global-setting-btn').addEventListener('click', () => {
    document.getElementById('new-setting-key').value = '';
    document.getElementById('new-setting-value').value = '';
    document.getElementById('new-setting-description').value = '';
    addModal.classList.remove('hidden');
  });

  // Edit form submit
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = document.getElementById('setting-key').value;
    const value = document.getElementById('setting-value').value;
    const description = document.getElementById('setting-description').value;

    try {
      const response = await fetch(`/api/settings/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setting_value: value, description })
      });

      if (response.ok) {
        alert('Setting updated successfully');
        editModal.classList.add('hidden');
        loadGlobalSettings();
      } else {
        alert('Failed to update setting');
      }
    } catch (err) {
      console.error('Error updating setting:', err);
      alert('Error updating setting');
    }
  });

  // Add form submit
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = document.getElementById('new-setting-key').value;
    const value = document.getElementById('new-setting-value').value;
    const description = document.getElementById('new-setting-description').value;

    if (!key || !value) {
      alert('Key and Value are required');
      return;
    }

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setting_key: key, setting_value: value, description })
      });

      if (response.ok) {
        alert('Setting added successfully');
        addModal.classList.add('hidden');
        loadGlobalSettings();
      } else {
        alert('Failed to add setting');
      }
    } catch (err) {
      console.error('Error adding setting:', err);
      alert('Error adding setting');
    }
  });
}

async function loadGlobalSettings() {
  try {
    const response = await fetch('/api/settings');
    const data = await response.json();
    const settings = data.settings || [];

    const listContainer = document.getElementById('global-settings-list');
    
    if (settings.length === 0) {
      listContainer.innerHTML = '<p class="text-gray-600">No settings found</p>';
      return;
    }

    listContainer.innerHTML = settings.map(setting => `
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div class="flex-1">
          <h3 class="font-semibold text-gray-800">${escapeHtml(setting.setting_key)}</h3>
          <p class="text-sm text-gray-600 truncate">${escapeHtml(setting.setting_value || '')}</p>
          ${setting.description ? `<p class="text-xs text-gray-500 mt-1">${escapeHtml(setting.description)}</p>` : ''}
        </div>
        <button class="edit-setting-btn px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition" data-key="${escapeHtml(setting.setting_key)}">
          Edit
        </button>
      </div>
    `).join('');

    // Attach edit handlers
    document.querySelectorAll('.edit-setting-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const setting = settings.find(s => s.setting_key === key);
        if (setting) {
          openEditModal(setting);
        }
      });
    });
  } catch (err) {
    console.error('Error loading settings:', err);
    document.getElementById('global-settings-list').innerHTML = '<p class="text-red-600">Error loading settings</p>';
  }
}

function openEditModal(setting) {
  document.getElementById('setting-key').value = setting.setting_key;
  document.getElementById('setting-value').value = setting.setting_value || '';
  document.getElementById('setting-description').value = setting.description || '';
  document.getElementById('edit-setting-modal').classList.remove('hidden');
}

async function loadGstStatus() {
  try {
    const response = await fetch('/api/system-config/gst-status');
    const data = await response.json();
    
    const toggle = document.getElementById('gst-toggle');
    const status = document.getElementById('gst-status');
    
    toggle.checked = data.gst_enabled;
    status.textContent = `GST is currently ${data.gst_enabled ? 'ENABLED' : 'DISABLED'}`;
    
    toggle.addEventListener('change', async () => {
      try {
        const response = await fetch('/api/system-config/gst-status', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: toggle.checked })
        });

        if (response.ok) {
          status.textContent = `GST is currently ${toggle.checked ? 'ENABLED' : 'DISABLED'}`;
          status.classList.remove('bg-red-50', 'border-red-200', 'text-red-800');
          status.classList.add(toggle.checked ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800');
        } else {
          toggle.checked = !toggle.checked;
          alert('Failed to update GST status');
        }
      } catch (err) {
        console.error('Error updating GST status:', err);
        toggle.checked = !toggle.checked;
        alert('Error updating GST status');
      }
    });
  } catch (err) {
    console.error('Error loading GST status:', err);
    document.getElementById('gst-status').textContent = 'Error loading GST status';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
