import { clearAccessTokenTimer } from "../api.js";

export function AuthPage(onAuthSuccess) {
  // Check if a user is logged in
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const accessToken = localStorage.getItem("accessToken");

  let html = "";

  if (user) {
    // User is logged in → show welcome message + firm users
    html = `
      <div class="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] space-y-6">
        <div class="w-full max-w-2xl p-6 bg-white rounded-xl shadow-lg text-center">
          <h2 class="text-2xl font-semibold text-purple-700 mb-4">Welcome, ${user.fullname}!</h2>
          <p class="text-gray-600 mb-2"><strong>Firm:</strong> ${user.firm_name} (${user.firm_code})</p>
          <p class="text-gray-600 mb-2"><strong>Role:</strong> ${user.role}</p>
          <p class="text-gray-600 mb-4"><strong>Email:</strong> ${user.email}</p>
          <button id="auth-logout-btn" class="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600 transition">
            Logout
          </button>
        </div>
        
        ${user.role === 'admin' || user.role === 'manager' ? `
        <div id="firm-users" class="w-full max-w-2xl p-6 bg-white rounded-xl shadow-lg text-left">
          <h3 class="text-lg font-semibold text-purple-700 mb-2">
            ${user.role === 'admin' ? 'All Users' : 'Firm Users'}:
          </h3>
          <div id="users-list" class="text-gray-700"></div>
        </div>
        ` : ''}
      </div>
    `;
  } else {
    // No user → show login/register forms with firm registration
    html = `
      <div class="flex items-center justify-center min-h-[calc(100vh-4rem)] py-6">
        <div class="w-full max-w-3xl p-6 bg-white rounded-xl shadow-lg">
          <!-- Tabs -->
          <div class="flex justify-center mb-6 border-b-2 border-gray-200">
            <button id="tab-login" class="tab-btn px-4 py-2 text-purple-700 border-b-2 border-purple-700 font-semibold focus:outline-none">Login</button>
            <button id="tab-register-firm" class="tab-btn px-4 py-2 text-gray-500 hover:text-purple-700 font-semibold focus:outline-none">Register Firm</button>
            <button id="tab-register-user" class="tab-btn px-4 py-2 text-gray-500 hover:text-purple-700 font-semibold focus:outline-none">Join Firm</button>
          </div>

          <!-- Login Form -->
          <div id="login-form" class="tab-content">
            <h3 class="text-xl font-semibold text-purple-700 mb-4">Login to Your Account</h3>
            <div class="flex flex-col space-y-4">
              <div class="flex items-center border rounded px-3 py-2 shadow-sm">
                <span class="material-icons text-gray-400 mr-2">person</span>
                <input type="text" id="login-email-username" placeholder="Email or Username" class="w-full outline-none">
              </div>
              <div class="flex items-center border rounded px-3 py-2 shadow-sm">
                <span class="material-icons text-gray-400 mr-2">lock</span>
                <input type="password" id="login-password" placeholder="Password" class="w-full outline-none">
              </div>
              <button id="login-btn" class="bg-purple-600 text-white py-2 rounded shadow hover:bg-purple-700 transition">Login</button>
            </div>
            <p id="login-msg" class="mt-2 text-sm"></p>
          </div>

          <!-- Register Firm Form -->
          <div id="register-firm-form" class="tab-content hidden">
            <h3 class="text-xl font-semibold text-purple-700 mb-4">Register New Firm</h3>
            <p class="text-sm text-gray-600 mb-4">Create a new firm account. Your firm will need approval before users can log in.</p>
            <div class="flex flex-col space-y-4">
              <!-- Firm Details -->
              <div class="border-b pb-3 mb-2">
                <h4 class="text-sm font-semibold text-gray-700 mb-2">Firm Details</h4>
                <div class="flex items-center border rounded px-3 py-2 shadow-sm mb-3">
                  <span class="material-icons text-gray-400 mr-2">business</span>
                  <input type="text" id="register-firm-name" placeholder="Firm Name" class="w-full outline-none">
                </div>
                <div class="flex items-center border rounded px-3 py-2 shadow-sm">
                  <span class="material-icons text-gray-400 mr-2">tag</span>
                  <input type="text" id="register-firm-code" placeholder="Firm Code (e.g., ABC123)" class="w-full outline-none">
                </div>
              </div>
              
              <!-- Admin Details -->
              <div>
                <h4 class="text-sm font-semibold text-gray-700 mb-2">Administrator Account</h4>
                <div class="flex items-center border rounded px-3 py-2 shadow-sm mb-3">
                  <span class="material-icons text-gray-400 mr-2">person</span>
                  <input type="text" id="register-firm-admin-name" placeholder="Admin Full Name" class="w-full outline-none">
                </div>
                <div class="flex items-center border rounded px-3 py-2 shadow-sm mb-3">
                  <span class="material-icons text-gray-400 mr-2">account_circle</span>
                  <input type="text" id="register-firm-admin-username" placeholder="Admin Username" class="w-full outline-none">
                </div>
                <div class="flex items-center border rounded px-3 py-2 shadow-sm mb-3">
                  <span class="material-icons text-gray-400 mr-2">email</span>
                  <input type="email" id="register-firm-admin-email" placeholder="Admin Email" class="w-full outline-none">
                </div>
                <div class="flex items-center border rounded px-3 py-2 shadow-sm">
                  <span class="material-icons text-gray-400 mr-2">lock</span>
                  <input type="password" id="register-firm-admin-password" placeholder="Admin Password" class="w-full outline-none">
                </div>
              </div>
              
              <button id="register-firm-btn" class="bg-purple-600 text-white py-2 rounded shadow hover:bg-purple-700 transition">Register Firm</button>
            </div>
            <p id="register-firm-msg" class="mt-2 text-sm"></p>
          </div>

          <!-- Register User Form -->
          <div id="register-user-form" class="tab-content hidden">
            <h3 class="text-xl font-semibold text-purple-700 mb-4">Join Existing Firm</h3>
            <p class="text-sm text-gray-600 mb-4">Register as a user under an existing firm. You'll need your firm's code.</p>
            <div class="flex flex-col space-y-4">
              <div class="flex items-center border rounded px-3 py-2 shadow-sm">
                <span class="material-icons text-gray-400 mr-2">vpn_key</span>
                <input type="text" id="register-user-firm-code" placeholder="Firm Code" class="w-full outline-none">
              </div>
              <div class="flex items-center border rounded px-3 py-2 shadow-sm">
                <span class="material-icons text-gray-400 mr-2">person</span>
                <input type="text" id="register-user-fullname" placeholder="Full Name" class="w-full outline-none">
              </div>
              <div class="flex items-center border rounded px-3 py-2 shadow-sm">
                <span class="material-icons text-gray-400 mr-2">account_circle</span>
                <input type="text" id="register-user-username" placeholder="Username" class="w-full outline-none">
              </div>
              <div class="flex items-center border rounded px-3 py-2 shadow-sm">
                <span class="material-icons text-gray-400 mr-2">email</span>
                <input type="email" id="register-user-email" placeholder="Email" class="w-full outline-none">
              </div>
              <div class="flex items-center border rounded px-3 py-2 shadow-sm">
                <span class="material-icons text-gray-400 mr-2">lock</span>
                <input type="password" id="register-user-password" placeholder="Password" class="w-full outline-none">
              </div>
              <button id="register-user-btn" class="bg-purple-600 text-white py-2 rounded shadow hover:bg-purple-700 transition">Register User</button>
            </div>
            <p id="register-user-msg" class="mt-2 text-sm"></p>
          </div>
        </div>
      </div>
    `;
  }

  function scripts() {
    if (user) {
      // Logout button
      const logoutBtn = document.getElementById("auth-logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
          try {
            const refreshToken = localStorage.getItem("refreshToken");
            await fetch("/auth/auth/logout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken })
            });
          } catch (err) {
            console.error("Logout error:", err);
          }
          
          localStorage.removeItem("currentUser");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.reload();
          clearAccessTokenTimer();
        });
      }

      // Fetch users based on role
      async function fetchUsers() {
        try {
          const endpoint = user.role === 'admin' ? '/auth/users' : '/auth/users/firm';
          const res = await fetch(endpoint);
          
          if (!res.ok) throw new Error("Failed to fetch users");
          
          const data = await res.json();
          const usersList = document.getElementById("users-list");
          
          if (!usersList) return;
          
          usersList.innerHTML = "";
          
          if (data.users && data.users.length > 0) {
            // Create table
            const table = document.createElement("table");
            table.className = "min-w-full divide-y divide-gray-200";
            
            // Table header
            const thead = document.createElement("thead");
            thead.innerHTML = `
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                ${user.role === 'admin' ? '<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Firm</th>' : ''}
              </tr>
            `;
            table.appendChild(thead);
            
            // Table body
            const tbody = document.createElement("tbody");
            tbody.className = "bg-white divide-y divide-gray-200";
            
            data.users.forEach(u => {
              const tr = document.createElement("tr");
              tr.innerHTML = `
                <td class="px-3 py-2 text-sm text-gray-900">${u.fullname}</td>
                <td class="px-3 py-2 text-sm text-gray-700">${u.username}</td>
                <td class="px-3 py-2 text-sm text-gray-700">${u.email}</td>
                <td class="px-3 py-2 text-sm">
                  <span class="px-2 py-1 text-xs rounded ${
                    u.role === 'admin' ? 'bg-red-100 text-red-800' :
                    u.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }">
                    ${u.role}
                  </span>
                </td>
                ${user.role === 'admin' ? `<td class="px-3 py-2 text-sm text-gray-700">${u.firm_name}</td>` : ''}
              `;
              tbody.appendChild(tr);
            });
            
            table.appendChild(tbody);
            usersList.appendChild(table);
          } else {
            const p = document.createElement("p");
            p.textContent = "No users found";
            p.className = "text-gray-500";
            usersList.appendChild(p);
          }
        } catch (err) {
          console.error(err);
          const usersList = document.getElementById("users-list");
          if (usersList) {
            usersList.innerHTML = "";
            const p = document.createElement("p");
            p.textContent = "Could not load users";
            p.className = "text-red-500";
            usersList.appendChild(p);
          }
        }
      }

      if (user.role === 'admin' || user.role === 'manager') {
        fetchUsers();
      }
      
      return;
    }

    // Tab switching logic
    const loginTab = document.getElementById("tab-login");
    const registerFirmTab = document.getElementById("tab-register-firm");
    const registerUserTab = document.getElementById("tab-register-user");
    
    const loginForm = document.getElementById("login-form");
    const registerFirmForm = document.getElementById("register-firm-form");
    const registerUserForm = document.getElementById("register-user-form");

    function switchTab(activeTab, activeForm) {
      [loginTab, registerFirmTab, registerUserTab].forEach(tab => {
        tab.classList.remove("text-purple-700", "border-b-2", "border-purple-700");
        tab.classList.add("text-gray-500");
      });
      
      [loginForm, registerFirmForm, registerUserForm].forEach(form => {
        form.classList.add("hidden");
      });
      
      activeTab.classList.add("text-purple-700", "border-b-2", "border-purple-700");
      activeTab.classList.remove("text-gray-500");
      activeForm.classList.remove("hidden");
    }

    loginTab.addEventListener("click", () => switchTab(loginTab, loginForm));
    registerFirmTab.addEventListener("click", () => switchTab(registerFirmTab, registerFirmForm));
    registerUserTab.addEventListener("click", () => switchTab(registerUserTab, registerUserForm));

    // Login handler
    const loginBtn = document.getElementById("login-btn");
    if (loginBtn) {
      loginBtn.addEventListener("click", async () => {
        const emailOrUsername = document.getElementById("login-email-username").value;
        const password = document.getElementById("login-password").value;
        const msg = document.getElementById("login-msg");
        
        if (!emailOrUsername || !password) {
          msg.textContent = "Please fill all fields";
          msg.className = "mt-2 text-sm text-red-500";
          return;
        }

        try {
          const res = await fetch("/auth/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emailOrUsername, password })
          });
          
          const data = await res.json();
          
          if (data.success) {
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);
            localStorage.setItem("currentUser", JSON.stringify(data.user));
            onAuthSuccess(data.user);
          } else {
            msg.textContent = data.error;
            msg.className = "mt-2 text-sm text-red-500";
          }
        } catch (err) {
          msg.textContent = "Server error";
          msg.className = "mt-2 text-sm text-red-500";
        }
      });
    }

    // Register Firm handler
    const registerFirmBtn = document.getElementById("register-firm-btn");
    if (registerFirmBtn) {
      registerFirmBtn.addEventListener("click", async () => {
        const firmName = document.getElementById("register-firm-name").value;
        const firmCode = document.getElementById("register-firm-code").value;
        const adminName = document.getElementById("register-firm-admin-name").value;
        const adminUsername = document.getElementById("register-firm-admin-username").value;
        const adminEmail = document.getElementById("register-firm-admin-email").value;
        const adminPassword = document.getElementById("register-firm-admin-password").value;
        const msg = document.getElementById("register-firm-msg");
        
        if (!firmName || !firmCode || !adminName || !adminUsername || !adminEmail || !adminPassword) {
          msg.textContent = "Please fill all fields";
          msg.className = "mt-2 text-sm text-red-500";
          return;
        }

        try {
          const res = await fetch("/auth/auth/register-firm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              firmName, 
              firmCode, 
              adminName, 
              adminUsername, 
              adminEmail, 
              adminPassword 
            })
          });
          
          const data = await res.json();
          
          if (data.success) {
            msg.textContent = "Firm registered successfully! Your firm is pending approval. You'll be notified when you can log in.";
            msg.className = "mt-2 text-sm text-green-600";
            
            // Clear form
            document.getElementById("register-firm-name").value = "";
            document.getElementById("register-firm-code").value = "";
            document.getElementById("register-firm-admin-name").value = "";
            document.getElementById("register-firm-admin-username").value = "";
            document.getElementById("register-firm-admin-email").value = "";
            document.getElementById("register-firm-admin-password").value = "";
          } else {
            msg.textContent = data.error;
            msg.className = "mt-2 text-sm text-red-500";
          }
        } catch (err) {
          msg.textContent = "Server error";
          msg.className = "mt-2 text-sm text-red-500";
        }
      });
    }

    // Register User handler
    const registerUserBtn = document.getElementById("register-user-btn");
    if (registerUserBtn) {
      registerUserBtn.addEventListener("click", async () => {
        const firmCode = document.getElementById("register-user-firm-code").value;
        const fullname = document.getElementById("register-user-fullname").value;
        const username = document.getElementById("register-user-username").value;
        const email = document.getElementById("register-user-email").value;
        const password = document.getElementById("register-user-password").value;
        const msg = document.getElementById("register-user-msg");
        
        if (!firmCode || !fullname || !username || !email || !password) {
          msg.textContent = "Please fill all fields";
          msg.className = "mt-2 text-sm text-red-500";
          return;
        }

        try {
          const res = await fetch("/auth/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              firmCode, 
              fullname, 
              username, 
              email, 
              password 
            })
          });
          
          const data = await res.json();
          
          if (data.success) {
            msg.textContent = "User registered successfully! You can now log in.";
            msg.className = "mt-2 text-sm text-green-600";
            
            // Clear form
            document.getElementById("register-user-firm-code").value = "";
            document.getElementById("register-user-fullname").value = "";
            document.getElementById("register-user-username").value = "";
            document.getElementById("register-user-email").value = "";
            document.getElementById("register-user-password").value = "";
          } else {
            msg.textContent = data.error;
            msg.className = "mt-2 text-sm text-red-500";
          }
        } catch (err) {
          msg.textContent = "Server error";
          msg.className = "mt-2 text-sm text-red-500";
        }
      });
    }
  }

  return { html, scripts };
}