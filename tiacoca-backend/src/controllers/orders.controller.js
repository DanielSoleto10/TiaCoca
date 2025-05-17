import { supabase } from '../app.js';

// Obtener todos los pedidos
export const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles(full_name)
      `)
      .order('created_at', { ascending: false });
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ message: 'Error al obtener pedidos', error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error en getAllOrders:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener pedidos por empleado
export const getOrdersByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status } = req.query;
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles(full_name)
      `)
      .eq('assigned_to', employeeId)
      .order('created_at', { ascending: false });
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ message: 'Error al obtener pedidos', error: error.message });
    }

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

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles(full_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ message: 'Pedido no encontrado', error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error en getOrderById:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Crear un nuevo pedido
export const createOrder = async (req, res) => {
  try {
    const { 
      client_name, 
      client_last_name, 
      client_phone, 
      delivery_address, 
      flavors, 
      sweetness, 
      crushed_type, 
      package_type, 
      amount, 
      notes, 
      assigned_to 
    } = req.body;

    const { data, error } = await supabase
      .from('orders')
      .insert([{ 
        client_name, 
        client_last_name, 
        client_phone, 
        delivery_address, 
        flavors, 
        sweetness, 
        crushed_type, 
        package_type, 
        amount: parseFloat(amount), 
        notes, 
        assigned_to,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      return res.status(400).json({ message: 'Error al crear pedido', error: error.message });
    }

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

    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ message: 'Error al actualizar estado del pedido', error: error.message });
    }

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

    const { data, error } = await supabase
      .from('orders')
      .update({ 
        assigned_to: employeeId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ message: 'Error al asignar pedido', error: error.message });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error en assignOrder:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};