import api from './api';

export interface CrushedType {
  id: string;
  name: string;
  description: string;
}

// Obtener todos los tipos de machucado
export const getAllCrushedTypes = async (): Promise<CrushedType[]> => {
  const response = await api.get<CrushedType[]>('/crushed-types');
  return response.data;
};

// Obtener un tipo de machucado por ID
export const getCrushedTypeById = async (id: string): Promise<CrushedType> => {
  const response = await api.get<CrushedType>(`/crushed-types/${id}`);
  return response.data;
};

// Crear un nuevo tipo de machucado
export const createCrushedType = async (name: string, description: string): Promise<CrushedType> => {
  const response = await api.post<CrushedType>('/crushed-types', { name, description });
  return response.data;
};

// Actualizar un tipo de machucado
export const updateCrushedType = async (id: string, name: string, description: string): Promise<CrushedType> => {
  const response = await api.put<CrushedType>(`/crushed-types/${id}`, { name, description });
  return response.data;
};

// Eliminar un tipo de machucado
export const deleteCrushedType = async (id: string): Promise<void> => {
  await api.delete(`/crushed-types/${id}`);
};