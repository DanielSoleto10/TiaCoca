import express from 'express';
import { 
  getAllOrders, 
  getOrdersByEmployee, 
  getOrderById, 
  createOrder, 
  updateOrderStatus, 
  assignOrder,
  deleteOrder,     // 🆕 Para eliminar pedidos
  testSocket       // 🆕 Para testing Socket.IO
} from '../controller/orders.controller.js';

const router = express.Router();

// 🧪 Ruta de prueba Socket.IO (coloca al inicio para evitar conflictos)
router.post('/test-socket', testSocket);

// Rutas principales de pedidos
router.get('/', getAllOrders);                           // GET /api/orders
router.get('/employee/:employeeId', getOrdersByEmployee); // GET /api/orders/employee/:employeeId
router.get('/:id', getOrderById);                        // GET /api/orders/:id
router.post('/', createOrder);                           // POST /api/orders
router.patch('/:id/status', updateOrderStatus);          // PATCH /api/orders/:id/status
router.patch('/:id/assign', assignOrder);                // PATCH /api/orders/:id/assign
router.delete('/:id', deleteOrder);                      // DELETE /api/orders/:id

export default router;