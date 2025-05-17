import api from './api';

export interface Package {
  id: string;
  price: number;
  weight: number;
  weight_unit: string;
  name: string;
}

// Obtener todos los paquetes
export const getAllPackages = async (): Promise<Package[]> => {
  const response = await api.get<Package[]>('/packages');
  return response.data;
};

// Obtener un paquete por ID
export const getPackageById = async (id: string): Promise<Package> => {
  const response = await api.get<Package>(`/packages/${id}`);
  return response.data;
};

// Crear un nuevo paquete
export const createPackage = async (packageData: Omit<Package, 'id'>): Promise<Package> => {
  const response = await api.post<Package>('/packages', packageData);
  return response.data;
};

// Actualizar un paquete
export const updatePackage = async (id: string, packageData: Partial<Omit<Package, 'id'>>): Promise<Package> => {
  const response = await api.put<Package>(`/packages/${id}`, packageData);
  return response.data;
};

// Eliminar un paquete
export const deletePackage = async (id: string): Promise<void> => {
  await api.delete(`/packages/${id}`);
};