const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');

// Rutas de reportes
router.get('/sales/day', reportsController.getSalesByDay);
router.get('/sales/summary', reportsController.getSalesSummary);
router.get('/sales/flavor', reportsController.getSalesByFlavor);
router.get('/cashier/closings', reportsController.getCashierClosings);
router.post('/cashier/closings', reportsController.createCashierClosing);

module.exports = router;