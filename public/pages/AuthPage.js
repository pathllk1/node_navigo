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
          <p class="text-gray-600 mb-2"><strong>Firm:</strong> ${user.firm_name || 'System Admin'} ${user.firm_code ? `(${user.firm_code})` : ''}</p>
          <p class="text-gray-600 mb-2"><strong>Role:</strong> ${user.role}</p>
          <p class="text-gray-600 mb-4"><strong>Email:</strong> ${user.email}</p>
          
          ${user.role === 'super_admin' ? `
          <a href="/admin" data-navigo class="inline-block bg-purple-600 text-white px-6 py-3 rounded shadow hover:bg-purple-700 transition mb-3 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="inline-block w-5 h-5 mr-2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Go to Admin Panel
          </a>
          ` : ''}
          
          <button id="auth-logout-btn" class="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600 transition">
            Logout
          </button>
        </div>
        
        ${user.role === 'super_admin' ? `
        <div class="w-full max-w-2xl p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow">
          <div class="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-blue-500 mr-3 flex-shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <div>
              <h4 class="font-semibold text-blue-800 mb-1">Super Admin Features</h4>
              <p class="text-sm text-blue-700">Click the "Go to Admin Panel" button above or the gear icon in the sidebar to access:</p>
              <ul class="text-sm text-blue-700 mt-2 ml-4 list-disc">
                <li>Create new firms and firm admins</li>
                <li>Manage all firms (approve/reject)</li>
                <li>Approve or reject pending user registrations</li>
              </ul>
            </div>
          </div>
        </div>
        ` : ''}
        
        ${user.role === 'admin' || user.role === 'manager' || user.role === 'super_admin' ? `
        <div id="firm-users" class="w-full max-w-2xl p-6 bg-white rounded-xl shadow-lg text-left">
          <h3 class="text-lg font-semibold text-purple-700 mb-2">
            ${user.role === 'super_admin' ? 'All Users' : 'Firm Users'}:
          </h3>
          <div id="users-list" class="text-gray-700"></div>
        </div>
        ` : ''}
      </div>
    `;
  } else {
    // No user → show login/register forms
    html = `
      <div class="flex items-center justify-center min-h-[calc(100vh-4rem)] py-6">
        <div class="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
          <!-- Tabs -->
          <div class="flex justify-center mb-6 border-b-2 border-gray-200">
            <button id="tab-login" class="tab-btn px-4 py-2 text-purple-700 border-b-2 border-purple-700 font-semibold focus:outline-none">Login</button>
            <button id="tab-register-user" class="tab-btn px-4 py-2 text-gray-500 hover:text-purple-700 font-semibold focus:outline-none">Register</button>
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

          <!-- Register User Form -->
          <div id="register-user-form" class="tab-content hidden">
            <h3 class="text-xl font-semibold text-purple-700 mb-4">Register New Account</h3>
            <p class="text-sm text-gray-600 mb-4">Register as a user. You'll need your firm's code and admin approval.</p>
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
              <button id="register-user-btn" class="bg-purple-600 text-white py-2 rounded shadow hover:bg-purple-700 transition">Register</button>
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
          // Only super_admin can see all users, regular admin/manager see their firm only
          const endpoint = user.role === 'super_admin' ? '/auth/users' : '/auth/users/firm';
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
                ${user.role === 'super_admin' ? '<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Firm</th>' : ''}
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
                ${user.role === 'super_admin' ? `<td class="px-3 py-2 text-sm text-gray-700">${u.firm_name || 'No Firm'}</td>` : ''}
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

      if (user.role === 'admin' || user.role === 'manager' || user.role === 'super_admin') {
        fetchUsers();
      }
      
      return;
    }

    // Tab switching logic
    const loginTab = document.getElementById("tab-login");
    const registerUserTab = document.getElementById("tab-register-user");
    
    const loginForm = document.getElementById("login-form");
    const registerUserForm = document.getElementById("register-user-form");

    function switchTab(activeTab, activeForm) {
      [loginTab, registerUserTab].forEach(tab => {
        tab.classList.remove("text-purple-700", "border-b-2", "border-purple-700");
        tab.classList.add("text-gray-500");
      });
      
      [loginForm, registerUserForm].forEach(form => {
        form.classList.add("hidden");
      });
      
      activeTab.classList.add("text-purple-700", "border-b-2", "border-purple-700");
      activeTab.classList.remove("text-gray-500");
      activeForm.classList.remove("hidden");
    }

    loginTab.addEventListener("click", () => switchTab(loginTab, loginForm));
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
            msg.textContent = "Registration successful! Your account is pending approval by an administrator.";
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