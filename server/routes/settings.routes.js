/**
 * Settings Routes
 * Handles firm settings, system settings, and configurations
 */

import express from 'express';
import * as settingsController from '../controllers/settings.controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Firm Settings
router.get('/firm', settingsController.getFirmSettings);
router.put('/firm', settingsController.updateFirmSettings);

// Invoice Settings
router.get('/invoice', settingsController.getInvoiceSettings);
router.put('/invoice', settingsController.updateInvoiceSettings);

// Number Format Settings
router.get('/number-format', settingsController.getNumberFormatSettings);
router.put('/number-format', settingsController.updateNumberFormatSettings);

// Tax Settings
router.get('/tax', settingsController.getTaxSettings);
router.put('/tax', settingsController.updateTaxSettings);

// System Settings (Admin only)
router.get('/system', settingsController.getSystemSettings);
router.put('/system', settingsController.updateSystemSettings);

// Backup & Restore (Admin only)
router.post('/backup', settingsController.createBackup);
router.post('/restore', settingsController.restoreBackup);
router.get('/backups', settingsController.listBackups);

export default router;
