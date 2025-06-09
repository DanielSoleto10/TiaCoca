import express from 'express';
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  resetUserPassword,
  setUserPassword,
  clearTempPassword
} from '../controller/users.controller.js';
import { verifyToken, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// Rutas básicas de usuarios
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

// Rutas de gestión de contraseñas (solo admins)
router.post('/:id/reset-password', isAdmin, resetUserPassword);
router.post('/:id/set-password', isAdmin, setUserPassword);
router.delete('/:id/temp-password', isAdmin, clearTempPassword);

export default router;