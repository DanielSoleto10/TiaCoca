const supabase = require('../utils/supabase');

// Obtener todas las categorías
exports.getAllCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return res.status(400).json({ message: 'Error al obtener categorías', error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error en getAllCategories:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener una categoría por ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ message: 'Categoría no encontrada', error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error en getCategoryById:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Crear una nueva categoría
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name }])
      .select();

    if (error) {
      return res.status(400).json({ message: 'Error al crear categoría', error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error en createCategory:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Actualizar una categoría
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const { data, error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ message: 'Error al actualizar categoría', error: error.message });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error en updateCategory:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Eliminar una categoría
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si hay sabores asociados
    const { data: flavors, error: flavorsError } = await supabase
      .from('flavors')
      .select('id')
      .eq('category_id', id);

    if (flavorsError) {
      return res.status(400).json({ message: 'Error al verificar sabores', error: flavorsError.message });
    }

    // Eliminar sabores asociados primero
    if (flavors && flavors.length > 0) {
      const { error: deleteFlavorError } = await supabase
        .from('flavors')
        .delete()
        .eq('category_id', id);

      if (deleteFlavorError) {
        return res.status(400).json({ message: 'Error al eliminar sabores asociados', error: deleteFlavorError.message });
      }
    }

    // Eliminar categoría
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ message: 'Error al eliminar categoría', error: error.message });
    }

    res.json({ message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    console.error('Error en deleteCategory:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};