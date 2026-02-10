/**
 * Vouchers Routes
 * Handles payment vouchers, receipt vouchers, and journal vouchers
 */

import express from 'express';
import * as vouchersController from '../controllers/vouchers.controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Payment Vouchers
router.get('/payment', vouchersController.getPaymentVouchers);
router.get('/payment/:id', vouchersController.getPaymentVoucherById);
router.post('/payment', vouchersController.createPaymentVoucher);
router.put('/payment/:id', vouchersController.updatePaymentVoucher);
router.delete('/payment/:id', vouchersController.deletePaymentVoucher);

// Receipt Vouchers
router.get('/receipt', vouchersController.getReceiptVouchers);
router.get('/receipt/:id', vouchersController.getReceiptVoucherById);
router.post('/receipt', vouchersController.createReceiptVoucher);
router.put('/receipt/:id', vouchersController.updateReceiptVoucher);
router.delete('/receipt/:id', vouchersController.deleteReceiptVoucher);

// Journal Vouchers
router.get('/journal', vouchersController.getJournalVouchers);
router.get('/journal/:id', vouchersController.getJournalVoucherById);
router.post('/journal', vouchersController.createJournalVoucher);
router.put('/journal/:id', vouchersController.updateJournalVoucher);
router.delete('/journal/:id', vouchersController.deleteJournalVoucher);

// All Vouchers (combined)
router.get('/', vouchersController.getAllVouchers);

// Reports
router.get('/reports/summary', vouchersController.getVouchersSummary);
router.get('/reports/by-account', vouchersController.getVouchersByAccount);

export default router;
