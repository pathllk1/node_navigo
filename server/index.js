import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import apiRoutes from "./routes/api.js";
import authRoutes from "./routes/auth.js";



// Needed because __dirname doesn't exist in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

// Use modular routes
app.use("/api", apiRoutes);
app.use("/auth", authRoutes);

// SPA fallback for all other routes
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
