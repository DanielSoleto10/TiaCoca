import express from 'express';
import { getAllFlavors, getFlavorsByCategory, getFlavorById, createFlavor, updateFlavor, deleteFlavor } from '../controllers/flavors.controller.js';

const router = express.Router();

// Rutas de sabores
router.get('/', getAllFlavors);
router.get('/category/:categoryId', getFlavorsByCategory);
router.get('/:id', getFlavorById);
router.post('/', createFlavor);
router.put('/:id', updateFlavor);
router.delete('/:id', deleteFlavor);

export default router;