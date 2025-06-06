import { useState, useEffect, useRef } from 'react';
import { 
  getAllQRCodes, 
  createQRCode, 
  updateQRCode, 
  deleteQRCode, 
  toggleQRStatus, 
  uploadQRImage,
  QRCode,
  QRFormData 
} from '../../services/qr';

const QRManagement = () => {
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentQR, setCurrentQR] = useState<QRCode | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<QRFormData>({
    name: '',
    is_active: true
  });
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchQRCodes();
  }, []);

  const fetchQRCodes = async () => {
    try {
      setLoading(true);
      const data = await getAllQRCodes();
      setQRCodes(data);
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      setError('Error al cargar los códigos QR');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenModal = (qr: QRCode | null = null) => {
    if (qr) {
      setIsEditing(true);
      setCurrentQR(qr);
      setFormData({
        name: qr.name,
        is_active: qr.is_active
      });
      setCurrentImageUrl(qr.image_url);
      setImagePreview('');
      setSelectedImage(null);
    } else {
      setIsEditing(false);
      setCurrentQR(null);
      setFormData({
        name: '',
        is_active: true
      });
      setCurrentImageUrl('');
      setImagePreview('');
      setSelectedImage(null);
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
    setImagePreview('');
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError('');
      setUploading(true);
      
      let imageUrl = currentImageUrl;
      
      // Si hay una nueva imagen, subirla primero
      if (selectedImage) {
        try {
          const uploadResult = await uploadQRImage(selectedImage);
          imageUrl = uploadResult.imageUrl;
        } catch{
          throw new Error('Error al subir la imagen');
        }
      }
      
      // Verificar que tengamos una URL de imagen
      if (!imageUrl) {
        throw new Error('Debe seleccionar una imagen');
      }
      
      const qrData = {
        ...formData,
        image_url: imageUrl
      };
      
      if (isEditing && currentQR) {
        await updateQRCode(currentQR.id, qrData);
        setSuccess('Código QR actualizado exitosamente');
      } else {
        await createQRCode(qrData);
        setSuccess('Código QR creado exitosamente');
      }
      
      setShowModal(false);
      await fetchQRCodes();
      
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('Error saving QR:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar el código QR';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el código QR "${name}"?`)) {
      try {
        await deleteQRCode(id);
        setSuccess('Código QR eliminado exitosamente');
        await fetchQRCodes();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Error deleting QR:', err);
        setError('Error al eliminar el código QR');
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleQRStatus(id);
      setSuccess(`Código QR ${currentStatus ? 'desactivado' : 'activado'} exitosamente`);
      await fetchQRCodes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error toggling QR status:', err);
      setError('Error al cambiar el estado del código QR');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestión de Códigos QR
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
        >
          Nuevo QR
        </button>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-700/20 dark:text-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-700/20 dark:text-green-100">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 border-t-4 border-b-4 border-green-500 rounded-full animate-spin"></div>
            <p className="text-gray-500 dark:text-gray-400">Cargando códigos QR...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {qrCodes.length === 0 ? (
            <div className="col-span-full p-8 text-center text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <p className="text-lg font-medium">No hay códigos QR</p>
              <p className="text-sm">Crea tu primer código QR para empezar</p>
            </div>
          ) : (
            qrCodes.map((qr) => (
              <div key={qr.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
                {/* Imagen QR */}
                <div className="relative">
                  <img
                    src={qr.image_url}
                    alt={qr.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      qr.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {qr.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {qr.name}
                  </h3>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                    Creado: {formatDate(qr.created_at)}
                  </p>
                  
                  {/* Acciones */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleOpenModal(qr)}
                      className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Editar
                    </button>
                    
                    <button
                      onClick={() => handleToggleStatus(qr.id, qr.is_active)}
                      className={`px-3 py-1 text-xs font-medium text-white rounded-md transition-colors ${
                        qr.is_active 
                          ? 'bg-orange-600 hover:bg-orange-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {qr.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    
                    <button
                      onClick={() => handleDelete(qr.id, qr.name)}
                      className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal para crear/editar QR */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
          <div className="w-full max-w-2xl p-6 mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
              {isEditing ? 'Editar Código QR' : 'Nuevo Código QR'}
            </h3>
            
            {error && (
              <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-700/20 dark:text-red-100">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Ej: QR Banco Nacional"
                  />
                </div>
                
                {/* Imagen */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Imagen del QR *
                  </label>
                  
                  {/* Preview de imagen actual o nueva */}
                  {(imagePreview || currentImageUrl) && (
                    <div className="mb-3">
                      <img
                        src={imagePreview || currentImageUrl}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {imagePreview ? 'Nueva imagen seleccionada' : 'Imagen actual'}
                      </p>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900 dark:file:text-green-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos permitidos: JPG, PNG, GIF. Máximo 5MB.
                  </p>
                </div>

                {/* Estado activo */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Código QR activo (visible para los clientes)
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={uploading}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {uploading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRManagement;