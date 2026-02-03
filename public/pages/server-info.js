export function ServerInfoPage() {
  const html = `
    <h1 id="server-title">Loading...</h1>
    <p id="server-message"></p>
    <p id="server-time"></p>
  `;

  async function scripts() {
    try {
      const res = await fetch("/api/server-info");
      const data = await res.json();

      document.getElementById("server-title").textContent = data.title;
      document.getElementById("server-message").textContent = data.message;
      document.getElementById("server-time").textContent = "Time: " + data.timestamp;
    } catch (err) {
      console.error("Error fetching server info:", err);
      document.getElementById("server-title").textContent = "Error loading data";
    }
  }

  return { html, scripts };
}
