/**
 * Sales Routes
 * Handles sales bills, credit notes, and delivery notes
 */

import express from 'express';
import * as salesController from '../controllers/sales.controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Sales bills CRUD
router.get('/', salesController.getAllSalesBills);
router.get('/:id', salesController.getSalesBillById);
router.post('/', salesController.createSalesBill);
router.put('/:id', salesController.updateSalesBill);
router.delete('/:id', salesController.deleteSalesBill);

// Bill status management
router.patch('/:id/status', salesController.updateBillStatus);
router.patch('/:id/payment', salesController.recordPayment);

// Credit notes
router.post('/:id/credit-note', salesController.createCreditNote);

// Delivery notes
router.post('/delivery-note', salesController.createDeliveryNote);
router.post('/delivery-note/:id/convert', salesController.convertDeliveryNoteToSales);

// PDF generation
router.get('/:id/pdf', salesController.generateBillPDF);

// Reports
router.get('/reports/summary', salesController.getSalesSummary);
router.get('/reports/by-party', salesController.getSalesByParty);
router.get('/reports/by-item', salesController.getSalesByItem);

export default router;
