import express from 'express';
import multer from 'multer';
import { 
  getAllQRCodes, 
  getQRCodeById, 
  createQRCode, 
  updateQRCode, 
  deleteQRCode,
  uploadQRImage,
  toggleQRStatus
} from '../controller/qr.controller.js';

// Importar middleware de autenticación
import { verifyToken, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Configurar multer para manejar uploads de imágenes
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Verificar que sea una imagen
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

// Rutas públicas (para que el cliente pueda ver QRs activos)
router.get('/active', (req, res) => {
  // Forzar el parámetro active_only=true para clientes
  req.query.active_only = 'true';
  getAllQRCodes(req, res);
});

// Rutas protegidas (solo admin puede gestionar)
router.get('/', verifyToken, isAdmin, getAllQRCodes);                    // GET /api/qr
router.get('/:id', verifyToken, isAdmin, getQRCodeById);                 // GET /api/qr/:id
router.post('/', verifyToken, isAdmin, createQRCode);                    // POST /api/qr
router.put('/:id', verifyToken, isAdmin, updateQRCode);                  // PUT /api/qr/:id
router.delete('/:id', verifyToken, isAdmin, deleteQRCode);               // DELETE /api/qr/:id
router.patch('/:id/toggle', verifyToken, isAdmin, toggleQRStatus);       // PATCH /api/qr/:id/toggle

// Ruta para subir imágenes (solo admin)
router.post('/upload', verifyToken, isAdmin, upload.single('image'), uploadQRImage); // POST /api/qr/upload

export default router;