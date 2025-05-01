import api from './api';

// Tipos
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Guardar token en localStorage
export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

// Obtener token de localStorage
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Eliminar token de localStorage
export const removeToken = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Guardar usuario en localStorage
export const setUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

// Obtener usuario de localStorage
export const getUser = (): User | null => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Iniciar sesión
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  setToken(response.data.token);
  setUser(response.data.user);
  return response.data;
};

// Cerrar sesión
export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  } finally {
    removeToken();
    window.location.href = '/login';
  }
};

// Verificar si el usuario está autenticado
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Verificar si el usuario es administrador
export const isAdmin = (): boolean => {
  const user = getUser();
  return user?.role === 'admin';
};

// Verificar si el usuario es empleado
export const isEmployee = (): boolean => {
  const user = getUser();
  return user?.role === 'employee';
};

// Verificar token
export const verifyToken = async (): Promise<boolean> => {
  try {
    const response = await api.post('/auth/verify');
    return response.data.valid;
  } catch (error) {
    removeToken();
    return false;
  }
};