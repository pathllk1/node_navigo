import express from 'express';
import {
  createMasterRoll,
  getAllMasterRolls,
  getMasterRollById,
  updateMasterRoll,
  deleteMasterRoll,
  searchMasterRolls,
  getMasterRollStats,
  getActivityLog,
  bulkImportMasterRolls,
  exportMasterRolls,
  bulkCreateMasterRoll,
  bulkDeleteMasterRolls
} from '../controllers/masterRoll.controller.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication (applied at app level)
// Additional role-based restrictions applied per route

// CRUD Operations
router.post('/', createMasterRoll);                           // Create (all authenticated users)
router.get('/', getAllMasterRolls);                           // Read all (firm-specific)
router.get('/stats', getMasterRollStats);                     // Get statistics
router.get('/search', searchMasterRolls);                     // Search
router.get('/export', exportMasterRolls);                     // Export
router.get('/:id', getMasterRollById);                        // Read one (firm-specific)
router.get('/:id/activity', getActivityLog);                  // Get activity log
router.put('/:id', updateMasterRoll);                         // Update (firm-specific)
router.delete('/:id', deleteMasterRoll);                      // Delete (manager/admin only)

// Bulk Operations
router.post('/bulk-import', bulkImportMasterRolls);
router.post("/bulk", bulkCreateMasterRoll);                   // Bulk create (manager/admin only)
router.delete('/bulk-delete', bulkDeleteMasterRolls);         // Bulk delete (manager/admin only)

export default router;