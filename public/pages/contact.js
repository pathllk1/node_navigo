export function ContactPage() {
  const html = `
    <h1>Contact Page</h1>
    <ul>
      <li>Email: support@example.com</li>
      <li>Phone: +1 234 567 890</li>
    </ul>
  `;

  function scripts() {
    // Optional scripts for Contact page
    console.log("Contact page loaded");
  }

  return { html, scripts };
}
