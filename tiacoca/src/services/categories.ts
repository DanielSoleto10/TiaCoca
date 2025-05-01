import api from './api';

export interface Category {
  id: string;
  name: string;
}

// Obtener todas las categorías
export const getAllCategories = async (): Promise<Category[]> => {
  const response = await api.get<Category[]>('/categories');
  return response.data;
};

// Obtener una categoría por ID
export const getCategoryById = async (id: string): Promise<Category> => {
  const response = await api.get<Category>(`/categories/${id}`);
  return response.data;
};

// Crear una nueva categoría
export const createCategory = async (name: string): Promise<Category> => {
  const response = await api.post<Category>('/categories', { name });
  return response.data;
};

// Actualizar una categoría
export const updateCategory = async (id: string, name: string): Promise<Category> => {
  const response = await api.put<Category>(`/categories/${id}`, { name });
  return response.data;
};

// Eliminar una categoría
export const deleteCategory = async (id: string): Promise<void> => {
  await api.delete(`/categories/${id}`);
};