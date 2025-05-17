import express from 'express';
import { getAllOrders, getOrdersByEmployee, getOrderById, createOrder, updateOrderStatus, assignOrder } from '../controllers/orders.controller.js';

const router = express.Router();

// Rutas de pedidos
router.get('/', getAllOrders);
router.get('/employee/:employeeId', getOrdersByEmployee);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/assign', assignOrder);

export default router;