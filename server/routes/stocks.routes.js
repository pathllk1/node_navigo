/**
 * Stocks Routes
 * Handles inventory/stock item management
 */

import express from 'express';
import * as stocksController from '../controllers/stocks.controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Stock CRUD operations
router.get('/', stocksController.getAllStocks);
router.get('/:id', stocksController.getStockById);
router.post('/', stocksController.createStock);
router.put('/:id', stocksController.updateStock);
router.delete('/:id', stocksController.deleteStock);

// Stock movements/register
router.get('/:id/movements', stocksController.getStockMovements);
router.post('/:id/movements', stocksController.addStockMovement);
router.get('/:id/register', stocksController.getStockRegister);

// Stock adjustments
router.post('/:id/adjust', stocksController.adjustStock);

// Stock reports
router.get('/reports/low-stock', stocksController.getLowStockItems);
router.get('/reports/stock-summary', stocksController.getStockSummary);
router.get('/reports/stock-valuation', stocksController.getStockValuation);

// Bulk operations
router.post('/bulk/import', stocksController.importStocks);
router.get('/bulk/export', stocksController.exportStocks);

// Search
router.get('/search/:query', stocksController.searchStocks);

export default router;
