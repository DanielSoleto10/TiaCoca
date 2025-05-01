import api from './api';

export interface Flavor {
  id: string;
  name: string;
  category_id: string;
  price: number;
  stock: number;
  categories?: {
    name: string;
  };
}

// Obtener todos los sabores
export const getAllFlavors = async (): Promise<Flavor[]> => {
  const response = await api.get<Flavor[]>('/flavors');
  return response.data;
};

// Obtener sabores por categoría
export const getFlavorsByCategory = async (categoryId: string): Promise<Flavor[]> => {
  const response = await api.get<Flavor[]>(`/flavors/category/${categoryId}`);
  return response.data;
};

// Obtener un sabor por ID
export const getFlavorById = async (id: string): Promise<Flavor> => {
  const response = await api.get<Flavor>(`/flavors/${id}`);
  return response.data;
};

// Crear un nuevo sabor
export const createFlavor = async (flavor: Omit<Flavor, 'id' | 'categories'>): Promise<Flavor> => {
  const response = await api.post<Flavor>('/flavors', flavor);
  return response.data;
};

// Actualizar un sabor
export const updateFlavor = async (id: string, flavor: Omit<Flavor, 'id' | 'categories'>): Promise<Flavor> => {
  const response = await api.put<Flavor>(`/flavors/${id}`, flavor);
  return response.data;
};

// Eliminar un sabor
export const deleteFlavor = async (id: string): Promise<void> => {
  await api.delete(`/flavors/${id}`);
};

// Actualizar stock de un sabor
export const updateStock = async (id: string, stock: number): Promise<Flavor> => {
  const response = await api.patch<Flavor>(`/flavors/${id}/stock`, { stock });
  return response.data;
};