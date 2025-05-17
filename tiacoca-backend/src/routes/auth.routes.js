import express from 'express';
import { login, register, verifyToken, logout } from '../controllers/auth.controller.js';

const router = express.Router();

// Rutas de autenticación
router.post('/login', login);
router.post('/register', register);
router.post('/verify', verifyToken);
router.post('/logout', logout);

export default router;