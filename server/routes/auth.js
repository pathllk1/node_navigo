import express from "express";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import { authenticateJWT } from "../middleware/auth.js";

import jwt from "jsonwebtoken";

const JWT_SECRET = "your_super_secret_key";
const JWT_REFRESH_SECRET = "your_super_refresh_secret";
const JWT_EXPIRES_IN = "1h";
const REFRESH_EXPIRES_IN = "30d";


const router = express.Router();
const usersFile = path.join(process.cwd(), "data", "users.json");

// Helper to read/write JSON
function readUsers() {
  if (!fs.existsSync(usersFile)) return [];
  return JSON.parse(fs.readFileSync(usersFile, "utf-8"));
}

function writeUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// ---------------- Fetch all users ----------------
router.get("/users", authenticateJWT, (req, res) => {
  const users = readUsers();
  res.json(users);
});

// ---------------- Register ----------------
router.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields required" });

  const users = readUsers();
  if (users.find(u => u.email === email))
    return res.status(400).json({ error: "Email already exists" });

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: Date.now(),
    name,
    email,
    password: hashedPassword,
    registeredAt: new Date().toISOString(),
    logins: [],
    refreshTokens: []
  };

  users.push(newUser);
  writeUsers(users);

  res.json({ success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
});

// ---------------- Login ----------------
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "All fields required" });

  const users = readUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

  // Add login timestamp
  const loginTime = new Date().toISOString();
  user.logins.push(loginTime);
  writeUsers(users);

  // Generate access token
  const accessToken = jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Generate refresh token (30 days)
  const refreshToken = jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );

  // Store hashed refresh token
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  user.refreshTokens.push(hashedRefreshToken);
  writeUsers(users);

  res.json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      logins: user.logins
    }
  });

});

router.post("/auth/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ error: "Refresh token required" });

  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const users = readUsers();
    const user = users.find(u => u.id === payload.id);

    if (!user) return res.status(401).json({ error: "Invalid refresh token" });

    // Check if refresh token exists
    const isValid = await Promise.any(
      user.refreshTokens.map(rt => bcrypt.compare(refreshToken, rt))
    ).catch(() => false);

    if (!isValid)
      return res.status(401).json({ error: "Invalid refresh token" });

    // Issue new access token
    const newAccessToken = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ error: "Refresh token expired or invalid" });
  }
});



export default router;
