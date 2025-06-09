import express from 'express';
import { 
  getSalesByDay, 
  getSalesSummary, 
  getSalesByFlavor, 
  getCashierClosings, 
  createCashierClosing,
  getSalesByMonth,
  getDetailedSales,
  getFlavorsByMonth
} from '../controller/reports.controller.js';

const router = express.Router();

// Rutas de reportes existentes
router.get('/sales/day', getSalesByDay);
router.get('/sales/summary', getSalesSummary);
router.get('/sales/flavor', getSalesByFlavor);
router.get('/cashier/closings', getCashierClosings);
router.post('/cashier/closings', createCashierClosing);

// Nuevas rutas para Excel
router.get('/sales/monthly', getSalesByMonth);
router.get('/sales/detailed', getDetailedSales);
router.get('/sales/flavors-monthly', getFlavorsByMonth);

export default router;