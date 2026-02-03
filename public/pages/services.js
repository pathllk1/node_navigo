export function ServicesPage() {
  const html = `
    <h1>Services Page</h1>
    <p>Fetching user data from server API:</p>
    <ul id="user-list"></ul>
  `;
  function scripts() {
    fetch("/api/users")
      .then(res => res.json())
      .then(users => {
        const ul = document.getElementById("user-list");
        users.forEach(u => {
          const li = document.createElement("li");
          li.textContent = `ID: ${u.id}, Name: ${u.name}, Age: ${u.age}`;
          ul.appendChild(li);
        });
      });
  }
  return { html, scripts };
}
