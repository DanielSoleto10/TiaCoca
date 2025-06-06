import express from 'express';
import { getAllFlavors, getFlavorsByCategory, getFlavorById, createFlavor, updateFlavor, deleteFlavor } from '../controller/flavors.controller.js';

// Importar middleware de autenticación
import { verifyToken, isAdmin, isEmployee } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas protegidas con autenticación
router.get('/', verifyToken, isEmployee, getAllFlavors);              // Empleados y admin pueden ver
router.get('/category/:categoryId', verifyToken, isEmployee, getFlavorsByCategory);
router.get('/:id', verifyToken, isEmployee, getFlavorById);
router.post('/', verifyToken, isAdmin, createFlavor);                 // Solo admin puede crear
router.put('/:id', verifyToken, isAdmin, updateFlavor);               // Solo admin puede actualizar
router.delete('/:id', verifyToken, isAdmin, deleteFlavor);            // Solo admin puede eliminar

export default router;