/**
 * Purchase Routes
 * Handles purchase bills and debit notes
 */

import express from 'express';
import * as purchaseController from '../controllers/purchase.controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Purchase bills CRUD
router.get('/', purchaseController.getAllPurchaseBills);
router.get('/:id', purchaseController.getPurchaseBillById);
router.post('/', purchaseController.createPurchaseBill);
router.put('/:id', purchaseController.updatePurchaseBill);
router.delete('/:id', purchaseController.deletePurchaseBill);

// Bill status management
router.patch('/:id/status', purchaseController.updateBillStatus);
router.patch('/:id/payment', purchaseController.recordPayment);

// Debit notes
router.post('/:id/debit-note', purchaseController.createDebitNote);

// PDF generation
router.get('/:id/pdf', purchaseController.generateBillPDF);

// Reports
router.get('/reports/summary', purchaseController.getPurchaseSummary);
router.get('/reports/by-party', purchaseController.getPurchaseByParty);
router.get('/reports/by-item', purchaseController.getPurchaseByItem);

export default router;
