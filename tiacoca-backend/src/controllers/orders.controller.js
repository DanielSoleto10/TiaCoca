import { supabase } from '../app.js';

// Obtener todos los pedidos
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
      .lte('created_at', new Date().toISOString()) // Solo pedidos hasta ahora
      .order('created_at', { ascending: false });
    
    if (status && status !== 'all') {
      console.log('🎯 Aplicando filtro de status:', status);
      query = query.eq('status', status);
    }
    
    console.log('📤 Ejecutando query...');
    const { data, error } = await query;

    if (error) {
      console.error('❌ Error de Supabase:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', error.details);
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
    console.log('👤 Admin: Obteniendo pedidos por empleado...');
    const { employeeId } = req.params;
    const { status } = req.query;
    console.log('👤 Employee ID:', employeeId, 'Status:', status);
    
    let query = supabase
      .from('orders')
      .select('*')  // ← REMOVIDO: profiles(full_name)
      .eq('assigned_to', employeeId)
      .order('created_at', { ascending: false });
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo pedidos por empleado:', error);
      return res.status(400).json({ message: 'Error al obtener pedidos', error: error.message });
    }

    console.log(`✅ Pedidos por empleado obtenidos: ${data?.length || 0}`);
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
    console.log('🔍 Admin: Buscando pedido por ID:', id);

    const { data, error } = await supabase
      .from('orders')
      .select('*')  // ← REMOVIDO: profiles(full_name)
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

// Crear un nuevo pedido
export const createOrder = async (req, res) => {
  try {
    console.log('📝 Admin: Creando nuevo pedido...');
    console.log('📝 Datos recibidos:', req.body);
    
    const { 
      full_name, 
      flavors, 
      sweetness, 
      crushed_type, 
      package_type, // Cambiado de 'package' a 'package_type'
      amount, 
      notes, 
      assigned_to 
    } = req.body;

    const { data, error } = await supabase
      .from('orders')
      .insert([{ 
        full_name, 
        flavors, 
        sweetness, 
        crushed_type, 
        package_type, // Cambiado de 'package' a 'package_type'
        amount: parseFloat(amount), 
        notes, 
        assigned_to,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('❌ Error creando pedido:', error);
      return res.status(400).json({ message: 'Error al crear pedido', error: error.message });
    }

    console.log('✅ Pedido creado exitosamente:', data[0]?.id);
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error en createOrder:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Actualizar estado de un pedido
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.log('🔄 Admin: Actualizando status del pedido', id, 'a:', status);

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

    console.log('✅ Status actualizado exitosamente');
    res.json(data[0]);
  } catch (error) {
    console.error('Error en updateOrderStatus:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Asignar pedido a un empleado
export const assignOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;
    console.log('👤 Admin: Asignando pedido', id, 'a empleado:', employeeId);

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

    console.log('✅ Pedido asignado exitosamente');
    res.json(data[0]);
  } catch (error) {
    console.error('Error en assignOrder:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};