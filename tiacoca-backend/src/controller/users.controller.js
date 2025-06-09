import supabase from '../utils/supabase.js';

// Función para generar contraseña temporal
const generateTempPassword = () => {
  const adjectives = ['Rapido', 'Fuerte', 'Nuevo', 'Activo', 'Fresco', 'Listo', 'Smart', 'Agil'];
  const nouns = ['Coca', 'Sabor', 'Usuario', 'Admin', 'Empleado', 'Team', 'Work', 'Staff'];
  const numbers = Math.floor(Math.random() * 9999) + 1000;
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adj}${noun}${numbers}`;
};

// Función para limpiar contraseñas temporales vencidas (automatizada)
const cleanExpiredPasswords = async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        temp_password: null,
        password_created_at: null 
      })
      .lt('password_created_at', twentyFourHoursAgo)
      .not('temp_password', 'is', null);
    
    if (error) {
      console.error('Error limpiando contraseñas vencidas:', error);
    } else {
      console.log('Contraseñas vencidas limpiadas exitosamente');
    }
  } catch (error) {
    console.error('Error en cleanExpiredPasswords:', error);
  }
};

// Ejecutar limpieza automática cada 6 horas
setInterval(cleanExpiredPasswords, 6 * 60 * 60 * 1000);

// Obtener todos los usuarios (empleados y administradores)
export const getAllUsers = async (req, res) => {
  try {
    console.log('Ejecutando getAllUsers, supabase disponible:', !!supabase);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or('role.eq.employee,role.eq.admin')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error de Supabase en getAllUsers:', error);
      return res.status(400).json({ message: 'Error al obtener usuarios', error: error.message });
    }

    // Log para verificar los datos recibidos
    console.log('Datos obtenidos en getAllUsers:', data?.length || 0, 'registros');
    
    res.json(data || []);
  } catch (error) {
    console.error('Error en getAllUsers:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener un usuario por ID
export const getUserById = async (req, res) => {
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
export const updateUser = async (req, res) => {
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
export const deleteUser = async (req, res) => {
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

// Resetear contraseña (generar automática)
export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar que es un empleado (los admins no se pueden resetear así)
    if (userData.role !== 'employee') {
      return res.status(403).json({ message: 'Solo se puede resetear la contraseña de empleados' });
    }

    // Generar contraseña temporal
    const tempPassword = generateTempPassword();

    // 1. Actualizar contraseña en Supabase Auth (encriptada)
    const { error: updateError } = await supabase.auth.admin.updateUserById(id, {
      password: tempPassword
    });

    if (updateError) {
      console.error('Error al actualizar contraseña:', updateError);
      return res.status(400).json({ 
        message: 'Error al resetear contraseña', 
        error: updateError.message 
      });
    }

    // 2. Guardar temporalmente en profiles (para que admin la vea)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        temp_password: tempPassword,
        password_created_at: new Date().toISOString()
      })
      .eq('id', id);

    if (profileError) {
      console.error('Error al guardar contraseña temporal:', profileError);
      // No es crítico, la contraseña ya se cambió en auth
    }

    console.log(`Contraseña reseteada para usuario ${userData.full_name} (${userData.email})`);

    res.json({ 
      message: 'Contraseña reseteada exitosamente',
      tempPassword: tempPassword
    });

  } catch (error) {
    console.error('Error en resetUserPassword:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Establecer contraseña personalizada
export const setUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Validar contraseña
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar que el usuario existe y es empleado
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (userData.role !== 'employee') {
      return res.status(403).json({ message: 'Solo se puede establecer contraseña de empleados' });
    }

    // 1. Actualizar contraseña en Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(id, {
      password: password
    });

    if (updateError) {
      console.error('Error al actualizar contraseña:', updateError);
      return res.status(400).json({ 
        message: 'Error al establecer contraseña', 
        error: updateError.message 
      });
    }

    // 2. Guardar temporalmente en profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        temp_password: password,
        password_created_at: new Date().toISOString()
      })
      .eq('id', id);

    if (profileError) {
      console.error('Error al guardar contraseña temporal:', profileError);
    }

    console.log(`Contraseña personalizada establecida para ${userData.full_name} (${userData.email})`);

    res.json({ message: 'Contraseña establecida exitosamente' });

  } catch (error) {
    console.error('Error en setUserPassword:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Limpiar contraseña temporal (ocultar manualmente)
export const clearTempPassword = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Limpiar contraseña temporal
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        temp_password: null,
        password_created_at: null 
      })
      .eq('id', id);

    if (updateError) {
      return res.status(400).json({ 
        message: 'Error al ocultar contraseña', 
        error: updateError.message 
      });
    }

    console.log(`Contraseña temporal ocultada para ${userData.full_name}`);

    res.json({ message: 'Contraseña ocultada exitosamente' });

  } catch (error) {
    console.error('Error en clearTempPassword:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};