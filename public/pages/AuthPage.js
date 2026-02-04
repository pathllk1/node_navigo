import { clearAccessTokenTimer } from "../api.js";
export function AuthPage(onAuthSuccess) {
  // Check if a user is logged in
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const accessToken = localStorage.getItem("accessToken");
  

  let html = "";

  if (user) {
    // User is logged in → show welcome message + all users
    html = `
      <div class="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] space-y-6">
        <div class="w-full max-w-2xl p-6 bg-white rounded-xl shadow-lg text-center">
          <h2 class="text-2xl font-semibold text-purple-700 mb-4">Welcome, ${user.name}!</h2>
          <p class="text-gray-600 mb-4">You are already logged in.</p>
          <button id="auth-logout-btn" class="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600 transition">
            Logout
          </button>
        </div>
        <div id="all-users" class="w-full max-w-2xl p-6 bg-white rounded-xl shadow-lg text-left">
          <h3 class="text-lg font-semibold text-purple-700 mb-2">All Users:</h3>
          <ul id="users-list" class="list-disc list-inside text-gray-700"></ul>
        </div>
      </div>
    `;
  } else {
    // No user → show login/register forms (unchanged)
    html = `
      <div class="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div class="w-full max-w-2xl p-6 bg-white rounded-xl shadow-lg">
          <!-- Tabs -->
          <div class="flex justify-center mb-6 border-b-2 border-gray-200">
            <button id="tab-login" class="tab-btn px-4 py-2 text-purple-700 border-b-2 border-purple-700 font-semibold focus:outline-none">Login</button>
            <button id="tab-register" class="tab-btn px-4 py-2 text-gray-500 hover:text-purple-700 font-semibold focus:outline-none">Register</button>
          </div>

          <!-- Login Form -->
          <div id="login-form" class="tab-content">
            <div class="flex flex-col space-y-4">
              <div class="flex items-center border rounded px-3 py-2 shadow-sm">
                <span class="material-icons text-gray-400 mr-2">email</span>
                <input type="email" id="login-email" placeholder="Email" class="w-full outline-none">
              </div>
              <div class="flex items-center border rounded px-3 py-2 shadow-sm">
                <span class="material-icons text-gray-400 mr-2">lock</span>
                <input type="password" id="login-password" placeholder="Password" class="w-full outline-none">
              </div>
              <button id="login-btn" class="bg-purple-600 text-white py-2 rounded shadow hover:bg-purple-700 transition">Login</button>
            </div>
            <p id="login-msg" class="mt-2 text-sm text-red-500"></p>
          </div>

          <!-- Register Form -->
          <div id="register-form" class="tab-content hidden">
            <div class="flex flex-col space-y-4">
              <div class="flex items-center border rounded px-3 py-2 shadow-sm">
                <span class="material-icons text-gray-400 mr-2">person</span>
                <input type="text" id="register-name" placeholder="Full Name" class="w-full outline-none">
              </div>
              <div class="flex items-center border rounded px-3 py-2 shadow-sm">
                <span class="material-icons text-gray-400 mr-2">email</span>
                <input type="email" id="register-email" placeholder="Email" class="w-full outline-none">
              </div>
              <div class="flex items-center border rounded px-3 py-2 shadow-sm">
                <span class="material-icons text-gray-400 mr-2">lock</span>
                <input type="password" id="register-password" placeholder="Password" class="w-full outline-none">
              </div>
              <button id="register-btn" class="bg-purple-600 text-white py-2 rounded shadow hover:bg-purple-700 transition">Register</button>
            </div>
            <p id="register-msg" class="mt-2 text-sm text-red-500"></p>
          </div>
        </div>
      </div>
    `;
  }

  function scripts() {
    if (user) {
      // Logout button
      const logoutBtn = document.getElementById("auth-logout-btn");
      if (logoutBtn) logoutBtn.onclick = () => {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("accessToken"); // remove JWT
        localStorage.removeItem("refreshToken");
        window.location.reload();
        clearAccessTokenTimer();
      };

      // Fetch all users with JWT
      async function fetchUsers() {
        try {
          const res = await fetch("/auth/users");
          if (!res.ok) throw new Error("Failed to fetch users");
          const users = await res.json();
          const usersList = document.getElementById("users-list");
          usersList.innerHTML = users
            .map(u => `<li>${u.name} (${u.email})</li>`)
            .join("");
        } catch (err) {
          console.error(err);
          const usersList = document.getElementById("users-list");
          usersList.innerHTML = "<li class='text-red-500'>Could not load users</li>";
        }
      }

      fetchUsers();
      return;
    }

    // Tabs + Login/Register logic (unchanged)
    const loginTab = document.getElementById("tab-login");
    const registerTab = document.getElementById("tab-register");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    loginTab.onclick = () => {
      loginForm.classList.remove("hidden");
      registerForm.classList.add("hidden");
      loginTab.classList.add("text-purple-700", "border-b-2", "border-purple-700");
      loginTab.classList.remove("text-gray-500");
      registerTab.classList.remove("text-purple-700", "border-b-2", "border-purple-700");
      registerTab.classList.add("text-gray-500");
    };
    registerTab.onclick = () => {
      registerForm.classList.remove("hidden");
      loginForm.classList.add("hidden");
      registerTab.classList.add("text-purple-700", "border-b-2", "border-purple-700");
      registerTab.classList.remove("text-gray-500");
      loginTab.classList.remove("text-purple-700", "border-b-2", "border-purple-700");
      loginTab.classList.add("text-gray-500");
    };

    // Login
    document.getElementById("login-btn").onclick = async () => {
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      const msg = document.getElementById("login-msg");
      if (!email || !password) return msg.textContent = "Please fill all fields";

      try {
        const res = await fetch("/auth/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem("accessToken", data.accessToken); // save JWT
          localStorage.setItem("refreshToken", data.refreshToken);
          localStorage.setItem("currentUser", JSON.stringify(data.user));
          onAuthSuccess(data.user);
        } else {
          msg.textContent = data.error;
        }
      } catch (err) {
        msg.textContent = "Server error";
      }
    };

    // Register
    document.getElementById("register-btn").onclick = async () => {
      const name = document.getElementById("register-name").value;
      const email = document.getElementById("register-email").value;
      const password = document.getElementById("register-password").value;
      const msg = document.getElementById("register-msg");
      if (!name || !email || !password) return msg.textContent = "Please fill all fields";

      try {
        const res = await fetch("/auth/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem("accessToken", data.token);
          localStorage.setItem("currentUser", JSON.stringify(data.user));
          msg.textContent = `Registered ${data.user.name}`;
          msg.className = "mt-2 text-sm text-green-600";
          onAuthSuccess(data.user);
        } else {
          msg.textContent = data.error;
          msg.className = "mt-2 text-sm text-red-500";
        }
      } catch (err) {
        msg.textContent = "Server error";
        msg.className = "mt-2 text-sm text-red-500";
      }
    };
  }

  return { html, scripts };
}
