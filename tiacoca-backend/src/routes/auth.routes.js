const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Rutas de autenticación
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/verify', authController.verifyToken);
router.post('/logout', authController.logout);

module.exports = router;