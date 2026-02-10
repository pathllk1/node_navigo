/**
 * Parties Routes
 * Handles customer/supplier management
 */

import express from 'express';
import * as partiesController from '../controllers/parties.controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Party CRUD operations
router.get('/', partiesController.getAllParties);
router.get('/:id', partiesController.getPartyById);
router.post('/', partiesController.createParty);
router.put('/:id', partiesController.updateParty);
router.delete('/:id', partiesController.deleteParty);

// Party GST management
router.get('/:id/gsts', partiesController.getPartyGSTs);
router.post('/:id/gsts', partiesController.addPartyGST);
router.put('/:id/gsts/:gstId', partiesController.updatePartyGST);
router.delete('/:id/gsts/:gstId', partiesController.deletePartyGST);

// Party ledger
router.get('/:id/ledger', partiesController.getPartyLedger);
router.get('/:id/balance', partiesController.getPartyBalance);

// Party transactions
router.get('/:id/bills', partiesController.getPartyBills);
router.get('/:id/outstanding', partiesController.getPartyOutstanding);

// Bulk operations
router.post('/bulk/import', partiesController.importParties);
router.get('/bulk/export', partiesController.exportParties);

// Search and filter
router.get('/search/:query', partiesController.searchParties);

export default router;
