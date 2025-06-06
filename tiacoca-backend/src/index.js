import { server } from './app.js';

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log('🎯 ================================');
  console.log('🚀 SERVIDOR INICIADO EXITOSAMENTE');
  console.log('🎯 ================================');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
  console.log(`📡 Socket.IO URL: http://localhost:${PORT}`);
  console.log(`🎨 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('🎯 ================================');
  console.log('✅ Socket.IO habilitado para tiempo real');
  console.log('✅ Supabase conectado');
  console.log('✅ Listo para recibir pedidos');
  console.log('🎯 ================================');
});