/**
 * Banking Routes
 * Handles bank accounts, transactions, and reconciliation
 */

import express from 'express';
import * as bankingController from '../controllers/banking.controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Bank Accounts
router.get('/accounts', bankingController.getAllBankAccounts);
router.get('/accounts/:id', bankingController.getBankAccountById);
router.post('/accounts', bankingController.createBankAccount);
router.put('/accounts/:id', bankingController.updateBankAccount);
router.delete('/accounts/:id', bankingController.deleteBankAccount);
router.get('/accounts/:id/balance', bankingController.getAccountBalance);

// Bank Transactions
router.get('/transactions', bankingController.getAllTransactions);
router.get('/transactions/:id', bankingController.getTransactionById);
router.post('/transactions', bankingController.createTransaction);
router.put('/transactions/:id', bankingController.updateTransaction);
router.delete('/transactions/:id', bankingController.deleteTransaction);

// Bank Reconciliation
router.get('/reconciliation/:accountId', bankingController.getReconciliationData);
router.post('/reconciliation/:accountId/match', bankingController.matchTransaction);
router.post('/reconciliation/:accountId/unmatch', bankingController.unmatchTransaction);
router.get('/reconciliation/:accountId/summary', bankingController.getReconciliationSummary);

// Bank Statements
router.post('/statements/import', bankingController.importBankStatement);
router.get('/statements/:accountId', bankingController.getBankStatements);

// Reports
router.get('/reports/cashbook', bankingController.getCashbook);
router.get('/reports/bankbook/:accountId', bankingController.getBankbook);

export default router;
