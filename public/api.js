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
