// middleware/auth.js
import jwt from "jsonwebtoken";

const SECRET_KEY = "your_super_secret_key"; // keep this in env in production

export function authenticateJWT(req, res, next) {
  // Expect token in Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // attach decoded payload to req.user
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}
