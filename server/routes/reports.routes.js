/**
 * Reports Routes
 * Handles all business reports and analytics
 */

import express from 'express';
import * as reportsController from '../controllers/reports.controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Sales Reports
router.get('/sales/summary', reportsController.getSalesSummary);
router.get('/sales/by-party', reportsController.getSalesByParty);
router.get('/sales/by-item', reportsController.getSalesByItem);
router.get('/sales/by-month', reportsController.getSalesByMonth);
router.get('/sales/outstanding', reportsController.getSalesOutstanding);

// Purchase Reports
router.get('/purchase/summary', reportsController.getPurchaseSummary);
router.get('/purchase/by-party', reportsController.getPurchaseByParty);
router.get('/purchase/by-item', reportsController.getPurchaseByItem);
router.get('/purchase/by-month', reportsController.getPurchaseByMonth);
router.get('/purchase/outstanding', reportsController.getPurchaseOutstanding);

// Stock Reports
router.get('/stock/summary', reportsController.getStockSummary);
router.get('/stock/valuation', reportsController.getStockValuation);
router.get('/stock/movements', reportsController.getStockMovements);
router.get('/stock/low-stock', reportsController.getLowStockItems);
router.get('/stock/aging', reportsController.getStockAging);

// Party Reports
router.get('/party/debtors', reportsController.getDebtorsReport);
router.get('/party/creditors', reportsController.getCreditorsReport);
router.get('/party/aging', reportsController.getPartyAging);
router.get('/party/ledger/:partyId', reportsController.getPartyLedger);

// GST Reports
router.get('/gst/summary', reportsController.getGSTSummary);
router.get('/gst/sales', reportsController.getGSTSalesReport);
router.get('/gst/purchase', reportsController.getGSTPurchaseReport);
router.get('/gst/gstr1', reportsController.getGSTR1Report);
router.get('/gst/gstr3b', reportsController.getGSTR3BReport);

// Financial Reports
router.get('/financial/profit-loss', reportsController.getProfitLoss);
router.get('/financial/balance-sheet', reportsController.getBalanceSheet);
router.get('/financial/cash-flow', reportsController.getCashFlow);
router.get('/financial/trial-balance', reportsController.getTrialBalance);

// Dashboard Reports
router.get('/dashboard/overview', reportsController.getDashboardOverview);
router.get('/dashboard/charts', reportsController.getDashboardCharts);

export default router;
