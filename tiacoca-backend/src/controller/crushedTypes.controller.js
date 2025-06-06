import supabase from '../utils/supabase.js';

// Obtener todos los tipos de machucado
export const getAllCrushedTypes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('crushed_types')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return res.status(400).json({ message: 'Error al obtener tipos de machucado', error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error en getAllCrushedTypes:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener un tipo de machucado por ID
export const getCrushedTypeById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('crushed_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ message: 'Tipo de machucado no encontrado', error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error en getCrushedTypeById:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Crear un nuevo tipo de machucado
export const createCrushedType = async (req, res) => {
  try {
    const { name, description } = req.body;

    const { data, error } = await supabase
      .from('crushed_types')
      .insert([{ name, description }])
      .select();

    if (error) {
      return res.status(400).json({ message: 'Error al crear tipo de machucado', error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error en createCrushedType:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Actualizar un tipo de machucado
export const updateCrushedType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const { data, error } = await supabase
      .from('crushed_types')
      .update({ name, description })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ message: 'Error al actualizar tipo de machucado', error: error.message });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error en updateCrushedType:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Eliminar un tipo de machucado
export const deleteCrushedType = async (req, res) => {
  try {
    const { id } = req.params;

    // Comprobar si hay órdenes usando este tipo de machucado
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('crushed_type', id);

    if (ordersError) {
      return res.status(400).json({ message: 'Error al verificar órdenes', error: ordersError.message });
    }

    // Si hay órdenes, informar que no se puede eliminar
    if (orders && orders.length > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar este tipo de machucado porque está siendo utilizado en órdenes existentes' 
      });
    }

    // Eliminar el tipo de machucado
    const { error } = await supabase
      .from('crushed_types')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ message: 'Error al eliminar tipo de machucado', error: error.message });
    }

    res.json({ message: 'Tipo de machucado eliminado exitosamente' });
  } catch (error) {
    console.error('Error en deleteCrushedType:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};