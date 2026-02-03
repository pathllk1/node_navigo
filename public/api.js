const originalFetch = window.fetch;

window.fetch = async (input, init = {}) => {
  const token = localStorage.getItem("token");

  // Ensure headers object exists
  init.headers = init.headers || {};

  // Attach JWT automatically
  if (token) {
    init.headers.Authorization = `Bearer ${token}`;
  }

  const response = await originalFetch(input, init);

  // Optional: global 401 handling
  if (response.status === 401) {
    console.warn("JWT expired or invalid. Logging out...");
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    window.location.href = "/auth";
  }

  return response;
};
