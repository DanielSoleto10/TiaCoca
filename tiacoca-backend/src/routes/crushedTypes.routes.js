import express from 'express';
import { getAllCrushedTypes, getCrushedTypeById, createCrushedType, updateCrushedType, deleteCrushedType } from '../controllers/crushedTypes.controller.js';

const router = express.Router();

// Rutas de tipos de machucado
router.get('/', getAllCrushedTypes);
router.get('/:id', getCrushedTypeById);
router.post('/', createCrushedType);
router.put('/:id', updateCrushedType);
router.delete('/:id', deleteCrushedType);

export default router;