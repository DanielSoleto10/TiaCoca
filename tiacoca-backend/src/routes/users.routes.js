import express from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/users.controller.js';

const router = express.Router();

// Rutas de usuarios
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;