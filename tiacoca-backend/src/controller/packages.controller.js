import { supabase } from '../app.js';

// Obtener todos los paquetes
export const getAllPackages = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      res.status(400).json({ message: 'Error al obtener paquetes', error: error.message });
      return;
    }

    res.json(data);
  } catch (error) {
    console.error('Error en getAllPackages:', error);
    res.status(500).json({ 
      message: 'Error en el servidor', 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
};

// Obtener un paquete por ID
export const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      res.status(404).json({ message: 'Paquete no encontrado', error: error.message });
      return;
    }

    res.json(data);
  } catch (error) {
    console.error('Error en getPackageById:', error);
    res.status(500).json({ 
      message: 'Error en el servidor', 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
};

// Crear un nuevo paquete
export const createPackage = async (req, res) => {
  try {
    const { name, price, weight, weight_unit } = req.body;

    if (price === undefined || weight === undefined || weight_unit === undefined) {
      res.status(400).json({ message: 'Precio, peso y unidad de peso son obligatorios' });
      return;
    }

    const packageData = {
      name: name,
      price: typeof price === 'string' ? parseFloat(price) : price,
      weight: typeof weight === 'string' ? parseFloat(weight) : weight,
      weight_unit: weight_unit
    };

    const { data, error } = await supabase
      .from('packages')
      .insert([packageData])
      .select();

    if (error) {
      res.status(400).json({ message: 'Error al crear paquete', error: error.message });
      return;
    }

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error en createPackage:', error);
    res.status(500).json({ 
      message: 'Error en el servidor', 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
};

// Actualizar un paquete
export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, weight, weight_unit } = req.body;

    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = typeof price === 'string' ? parseFloat(price) : price;
    if (weight !== undefined) updateData.weight = typeof weight === 'string' ? parseFloat(weight) : weight;
    if (weight_unit !== undefined) updateData.weight_unit = weight_unit;

    const { data, error } = await supabase
      .from('packages')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      res.status(400).json({ message: 'Error al actualizar paquete', error: error.message });
      return;
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error en updatePackage:', error);
    res.status(500).json({ 
      message: 'Error en el servidor', 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
};

// Eliminar un paquete
export const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(400).json({ message: 'Error al eliminar paquete', error: error.message });
      return;
    }

    res.json({ message: 'Paquete eliminado exitosamente' });
  } catch (error) {
    console.error('Error en deletePackage:', error);
    res.status(500).json({ 
      message: 'Error en el servidor', 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
};