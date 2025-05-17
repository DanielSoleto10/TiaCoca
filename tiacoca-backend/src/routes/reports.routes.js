import express from 'express';
import { getSalesByDay, getSalesSummary, getSalesByFlavor, getCashierClosings, createCashierClosing } from '../controllers/reports.controller.js';

const router = express.Router();

// Rutas de reportes
router.get('/sales/day', getSalesByDay);
router.get('/sales/summary', getSalesSummary);
router.get('/sales/flavor', getSalesByFlavor);
router.get('/cashier/closings', getCashierClosings);
router.post('/cashier/closings', createCashierClosing);

export default router;