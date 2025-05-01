const supabase = require('../utils/supabase');
const jwt = require('jsonwebtoken');

// Iniciar sesión
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Autenticar con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ message: 'Credenciales inválidas', error: error.message });
    }

    // Obtener información del perfil
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ message: 'Error al obtener perfil', error: profileError.message });
    }

    // Crear token JWT personalizado
    const token = jwt.sign(
      { 
        id: data.user.id, 
        email: data.user.email,
        role: profileData.role,
        name: profileData.full_name
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        role: profileData.role,
        name: profileData.full_name
      },
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Registrar usuario (solo para administradores)
exports.register = async (req, res) => {
  try {
    const { email, password, fullName, birthDate, identityCard, role } = req.body;

    // Verificar si el usuario que hace la petición es administrador
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    // Crear usuario en Supabase Auth
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (userError) {
      return res.status(400).json({ message: 'Error al crear usuario', error: userError.message });
    }

    // Crear perfil en la tabla profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: userData.user.id,
          full_name: fullName,
          birth_date: birthDate,
          identity_card: identityCard,
          role: role || 'employee',
          email
        }
      ]);

    if (profileError) {
      // Si hay error, eliminar el usuario creado
      await supabase.auth.admin.deleteUser(userData.user.id);
      return res.status(400).json({ message: 'Error al crear perfil', error: profileError.message });
    }

    res.status(201).json({ message: 'Usuario creado exitosamente', userId: userData.user.id });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Verificar token
exports.verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Token inválido' });
  }
};

// Cerrar sesión
exports.logout = async (req, res) => {
  res.json({ message: 'Sesión cerrada exitosamente' });
};