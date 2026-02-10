/**
 * Ledger Routes
 * Handles chart of accounts, ledger entries, and financial reports
 */

import express from 'express';
import * as ledgerController from '../controllers/ledger.controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Chart of Accounts
router.get('/accounts', ledgerController.getAllAccounts);
router.get('/accounts/:name', ledgerController.getAccountByName);
router.post('/accounts', ledgerController.createAccount);
router.put('/accounts/:name', ledgerController.updateAccount);
router.delete('/accounts/:name', ledgerController.deleteAccount);

// Ledger Entries
router.get('/entries', ledgerController.getAllEntries);
router.get('/entries/:id', ledgerController.getEntryById);
router.post('/entries', ledgerController.createManualEntry);
router.delete('/entries/:id', ledgerController.deleteEntry);

// Account Ledger
router.get('/accounts/:name/ledger', ledgerController.getAccountLedger);
router.get('/accounts/:name/balance', ledgerController.getAccountBalance);

// Trial Balance
router.get('/trial-balance', ledgerController.getTrialBalance);

// Financial Reports
router.get('/reports/profit-loss', ledgerController.getProfitLoss);
router.get('/reports/balance-sheet', ledgerController.getBalanceSheet);
router.get('/reports/cash-flow', ledgerController.getCashFlow);

// Group-wise reports
router.get('/reports/by-group', ledgerController.getAccountsByGroup);

export default router;
