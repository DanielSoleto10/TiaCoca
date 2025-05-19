import api from './api';

export interface Order {
  id: string;
  full_name: string;
  flavors?: string[];
  sweetness?: string;
  crushed_type?: string;
  package_type?: string; // Cambiado de package a package_type
  amount?: number;
  notes?: string;
  assigned_to?: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
  };
}

// Obtener todos los pedidos
export const getAllOrders = async (status?: string): Promise<Order[]> => {
  const response = await api.get<Order[]>('/orders', {
    params: { status }
  });
  return response.data;
};

// Obtener pedidos por empleado
export const getOrdersByEmployee = async (employeeId: string, status?: string): Promise<Order[]> => {
  const response = await api.get<Order[]>(`/orders/employee/${employeeId}`, {
    params: { status }
  });
  return response.data;
};

// Obtener un pedido por ID
export const getOrderById = async (id: string): Promise<Order> => {
  const response = await api.get<Order>(`/orders/${id}`);
  return response.data;
};

// Crear un nuevo pedido
export const createOrder = async (order: Omit<Order, 'id' | 'status' | 'created_at' | 'updated_at' | 'profiles'>): Promise<Order> => {
  const response = await api.post<Order>('/orders', order);
  return response.data;
};

// Actualizar estado de un pedido
export const updateOrderStatus = async (id: string, status: 'pending' | 'completed' | 'cancelled'): Promise<Order> => {
  const response = await api.patch<Order>(`/orders/${id}/status`, { status });
  return response.data;
};

// Asignar pedido a un empleado
export const assignOrder = async (id: string, employeeId: string): Promise<Order> => {
  const response = await api.patch<Order>(`/orders/${id}/assign`, { employeeId });
  return response.data;
};