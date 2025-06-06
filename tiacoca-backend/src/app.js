import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Cargar variables de entorno
dotenv.config();

// Inicializar cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Inicializar Express
const app = express();

// 🆕 Crear servidor HTTP y Socket.IO
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// 🆕 Hacer io y supabase accesibles en las rutas
app.set('io', io);
app.set('supabase', supabase);

// 🆕 CONFIGURACIÓN SOCKET.IO ARREGLADA
io.on('connection', (socket) => {
  console.log(`✅ Usuario conectado: ${socket.id}`);
  
  // 🆕 NUEVO: Cuando un empleado se conecta a la sala general
  socket.on('join:employees', () => {
    socket.join('employees');
    console.log(`👥 Usuario ${socket.id} unido a la sala GENERAL de empleados`);
  });

  // Cuando un empleado se conecta a su sala específica (mantenemos por compatibilidad)
  socket.on('join:employee', (employeeId) => {
    socket.join(`employee:${employeeId}`);
    // 🆕 TAMBIÉN unir a la sala general automáticamente
    socket.join('employees');
    console.log(`👤 Empleado ${employeeId} (${socket.id}) unido a su sala específica Y sala general`);
  });

  // Cuando un admin se conecta
  socket.on('join:admin', () => {
    socket.join('admins');
    console.log(`👑 Admin ${socket.id} unido a la sala de admins`);
  });

  // 🆕 NUEVO: Manejo de desconexión con más info
  socket.on('disconnect', () => {
    console.log(`❌ Usuario desconectado: ${socket.id}`);
  });

  // 🆕 NUEVO: Evento para debugging
  socket.on('debug:info', () => {
    const rooms = Array.from(socket.rooms);
    console.log(`🔍 Debug - Socket ${socket.id} está en salas:`, rooms);
    socket.emit('debug:response', { socketId: socket.id, rooms });
  });
});

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import flavorsRoutes from './routes/flavors.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import packagesRoutes from './routes/packages.routes.js';
import crushedTypesRoutes from './routes/crushedTypes.routes.js';
import qrRoutes from './routes/qr.routes.js'; // 🆕 NUEVA RUTA QR

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/flavors', flavorsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/crushed-types', crushedTypesRoutes);
app.use('/api/qr', qrRoutes); // 🆕 NUEVA RUTA QR

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Coca Order App funcionando correctamente',
    socketio: 'Socket.IO habilitado para tiempo real',
    salas: ['admins', 'employees', 'employee:id'],
    timestamp: new Date().toISOString()
  });
});

// 🆕 NUEVA RUTA: Para obtener estadísticas de Socket.IO
app.get('/api/socket/stats', (req, res) => {
  const sockets = io.sockets.sockets;
  const totalConnections = sockets.size;
  
  let adminsCount = 0;
  let employeesCount = 0;
  
  for (const [socketId, socket] of sockets) {
    if (socket.rooms.has('admins')) adminsCount++;
    if (socket.rooms.has('employees')) employeesCount++;
  }
  
  res.json({
    totalConnections,
    adminsConnected: adminsCount,
    employeesConnected: employeesCount,
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Error en el servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Exportar app, server, io y supabase
export { app, server, io, supabase };