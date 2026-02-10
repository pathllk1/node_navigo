import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db, User } from "../utils/db.js";
import { authenticateJWT } from "../middleware/auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your_super_refresh_secret";
const JWT_EXPIRES_IN = "15m"; // Shorter for better security
const REFRESH_EXPIRES_IN = "30d";

const router = express.Router();

/* --------------------------------------------------
   PREPARED STATEMENTS
-------------------------------------------------- */

const getUserByEmail = db.prepare(`
  SELECT u.*, 
         CASE WHEN u.firm_id IS NOT NULL THEN f.name ELSE NULL END as firm_name,
         CASE WHEN u.firm_id IS NOT NULL THEN f.code ELSE NULL END as firm_code,
         CASE WHEN u.firm_id IS NOT NULL THEN f.status ELSE NULL END as firm_status
  FROM users u
  LEFT JOIN firms f ON f.id = u.firm_id
  WHERE u.email = ?
`);

const getUserById = db.prepare(`
  SELECT u.*, 
         CASE WHEN u.firm_id IS NOT NULL THEN f.name ELSE NULL END as firm_name,
         CASE WHEN u.firm_id IS NOT NULL THEN f.code ELSE NULL END as firm_code,
         CASE WHEN u.firm_id IS NOT NULL THEN f.status ELSE NULL END as firm_status
  FROM users u
  LEFT JOIN firms f ON f.id = u.firm_id
  WHERE u.id = ?
`);

const getUserByUsername = db.prepare(`
  SELECT u.*, 
         CASE WHEN u.firm_id IS NOT NULL THEN f.name ELSE NULL END as firm_name,
         CASE WHEN u.firm_id IS NOT NULL THEN f.code ELSE NULL END as firm_code,
         CASE WHEN u.firm_id IS NOT NULL THEN f.status ELSE NULL END as firm_status
  FROM users u
  LEFT JOIN firms f ON f.id = u.firm_id
  WHERE u.username = ?
`);

const createUser = db.prepare(`
  INSERT INTO users (username, email, fullname, password, role, firm_id, status)
  VALUES (@username, @email, @fullname, @password, @role, @firm_id, @status)
`);

const createFirm = db.prepare(`
  INSERT INTO firms (name, code, description, status)
  VALUES (@name, @code, @description, @status)
`);

const getFirmByCode = db.prepare(`
  SELECT * FROM firms WHERE code = ?
`);

const getAllUsers = db.prepare(`
  SELECT u.id, u.username, u.email, u.fullname, u.role, u.status,
         u.created_at, u.updated_at,
         CASE WHEN u.firm_id IS NOT NULL THEN f.name ELSE 'No Firm' END as firm_name,
         CASE WHEN u.firm_id IS NOT NULL THEN f.code ELSE NULL END as firm_code
  FROM users u
  LEFT JOIN firms f ON f.id = u.firm_id
  WHERE u.role != 'super_admin'
  ORDER BY u.created_at DESC
`);

const getUsersByFirm = db.prepare(`
  SELECT u.id, u.username, u.email, u.fullname, u.role,
         u.created_at, u.updated_at
  FROM users u
  WHERE u.firm_id = ?
  ORDER BY u.created_at DESC
`);

// Initialize refresh_tokens table
db.exec(`
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) STRICT
`);

const saveRefreshToken = db.prepare(`
  INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
  VALUES (?, ?, ?)
`);

const getRefreshToken = db.prepare(`
  SELECT * FROM refresh_tokens
  WHERE user_id = ? AND expires_at > datetime('now')
`);

const deleteRefreshToken = db.prepare(`
  DELETE FROM refresh_tokens WHERE user_id = ? AND token_hash = ?
`);

const deleteAllUserRefreshTokens = db.prepare(`
  DELETE FROM refresh_tokens WHERE user_id = ?
`);

/* --------------------------------------------------
   ROUTES
-------------------------------------------------- */

// ---------------- Register User (Public - Requires Admin Approval) ----------------
router.post("/auth/register", async (req, res) => {
  try {
    const { firmCode, username, email, fullname, password } = req.body;

    // Validation
    if (!firmCode || !username || !email || !fullname || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "All fields are required" 
      });
    }

    // Check if firm exists and is approved
    const firm = getFirmByCode.get(firmCode.toUpperCase());
    if (!firm) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid firm code" 
      });
    }

    if (firm.status !== 'approved') {
      return res.status(403).json({ 
        success: false, 
        error: "Firm is not approved yet" 
      });
    }

    // Check if email or username already exists
    const existingEmail = getUserByEmail.get(email);
    const existingUsername = getUserByUsername.get(username);
    
    if (existingEmail) {
      return res.status(400).json({ 
        success: false, 
        error: "Email already registered" 
      });
    }

    if (existingUsername) {
      return res.status(400).json({ 
        success: false, 
        error: "Username already taken" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with pending status (requires admin approval)
    const result = createUser.run({
      username,
      email,
      fullname,
      password: hashedPassword,
      role: 'user',
      firm_id: firm.id,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: "Registration successful! Your account is pending approval by an administrator.",
      user: {
        id: result.lastInsertRowid,
        username,
        email,
        fullname,
        firm_name: firm.name,
        firm_code: firm.code,
        status: 'pending'
      }
    });

  } catch (err) {
    console.error("Register user error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to register user" 
    });
  }
});

// ---------------- Login ----------------
router.post("/auth/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    console.log(`🔐 Login attempt: ${emailOrUsername}`);

    if (!emailOrUsername || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "Email/username and password are required" 
      });
    }

    // Try to find user by email or username
    let user = getUserByEmail.get(emailOrUsername);
    if (!user) {
      user = getUserByUsername.get(emailOrUsername);
    }

    if (!user) {
      console.log(`❌ User not found: ${emailOrUsername}`);
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    console.log(`✅ User found: ${user.username} (role: ${user.role}, status: ${user.status})`);

    // Check if firm is approved
    if (user.firm_id && user.firm_status !== 'approved') {
      console.log(`❌ Firm not approved: ${user.firm_status}`);
      return res.status(403).json({ 
        success: false, 
        error: "Your firm is not approved yet. Please contact support." 
      });
    }

    // Check if user is approved
    if (user.status !== 'approved') {
      console.log(`❌ User not approved: ${user.status}`);
      return res.status(403).json({ 
        success: false, 
        error: "Your account is pending approval. Please contact your administrator." 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`❌ Password mismatch`);
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    console.log(`✅ Password verified`);

    User.updateLastLogin.run(user.id);
    
    // Get the updated user data (so the frontend gets the new time immediately)
    // You can also just manually add it to the object below to save a DB query:
    user.last_login = new Date().toISOString();

    // Generate access token
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
        firm_id: user.firm_id,
        firm_code: user.firm_code
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { 
        id: user.id,
        firm_id: user.firm_id 
      },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_EXPIRES_IN }
    );

    // Store hashed refresh token
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    saveRefreshToken.run(user.id, hashedRefreshToken, expiresAt);

    // Return user data (without password)
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
      firm_id: user.firm_id,
      firm_name: user.firm_name,
      firm_code: user.firm_code,
      last_login: user.last_login
    };

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: userData
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Login failed" 
    });
  }
});

// ---------------- Refresh Token ----------------
router.post("/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ 
        success: false, 
        error: "Refresh token required" 
      });
    }

    // Verify refresh token
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    // Get user
    const user = getUserById.get(payload.id);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid refresh token" 
      });
    }

    // Check if firm is still approved
    if (user.firm_id && user.firm_status !== 'approved') {
      return res.status(403).json({ 
        success: false, 
        error: "Firm access revoked" 
      });
    }

    // Check if user is still approved
    if (user.status !== 'approved') {
      return res.status(403).json({ 
        success: false, 
        error: "User access revoked" 
      });
    }

    // Verify refresh token exists in database
    const storedTokens = getRefreshToken.all(user.id);
    const isValid = await Promise.any(
      storedTokens.map(rt => bcrypt.compare(refreshToken, rt.token_hash))
    ).catch(() => false);

    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid refresh token" 
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
        firm_id: user.firm_id,
        firm_code: user.firm_code
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ 
      success: true,
      accessToken: newAccessToken 
    });

  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(401).json({ 
      success: false, 
      error: "Refresh token expired or invalid" 
    });
  }
});

// ---------------- Logout ----------------
router.post("/auth/logout", authenticateJWT, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Delete specific refresh token
      const hashedToken = await bcrypt.hash(refreshToken, 10);
      deleteRefreshToken.run(req.user.id, hashedToken);
    } else {
      // Delete all refresh tokens for user
      deleteAllUserRefreshTokens.run(req.user.id);
    }

    res.json({ 
      success: true, 
      message: "Logged out successfully" 
    });

  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Logout failed" 
    });
  }
});

// ---------------- Get All Users (Admin/Super Admin only) ----------------
router.get("/users", authenticateJWT, (req, res) => {
  try {
    // Check if user is admin or super_admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        error: "Access denied" 
      });
    }

    const users = getAllUsers.all();

    res.json({
      success: true,
      users
    });

  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch users" 
    });
  }
});

// ---------------- Get Users by Firm (Manager/Admin) ----------------
router.get("/users/firm", authenticateJWT, (req, res) => {
  try {
    // Check if user is manager or admin
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        error: "Access denied" 
      });
    }

    const users = getUsersByFirm.all(req.user.firm_id);

    res.json({
      success: true,
      users
    });

  } catch (err) {
    console.error("Get firm users error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch users" 
    });
  }
});

// ---------------- Get Current User ----------------
router.get("/auth/me", authenticateJWT, (req, res) => {
  try {
    const user = getUserById.get(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    // Remove password from response
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
      firm_id: user.firm_id,
      firm_name: user.firm_name,
      firm_code: user.firm_code,
      firm_status: user.firm_status,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    res.json({
      success: true,
      user: userData
    });

  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch user" 
    });
  }
});

export default router;