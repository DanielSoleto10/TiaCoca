import { supabase } from '../app.js';
import { v4 as uuidv4 } from 'uuid';

// Obtener todos los códigos QR
export const getAllQRCodes = async (req, res) => {
  try {
    console.log('📱 ================================');
    console.log('📱 OBTENIENDO TODOS LOS QR CODES');
    console.log('📱 ================================');
    
    const { active_only } = req.query;
    
    let query = supabase
      .from('qr_codes')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Filtrar solo activos si se especifica
    if (active_only === 'true') {
      console.log('🎯 Filtrando solo QR activos');
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo QR codes:', error);
      return res.status(400).json({ 
        message: 'Error al obtener códigos QR', 
        error: error.message 
      });
    }

    console.log(`✅ QR codes obtenidos: ${data?.length || 0}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error en getAllQRCodes:', error);
    res.status(500).json({ 
      message: 'Error en el servidor', 
      error: error.message 
    });
  }
};

// Obtener un QR por ID
export const getQRCodeById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Buscando QR por ID:', id);

    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error obteniendo QR por ID:', error);
      return res.status(404).json({ 
        message: 'Código QR no encontrado', 
        error: error.message 
      });
    }

    console.log('✅ QR encontrado:', data?.name);
    res.json(data);
  } catch (error) {
    console.error('❌ Error en getQRCodeById:', error);
    res.status(500).json({ 
      message: 'Error en el servidor', 
      error: error.message 
    });
  }
};

// Crear un nuevo QR
export const createQRCode = async (req, res) => {
  try {
    console.log('📱 ================================');
    console.log('📱 CREANDO NUEVO QR CODE');
    console.log('📱 ================================');
    
    const { name, image_url, is_active = true } = req.body;
    
    console.log('📱 Datos del QR:', { name, is_active });
    
    const { data, error } = await supabase
      .from('qr_codes')
      .insert([{ 
        name, 
        image_url,
        is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('❌ Error creando QR:', error);
      return res.status(400).json({ 
        message: 'Error al crear código QR', 
        error: error.message 
      });
    }

    const newQR = data[0];
    console.log('✅ QR creado exitosamente:', newQR?.id);

    // Emitir evento Socket.IO si está disponible
    const io = req.app.get('io');
    if (io) {
      io.emit('qr:created', newQR);
      console.log('📡 Evento "qr:created" emitido');
    }

    res.status(201).json(newQR);
  } catch (error) {
    console.error('❌ Error en createQRCode:', error);
    res.status(500).json({ 
      message: 'Error en el servidor', 
      error: error.message 
    });
  }
};

// Actualizar un QR
export const updateQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image_url, is_active } = req.body;
    
    console.log('🔄 ================================');
    console.log('🔄 ACTUALIZANDO QR CODE');
    console.log('🔄 ================================');
    console.log('🔄 QR ID:', id);
    console.log('🔄 Datos:', { name, is_active });

    const { data, error } = await supabase
      .from('qr_codes')
      .update({ 
        name, 
        image_url,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Error actualizando QR:', error);
      return res.status(400).json({ 
        message: 'Error al actualizar código QR', 
        error: error.message 
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ 
        message: 'Código QR no encontrado' 
      });
    }

    const updatedQR = data[0];
    console.log('✅ QR actualizado exitosamente');

    // Emitir evento Socket.IO si está disponible
    const io = req.app.get('io');
    if (io) {
      io.emit('qr:updated', updatedQR);
      console.log('📡 Evento "qr:updated" emitido');
    }

    res.json(updatedQR);
  } catch (error) {
    console.error('❌ Error en updateQRCode:', error);
    res.status(500).json({ 
      message: 'Error en el servidor', 
      error: error.message 
    });
  }
};

// Eliminar un QR
export const deleteQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ ================================');
    console.log('🗑️ ELIMINANDO QR CODE');
    console.log('🗑️ ================================');
    console.log('🗑️ QR ID:', id);

    // Primero obtener los datos del QR para la imagen
    const { data: qrToDelete } = await supabase
      .from('qr_codes')
      .select('name, image_url')
      .eq('id', id)
      .single();

    if (!qrToDelete) {
      return res.status(404).json({ 
        message: 'Código QR no encontrado' 
      });
    }

    console.log('📋 QR a eliminar:', qrToDelete.name);

    // Eliminar el QR de la base de datos
    const { error } = await supabase
      .from('qr_codes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error eliminando QR:', error);
      return res.status(400).json({ 
        message: 'Error al eliminar código QR', 
        error: error.message 
      });
    }

    console.log('✅ QR eliminado exitosamente');

    // Intentar eliminar la imagen del storage (opcional)
    try {
      if (qrToDelete.image_url) {
        // Extraer el path de la imagen desde la URL
        const urlParts = qrToDelete.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        const { error: storageError } = await supabase.storage
          .from('qr-images')
          .remove([fileName]);
        
        if (storageError) {
          console.log('⚠️ No se pudo eliminar la imagen del storage:', storageError.message);
        } else {
          console.log('🗑️ Imagen eliminada del storage');
        }
      }
    } catch (storageError) {
      console.log('⚠️ Error eliminando imagen del storage:', storageError);
    }

    // Emitir evento Socket.IO si está disponible
    const io = req.app.get('io');
    if (io) {
      io.emit('qr:deleted', id);
      console.log('📡 Evento "qr:deleted" emitido');
    }

    res.json({ message: 'Código QR eliminado exitosamente' });
  } catch (error) {
    console.error('❌ Error en deleteQRCode:', error);
    res.status(500).json({ 
      message: 'Error en el servidor', 
      error: error.message 
    });
  }
};

// Subir imagen QR al storage de Supabase
export const uploadQRImage = async (req, res) => {
  try {
    console.log('📤 ================================');
    console.log('📤 SUBIENDO IMAGEN QR');
    console.log('📤 ================================');

    if (!req.file) {
      return res.status(400).json({ 
        message: 'No se proporcionó ninguna imagen' 
      });
    }

    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `qr-${uuidv4()}.${fileExt}`;

    console.log('📁 Archivo:', file.originalname);
    console.log('📁 Nuevo nombre:', fileName);

    // Subir archivo a Supabase Storage
    const { data, error } = await supabase.storage
      .from('qr-images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('❌ Error subiendo imagen:', error);
      return res.status(400).json({ 
        message: 'Error al subir la imagen', 
        error: error.message 
      });
    }

    // Obtener URL pública de la imagen
    const { data: publicURL } = supabase.storage
      .from('qr-images')
      .getPublicUrl(fileName);

    console.log('✅ Imagen subida exitosamente');
    console.log('🔗 URL pública:', publicURL.publicUrl);

    res.json({
      message: 'Imagen subida exitosamente',
      imageUrl: publicURL.publicUrl,
      fileName: fileName
    });
  } catch (error) {
    console.error('❌ Error en uploadQRImage:', error);
    res.status(500).json({ 
      message: 'Error en el servidor', 
      error: error.message 
    });
  }
};

// Activar/Desactivar QR
export const toggleQRStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔄 Cambiando status del QR:', id);

    // Obtener estado actual
    const { data: currentQR } = await supabase
      .from('qr_codes')
      .select('is_active, name')
      .eq('id', id)
      .single();

    if (!currentQR) {
      return res.status(404).json({ 
        message: 'Código QR no encontrado' 
      });
    }

    const newStatus = !currentQR.is_active;

    const { data, error } = await supabase
      .from('qr_codes')
      .update({ 
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Error cambiando status:', error);
      return res.status(400).json({ 
        message: 'Error al cambiar estado', 
        error: error.message 
      });
    }

    const updatedQR = data[0];
    console.log(`✅ QR "${currentQR.name}" ${newStatus ? 'activado' : 'desactivado'}`);

    // Emitir evento Socket.IO si está disponible
    const io = req.app.get('io');
    if (io) {
      io.emit('qr:updated', updatedQR);
      console.log('📡 Evento "qr:updated" emitido');
    }

    res.json(updatedQR);
  } catch (error) {
    console.error('❌ Error en toggleQRStatus:', error);
    res.status(500).json({ 
      message: 'Error en el servidor', 
      error: error.message 
    });
  }
};