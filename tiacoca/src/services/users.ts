import api from './api';

export interface User {
  id: string;
  full_name: string;
  email: string;
  birth_date: string;
  identity_card: string;
  role: 'admin' | 'employee';
  created_at: string;
  temp_password?: string;
  password_created_at?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  birthDate: string;
  identityCard: string;
  role: 'admin' | 'employee';
}

export interface ResetPasswordResponse {
  message: string;
  tempPassword: string;
}

export interface SetPasswordData {
  password: string;
}

// Obtener todos los usuarios
export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/users');
  return response.data;
};

// Obtener un usuario por ID
export const getUserById = async (id: string): Promise<User> => {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
};

// Crear un nuevo usuario (registro)
export const createUser = async (userData: CreateUserData): Promise<{ userId: string }> => {
  const response = await api.post<{ userId: string }>('/auth/register', userData);
  return response.data;
};

// Actualizar un usuario
export const updateUser = async (id: string, userData: Partial<Omit<User, 'id' | 'email' | 'created_at'>>): Promise<void> => {
  await api.put(`/users/${id}`, userData);
};

// Eliminar un usuario
export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};

// Resetear contraseña (generar automática)
export const resetUserPassword = async (userId: string): Promise<ResetPasswordResponse> => {
  const response = await api.post<ResetPasswordResponse>(`/users/${userId}/reset-password`);
  return response.data;
};

// Establecer contraseña personalizada
export const setUserPassword = async (userId: string, passwordData: SetPasswordData): Promise<void> => {
  await api.post(`/users/${userId}/set-password`, passwordData);
};

// Limpiar contraseña temporal (para ocultar después de usar)
export const clearTempPassword = async (userId: string): Promise<void> => {
  await api.delete(`/users/${userId}/temp-password`);
};