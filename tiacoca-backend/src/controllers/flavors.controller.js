import supabase from '../utils/supabase.js';

// Obtener todos los sabores
export const getAllFlavors = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('flavors')
      .select(`
        *,
        categories(name)
      `)
      .order('name', { ascending: true });

    if (error) {
      return res.status(400).json({ message: 'Error al obtener sabores', error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error en getAllFlavors:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener sabores por categoría
export const getFlavorsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const { data, error } = await supabase
      .from('flavors')
      .select(`
        *,
        categories(name)
      `)
      .eq('category_id', categoryId)
      .order('name', { ascending: true });

    if (error) {
      return res.status(400).json({ message: 'Error al obtener sabores', error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error en getFlavorsByCategory:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener un sabor por ID
export const getFlavorById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('flavors')
      .select(`
        *,
        categories(name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ message: 'Sabor no encontrado', error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error en getFlavorById:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Crear un nuevo sabor
export const createFlavor = async (req, res) => {
  try {
    const { name, category_id } = req.body;

    const { data, error } = await supabase
      .from('flavors')
      .insert([{ 
        name, 
        category_id
      }])
      .select();

    if (error) {
      return res.status(400).json({ message: 'Error al crear sabor', error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error en createFlavor:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Actualizar un sabor
export const updateFlavor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id } = req.body;

    const { data, error } = await supabase
      .from('flavors')
      .update({ 
        name, 
        category_id
      })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ message: 'Error al actualizar sabor', error: error.message });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error en updateFlavor:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Eliminar un sabor
export const deleteFlavor = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('flavors')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ message: 'Error al eliminar sabor', error: error.message });
    }

    res.json({ message: 'Sabor eliminado exitosamente' });
  } catch (error) {
    console.error('Error en deleteFlavor:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};