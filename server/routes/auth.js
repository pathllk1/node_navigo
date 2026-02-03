import express from "express";
import fs from "fs";
import path from "path";

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
router.get("/users", (req, res) => {
  const users = readUsers();
  res.json(users);
});

// ---------------- Register ----------------
router.post("/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields required" });

  const users = readUsers();
  if (users.find(u => u.email === email))
    return res.status(400).json({ error: "Email already exists" });

  const newUser = {
    id: Date.now(),
    name,
    email,
    password,
    registeredAt: new Date().toISOString(),
    logins: []
  };

  users.push(newUser);
  writeUsers(users);

  res.json({ success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
});

// ---------------- Login ----------------
router.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "All fields required" });

  const users = readUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  // Add login timestamp
  const loginTime = new Date().toISOString();
  user.logins.push(loginTime);
  writeUsers(users);

  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, logins: user.logins } });
});

export default router;
