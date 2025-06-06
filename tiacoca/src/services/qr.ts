import api from './api';

export interface QRCode {
  id: string;
  name: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QRFormData {
  name: string;
  is_active: boolean;
}

// Obtener todos los códigos QR (para admin)
export const getAllQRCodes = async (): Promise<QRCode[]> => {
  const response = await api.get<QRCode[]>('/qr');
  return response.data;
};

// Obtener solo QRs activos (para cliente)
export const getActiveQRCodes = async (): Promise<QRCode[]> => {
  const response = await api.get<QRCode[]>('/qr/active', {
    params: { active_only: 'true' }
  });
  return response.data;
};

// Obtener un QR por ID
export const getQRCodeById = async (id: string): Promise<QRCode> => {
  const response = await api.get<QRCode>(`/qr/${id}`);
  return response.data;
};

// Crear un nuevo QR
export const createQRCode = async (qrData: QRFormData & { image_url: string }): Promise<QRCode> => {
  const response = await api.post<QRCode>('/qr', qrData);
  return response.data;
};

// Actualizar un QR
export const updateQRCode = async (id: string, qrData: Partial<QRFormData & { image_url: string }>): Promise<QRCode> => {
  const response = await api.put<QRCode>(`/qr/${id}`, qrData);
  return response.data;
};

// Eliminar un QR
export const deleteQRCode = async (id: string): Promise<void> => {
  await api.delete(`/qr/${id}`);
};

// Activar/Desactivar QR
export const toggleQRStatus = async (id: string): Promise<QRCode> => {
  const response = await api.patch<QRCode>(`/qr/${id}/toggle`);
  return response.data;
};

// Subir imagen QR
export const uploadQRImage = async (file: File): Promise<{ imageUrl: string; fileName: string }> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post('/qr/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return {
    imageUrl: response.data.imageUrl,
    fileName: response.data.fileName
  };
};