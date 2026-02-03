export function AboutPage() {
  // Dynamic user object
  const user = { name: "Alice", age: 25 };

  // Dynamic content
  const currentTime = new Date().toLocaleTimeString();
  const randomFact = [
    "Navigo makes SPA routing easy!",
    "JavaScript is fun!",
    "Node.js + SPA = powerful combo!"
  ];
  const fact = randomFact[Math.floor(Math.random() * randomFact.length)];

  // HTML as string (important!)
  const html = `
    <h1>About Page</h1>
    <ul>
      <li>Name: <strong>${user.name}</strong></li>
      <li>Age: <strong>${user.age}</strong></li>
      <li>Current time: <strong>${currentTime}</strong></li>
      <li>Random fact: <strong>${fact}</strong></li>
    </ul>

    <button id="about-btn">Click Me</button>
    <p id="about-msg"></p>
  `;

  // Page-specific scripts
  function scripts() {
    const btn = document.getElementById("about-btn");
    const msg = document.getElementById("about-msg");

    btn.addEventListener("click", () => {
      msg.textContent = `You clicked the button at ${new Date().toLocaleTimeString()}`;
    });
  }

  return { html, scripts };
}
