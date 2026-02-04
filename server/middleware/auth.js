// middleware/auth.js
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";

const ACCESS_SECRET = "your_super_secret_key";
const REFRESH_SECRET = "your_super_refresh_secret";

const usersFile = path.join(process.cwd(), "data", "users.json");

function readUsers() {
  if (!fs.existsSync(usersFile)) return [];
  return JSON.parse(fs.readFileSync(usersFile, "utf-8"));
}

export async function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  const refreshToken = req.headers["x-refresh-token"];

  const accessToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  // ❌ No access token at all
  if (!accessToken) {
    return res.status(401).json({ error: "Unauthorized: No access token" });
  }

  // 1️⃣ ACCESS TOKEN VALID → PASS
  try {
    const decoded = jwt.verify(accessToken, ACCESS_SECRET);
    req.user = decoded;
    return next();
  } catch (accessErr) {
    // Access token invalid → try refresh
  }

  // 2️⃣ ACCESS INVALID + NO REFRESH → REJECT
  if (!refreshToken) {
    return res.status(401).json({ error: "Unauthorized: Token expired" });
  }

  // 3️⃣ VERIFY REFRESH TOKEN
  try {
    const refreshPayload = jwt.verify(refreshToken, REFRESH_SECRET);
    const users = readUsers();
    const user = users.find(u => u.id === refreshPayload.id);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check refresh token exists (hashed)
    const isValidRefresh = await Promise.any(
      user.refreshTokens.map(rt => bcrypt.compare(refreshToken, rt))
    ).catch(() => false);

    // ❌ Refresh invalid
    if (!isValidRefresh) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 4️⃣ ACCESS INVALID + REFRESH VALID → ISSUE NEW ACCESS TOKEN
    const newAccessToken = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      ACCESS_SECRET,
      { expiresIn: "1h" }
    );

    // Attach new token to response
    res.setHeader("x-access-token", newAccessToken);

    // Attach user to request
    req.user = { id: user.id, name: user.name, email: user.email };

    return next();
  } catch (refreshErr) {
    // ❌ Refresh expired or invalid
    return res.status(401).json({ error: "Unauthorized" });
  }
}
