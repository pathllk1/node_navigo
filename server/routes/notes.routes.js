/**
 * Notes Routes
 * Handles credit notes, debit notes, and delivery notes
 */

import express from 'express';
import * as notesController from '../controllers/notes.controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Credit Notes (Sales Returns)
router.get('/credit', notesController.getCreditNotes);
router.get('/credit/:id', notesController.getCreditNoteById);
router.post('/credit', notesController.createCreditNote);
router.put('/credit/:id', notesController.updateCreditNote);
router.delete('/credit/:id', notesController.deleteCreditNote);
router.get('/credit/:id/pdf', notesController.getCreditNotePDF);

// Debit Notes (Purchase Returns)
router.get('/debit', notesController.getDebitNotes);
router.get('/debit/:id', notesController.getDebitNoteById);
router.post('/debit', notesController.createDebitNote);
router.put('/debit/:id', notesController.updateDebitNote);
router.delete('/debit/:id', notesController.deleteDebitNote);
router.get('/debit/:id/pdf', notesController.getDebitNotePDF);

// Delivery Notes
router.get('/delivery', notesController.getDeliveryNotes);
router.get('/delivery/:id', notesController.getDeliveryNoteById);
router.post('/delivery', notesController.createDeliveryNote);
router.put('/delivery/:id', notesController.updateDeliveryNote);
router.delete('/delivery/:id', notesController.deleteDeliveryNote);
router.post('/delivery/:id/convert-to-sales', notesController.convertDeliveryNoteToSales);
router.get('/delivery/:id/pdf', notesController.getDeliveryNotePDF);

export default router;
