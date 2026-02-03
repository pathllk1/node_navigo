import express from "express";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import { authenticateJWT } from "../middleware/auth.js";

import jwt from "jsonwebtoken";

const JWT_SECRET = "your_super_secret_key"; // store in env variable in production
const JWT_EXPIRES_IN = "1h"; // token expiration


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
    logins: []
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

  // Generate JWT
  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.json({
    success: true,
    token, // send JWT to client
    user: { id: user.id, name: user.name, email: user.email, logins: user.logins }
  });
});


export default router;
