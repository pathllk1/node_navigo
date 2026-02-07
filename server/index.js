import './utils/db.js' // Initialize the database and create tables
import express from "express";
import path from "path";
import { fileURLToPath } from "url";


import apiRoutes from "./routes/api.js";
import authRoutes from "./routes/auth.js";
import tstRoutes from "./routes/tst.js";
import masterRollRoutes from './routes/masterRoll.routes.js';
import { authenticateJWT } from "./middleware/auth.js";


// Needed because __dirname doesn't exist in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;


// Parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

// Content Security Policy headers - Self only approach
app.use((req, res, next) => {
  // Strict CSP: only allow scripts and styles from same origin
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
  );
  
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  
  // Enable XSS protection in older browsers
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  
  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // CORS and token exposure
  res.setHeader("Access-Control-Expose-Headers", "x-access-token");
  
  next();
});

// Use modular routes
app.use("/api", apiRoutes);
app.use("/auth", authRoutes);
app.use("/tst", authenticateJWT, tstRoutes);
app.use('/api/master-rolls', authenticateJWT, masterRollRoutes);

// SPA fallback for all other routes
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
