const originalFetch = window.fetch;

window.fetch = async (input, init = {}) => {
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  // Ensure headers exist
  init.headers = init.headers || {};

  // Attach access token
  if (accessToken) {
    init.headers.Authorization = `Bearer ${accessToken}`;
  }

  // Attach refresh token
  if (refreshToken) {
    init.headers["x-refresh-token"] = refreshToken;
  }

  const response = await originalFetch(input, init);

  // 🔁 Check for new access token from server
  const newAccessToken = response.headers.get("x-access-token");
  if (newAccessToken) {
    console.info("Received new access token, updating storage");
    localStorage.setItem("accessToken", newAccessToken);
     startAccessTokenTimer();
  }

  // 🚨 Global 401 handling
  if (response.status === 401) {
    console.warn("Auth failed. Logging out...");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("currentUser");
    window.location.href = "/auth";
  }

  return response;
};


let tokenTimerInterval = null;

export function startAccessTokenTimer() {
  const timerEl = document.getElementById("token-timer");
  if (!timerEl) return;

  if (tokenTimerInterval) clearInterval(tokenTimerInterval);

  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    timerEl.textContent = "";
    return;
  }

  let payload;
  try {
    payload = JSON.parse(atob(accessToken.split(".")[1]));
  } catch {
    timerEl.textContent = "";
    return;
  }

  const expMs = payload.exp * 1000;

  tokenTimerInterval = setInterval(() => {
    const remaining = expMs - Date.now();

    if (remaining <= 0) {
      timerEl.textContent = "Session expired";
      clearInterval(tokenTimerInterval);
      return;
    }

    const m = Math.floor(remaining / 60000);
    const s = Math.floor((remaining % 60000) / 1000)
      .toString()
      .padStart(2, "0");

    timerEl.textContent = `Session ${m}:${s}`;

    // optional visual warning
    timerEl.className =
      "ml-auto text-sm font-mono " +
      (remaining < 60000
        ? "text-red-300"
        : remaining < 180000
        ? "text-yellow-200"
        : "opacity-90");
  }, 1000);
}

export function clearAccessTokenTimer() {
  if (tokenTimerInterval) clearInterval(tokenTimerInterval);
  const el = document.getElementById("token-timer");
  if (el) el.textContent = "";
}

