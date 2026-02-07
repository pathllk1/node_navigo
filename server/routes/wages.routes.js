import express from 'express';
import {
  getEmployeesForWages,
  createWagesBulk,
  getWagesForMonth,
  updateWage,
  deleteWage,
  getWageById
} from '../controllers/wages.controller.js';

const router = express.Router();

// Get employees eligible for wage creation in a given month
router.post('/employees', getEmployeesForWages);

// Create wages in bulk
router.post('/create', createWagesBulk);

// Get wages for a specific month
router.get('/list', getWagesForMonth);

// Get single wage by ID
router.get('/:id', getWageById);

// Update a wage
router.put('/:id', updateWage);

// Delete a wage
router.delete('/:id', deleteWage);

export default router;
