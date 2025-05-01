const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders.controller');

// Rutas de pedidos
router.get('/', ordersController.getAllOrders);
router.get('/employee/:employeeId', ordersController.getOrdersByEmployee);
router.get('/:id', ordersController.getOrderById);
router.post('/', ordersController.createOrder);
router.patch('/:id/status', ordersController.updateOrderStatus);
router.patch('/:id/assign', ordersController.assignOrder);

module.exports = router;