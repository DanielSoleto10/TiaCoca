const { supabase } = require('../app');

// Obtener todos los usuarios (empleados y administradores)
exports.getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or('role.eq.employee,role.eq.admin')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ message: 'Error al obtener usuarios', error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error en getAllUsers:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener un usuario por ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ message: 'Usuario no encontrado', error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error en getUserById:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Actualizar un usuario
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, birth_date, identity_card, role } = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name, birth_date, identity_card, role })
      .eq('id', id);

    if (error) {
      return res.status(400).json({ message: 'Error al actualizar usuario', error: error.message });
    }

    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error en updateUser:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Eliminar un usuario
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Eliminar perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileError) {
      return res.status(400).json({ message: 'Error al eliminar perfil', error: profileError.message });
    }

    // Eliminar usuario de autenticación
    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) {
      return res.status(400).json({ message: 'Error al eliminar usuario', error: authError.message });
    }

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error en deleteUser:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};