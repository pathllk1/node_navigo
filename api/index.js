import 'dotenv/config.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

// Initialize database
(async () => {
  try {
    await import('../server/utils/db.js');
  } catch (err) {
    console.error('⚠️  Database initialization failed:', err.message);
  }
})();

import apiRoutes from '../server/routes/api.js';
import authRoutes from '../server/routes/auth.js';
import adminRoutes from '../server/routes/admin.js';
import tstRoutes from '../server/routes/tst.js';
import masterRollRoutes from '../server/routes/masterRoll.routes.js';
import wagesRoutes from '../server/routes/wages.routes.js';
import settingsRoutes from '../server/routes/settings.routes.js';
import inventorySalesRoutes from '../server/routes/inventory/sls.js';
import { authenticateJWT } from '../server/middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Security headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Access-Control-Expose-Headers', 'x-access-token');
  next();
});

// Routes
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/tst', authenticateJWT, tstRoutes);
app.use('/api/master-rolls', authenticateJWT, masterRollRoutes);
app.use('/api/wages', authenticateJWT, wagesRoutes);
app.use('/api/settings', authenticateJWT, settingsRoutes);
app.use('/api/inventory/sales', authenticateJWT, inventorySalesRoutes);

// SPA fallback
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

export default app;
