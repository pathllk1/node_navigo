export function HomePage() {
  const html = `
    <h1>Home Page</h1>
    <p>Welcome to the SPA home page!</p>
  `;
  function scripts() {
    console.log("Home page scripts running");
  }
  return { html, scripts };
}
