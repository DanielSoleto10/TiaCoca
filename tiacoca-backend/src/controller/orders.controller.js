import { supabase } from '../app.js';

// Obtener todos los pedidos (para admins)
export const getAllOrders = async (req, res) => {
  try {
    console.log('📋 ================================');
    console.log('📋 ADMIN: OBTENIENDO TODOS LOS PEDIDOS');
    console.log('📋 ================================');
    
    const { status } = req.query;
    console.log('🔍 Query params:', req.query);
    console.log('🔍 Status filter:', status);
    
    console.log('🔗 Probando conexión a Supabase...');
    
    let query = supabase
      .from('orders')
      .select('*')
      .lte('created_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    
    if (status && status !== 'all') {
      console.log('🎯 Aplicando filtro de status:', status);
      query = query.eq('status', status);
    }
    
    console.log('📤 Ejecutando query...');
    const { data, error } = await query;

    if (error) {
      console.error('❌ Error de Supabase:', error);
      return res.status(400).json({ 
        message: 'Error al obtener pedidos', 
        error: error.message,
        supabaseError: error
      });
    }

    console.log(`✅ Pedidos obtenidos exitosamente: ${data?.length || 0} pedidos`);
    
    if (data && data.length > 0) {
      console.log('📄 Primer pedido como muestra:');
      console.log(JSON.stringify(data[0], null, 2));
    }

    console.log('✅ ================================');
    console.log('✅ ENVIANDO RESPUESTA AL FRONTEND');
    console.log('✅ ================================');

    res.json(data);
  } catch (error) {
    console.error('❌ ERROR GENERAL EN getAllOrders:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Error en el servidor', 
      error: error.message 
    });
  }
};

// Obtener pedidos por empleado
export const getOrdersByEmployee = async (req, res) => {
  try {
    console.log('👤 ================================');
    console.log('👤 EMPLEADO: OBTENIENDO SUS PEDIDOS');
    console.log('👤 ================================');
    
    const { employeeId } = req.params;
    const { status } = req.query;
    console.log('👤 Employee ID:', employeeId, 'Status:', status);
    
    // 🆕 CAMBIO: Ahora obtiene TODOS los pedidos, no solo los asignados
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo pedidos:', error);
      return res.status(400).json({ message: 'Error al obtener pedidos', error: error.message });
    }

    console.log(`✅ Pedidos obtenidos: ${data?.length || 0}`);
    console.log('👤 ================================');
    
    res.json(data);
  } catch (error) {
    console.error('Error en getOrdersByEmployee:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener un pedido por ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Buscando pedido por ID:', id);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error obteniendo pedido por ID:', error);
      return res.status(404).json({ message: 'Pedido no encontrado', error: error.message });
    }

    console.log('✅ Pedido encontrado:', data?.id);
    res.json(data);
  } catch (error) {
    console.error('Error en getOrderById:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// 🆕 Crear un nuevo pedido - ARREGLADO para enviar a TODOS
export const createOrder = async (req, res) => {
  try {
    console.log('📝 ================================');
    console.log('📝 CREANDO NUEVO PEDIDO');
    console.log('📝 ================================');
    console.log('📝 Datos recibidos:', req.body);
    
    // 🆕 Obtener instancia de Socket.IO
    const io = req.app.get('io');
    
    const { 
      full_name, 
      flavors, 
      sweetness, 
      crushed_type, 
      package_type,
      amount, 
      notes, 
      payment_proof_url
      // 🆕 REMOVED: assigned_to - ya no es necesario
    } = req.body;

    const { data, error } = await supabase
      .from('orders')
      .insert([{ 
        full_name, 
        flavors, 
        sweetness, 
        crushed_type, 
        package_type,
        amount: parseFloat(amount), 
        notes, 
        // 🆕 REMOVED: assigned_to - todos los pedidos van sin asignar
        payment_proof_url,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('❌ Error creando pedido:', error);
      return res.status(400).json({ message: 'Error al crear pedido', error: error.message });
    }

    const newOrder = data[0];
    console.log('✅ Pedido creado exitosamente:', newOrder?.id);

    // 🆕 NUEVA LÓGICA: Emitir a TODOS (admin y empleados)
    if (io) {
      console.log('📡 ================================');
      console.log('📡 EMITIENDO A TODOS LOS USUARIOS');
      console.log('📡 ================================');
      
      // Notificar a todos los admins
      io.to('admins').emit('order:created', newOrder);
      console.log('📨 ✅ Evento "order:created" enviado a ADMINS');
      
      // 🆕 NUEVO: Notificar a TODOS los empleados
      io.to('employees').emit('order:created', newOrder);
      console.log('📨 ✅ Evento "order:created" enviado a TODOS LOS EMPLEADOS');
      
      // También emitir evento general para cualquier cliente conectado
      io.emit('order:created', newOrder);
      console.log('📨 ✅ Evento "order:created" enviado GLOBALMENTE');
      
      // Emitir evento general para estadísticas
      io.emit('order:stats', { 
        action: 'created', 
        orderId: newOrder.id,
        customerName: newOrder.full_name,
        timestamp: new Date().toISOString()
      });
      
      console.log('📡 ================================');
      console.log('✅ TODOS LOS EVENTOS EMITIDOS');
      console.log('📡 ================================');
    } else {
      console.log('⚠️ Socket.IO no disponible, saltando eventos en tiempo real');
    }

    console.log('📝 ================================');
    console.log('✅ PEDIDO CREADO Y ENVIADO A TODOS');
    console.log('📝 ================================');

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error en createOrder:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// 🆕 Actualizar estado de un pedido - ARREGLADO para notificar a todos
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('🔄 ================================');
    console.log('🔄 ACTUALIZANDO STATUS DE PEDIDO');
    console.log('🔄 ================================');
    console.log('🔄 Pedido ID:', id);
    console.log('🔄 Nuevo status:', status);

    // 🆕 Obtener instancia de Socket.IO
    const io = req.app.get('io');

    // 🆕 Primero obtener el pedido actual
    const { data: currentOrder } = await supabase
      .from('orders')
      .select('full_name, status')
      .eq('id', id)
      .single();

    if (!currentOrder) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    console.log('📋 Pedido actual:', currentOrder.full_name, '- Status anterior:', currentOrder.status);

    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Error actualizando status:', error);
      return res.status(400).json({ message: 'Error al actualizar estado del pedido', error: error.message });
    }

    const updatedOrder = data[0];
    console.log('✅ Status actualizado exitosamente');

    // 🆕 NUEVA LÓGICA: Notificar a TODOS cuando se actualiza
    if (io) {
      console.log('📡 ================================');
      console.log('📡 NOTIFICANDO ACTUALIZACIÓN A TODOS');
      console.log('📡 ================================');
      console.log(`📡 Pedido: ${id} (${currentOrder.full_name}) -> ${status}`);
      
      // Notificar a todos los admins
      io.to('admins').emit('order:updated', updatedOrder);
      console.log('📨 ✅ Evento "order:updated" enviado a ADMINS');
      
      // 🆕 NUEVO: Notificar a TODOS los empleados
      io.to('employees').emit('order:updated', updatedOrder);
      console.log('📨 ✅ Evento "order:updated" enviado a TODOS LOS EMPLEADOS');
      
      // También emitir globalmente
      io.emit('order:updated', updatedOrder);
      console.log('📨 ✅ Evento "order:updated" enviado GLOBALMENTE');
      
      // Emitir evento general de cambio de estado
      io.emit('order:status_changed', {
        orderId: updatedOrder.id,
        newStatus: status,
        oldStatus: currentOrder.status,
        customerName: updatedOrder.full_name,
        timestamp: new Date().toISOString()
      });
      
      console.log('📡 ================================');
      console.log('✅ EVENTOS DE ACTUALIZACIÓN EMITIDOS');
      console.log('📡 ================================');
    } else {
      console.log('⚠️ Socket.IO no disponible, saltando eventos en tiempo real');
    }

    console.log('🔄 ================================');
    console.log('✅ PEDIDO ACTUALIZADO Y SINCRONIZADO');
    console.log('🔄 ================================');

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error en updateOrderStatus:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// 🆕 Asignar pedido a un empleado (OPCIONAL - por si lo necesitas después)
export const assignOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;
    
    console.log('👤 ================================');
    console.log('👤 ASIGNANDO PEDIDO A EMPLEADO');
    console.log('👤 ================================');
    console.log('👤 Pedido ID:', id);
    console.log('👤 Empleado ID:', employeeId);

    const io = req.app.get('io');

    const { data: currentOrder } = await supabase
      .from('orders')
      .select('assigned_to, full_name, status')
      .eq('id', id)
      .single();

    if (!currentOrder) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ 
        assigned_to: employeeId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Error asignando pedido:', error);
      return res.status(400).json({ message: 'Error al asignar pedido', error: error.message });
    }

    const updatedOrder = data[0];
    console.log('✅ Pedido asignado exitosamente');

    if (io) {
      // Notificar a todos
      io.emit('order:updated', updatedOrder);
      console.log('📨 ✅ Evento "order:updated" enviado a TODOS');
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error en assignOrder:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// 🆕 Eliminar un pedido - ARREGLADO para notificar a todos
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ ================================');
    console.log('🗑️ ELIMINANDO PEDIDO');
    console.log('🗑️ ================================');
    console.log('🗑️ Pedido ID:', id);

    const io = req.app.get('io');

    // Obtener el pedido antes de eliminarlo
    const { data: orderToDelete } = await supabase
      .from('orders')
      .select('full_name')
      .eq('id', id)
      .single();

    if (!orderToDelete) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    console.log('📋 Pedido a eliminar:', orderToDelete.full_name);

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error eliminando pedido:', error);
      return res.status(400).json({ message: 'Error al eliminar pedido', error: error.message });
    }

    console.log('✅ Pedido eliminado exitosamente');

    // 🆕 NUEVA LÓGICA: Notificar eliminación a TODOS
    if (io) {
      console.log('📡 ================================');
      console.log('📡 NOTIFICANDO ELIMINACIÓN A TODOS');
      console.log('📡 ================================');
      
      // Notificar a todos los admins
      io.to('admins').emit('order:deleted', id);
      console.log('📨 ✅ Evento "order:deleted" enviado a ADMINS');
      
      // 🆕 NUEVO: Notificar a TODOS los empleados
      io.to('employees').emit('order:deleted', id);
      console.log('📨 ✅ Evento "order:deleted" enviado a TODOS LOS EMPLEADOS');
      
      // También emitir globalmente
      io.emit('order:deleted', id);
      console.log('📨 ✅ Evento "order:deleted" enviado GLOBALMENTE');
      
      console.log('📡 ================================');
      console.log('✅ EVENTOS DE ELIMINACIÓN EMITIDOS');
      console.log('📡 ================================');
    }

    res.json({ message: 'Pedido eliminado exitosamente' });
  } catch (error) {
    console.error('Error en deleteOrder:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// 🧪 FUNCIÓN DE PRUEBA SOCKET.IO
export const testSocket = async (req, res) => {
  try {
    const io = req.app.get('io');
    const { message, room } = req.body;
    
    console.log('🧪 ================================');
    console.log('🧪 PROBANDO SOCKET.IO');
    console.log('🧪 ================================');
    console.log('🧪 Mensaje:', message);
    console.log('🧪 Sala:', room || 'todas');
    
    if (!io) {
      return res.status(500).json({ error: 'Socket.IO no está configurado' });
    }
    
    if (room) {
      io.to(room).emit('test:message', { message, timestamp: new Date() });
      console.log(`📡 ✅ Mensaje enviado a sala '${room}': ${message}`);
    } else {
      io.emit('test:message', { message, timestamp: new Date() });
      console.log(`📡 ✅ Mensaje enviado a TODOS: ${message}`);
    }
    
    console.log('🧪 ================================');
    console.log('✅ PRUEBA SOCKET.IO COMPLETADA');
    console.log('🧪 ================================');
    
    res.json({ 
      success: true, 
      message: 'Evento Socket.IO enviado exitosamente',
      sentTo: room || 'all clients',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing socket:', error);
    res.status(500).json({ error: error.message });
  }
};