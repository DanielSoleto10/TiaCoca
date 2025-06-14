import api from './api';

// ============ INTERFACES EXISTENTES ============
export interface DailySales {
  day: string;
  total: number;
  count: number;
}

export interface SalesSummary {
  today: {
    total: number;
    count: number;
    completed: number;
    pending: number;
    cancelled: number;
  };
  month: {
    total: number;
    count: number;
    completed: number;
    pending: number;
    cancelled: number;
  };
}

export interface FlavorSales {
  name: string;
  count: number;
}

export interface CashierClosing {
  id: string;
  closing_date: string;
  total_sales: number;
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  notes?: string;
}

// ============ NUEVAS INTERFACES PARA EXCEL ============
export interface MonthlySales {
  month: string; // "2025-01"
  year: number;
  total: number;
  count: number;
  completed: number;
  pending: number;
  cancelled: number;
}

export interface DetailedSale {
  id: string;
  date: string;
  user_name: string;
  total: number;
  status: string;
  flavors: string[]; // Array de sabores en ese pedido
}

export interface FlavorByMonth {
  month: string; // "2025-01"
  flavor_name: string;
  count: number;
}

// ============ FUNCIONES EXISTENTES ============

// Obtener ventas por día
export const getSalesByDay = async (days: number = 7): Promise<DailySales[]> => {
  const response = await api.get<DailySales[]>('/reports/sales/day', {
    params: { days }
  });
  return response.data;
};

// Obtener resumen de ventas
export const getSalesSummary = async (): Promise<SalesSummary> => {
  const response = await api.get<SalesSummary>('/reports/sales/summary');
  return response.data;
};

// Obtener ventas por sabor
export const getSalesByFlavor = async (days: number = 30): Promise<FlavorSales[]> => {
  const response = await api.get<FlavorSales[]>('/reports/sales/flavor', {
    params: { days }
  });
  return response.data;
};

// Obtener cierres de caja
export const getCashierClosings = async (limit: number = 5): Promise<CashierClosing[]> => {
  const response = await api.get<CashierClosing[]>('/reports/cashier/closings', {
    params: { limit }
  });
  return response.data;
};

// Crear cierre de caja
export const createCashierClosing = async (data: Omit<CashierClosing, 'id' | 'closing_date'>): Promise<CashierClosing> => {
  const response = await api.post<CashierClosing>('/reports/cashier/closings', data);
  return response.data;
};

// ============ NUEVAS FUNCIONES PARA EXCEL ============

// Obtener ventas por mes
export const getSalesByMonth = async (): Promise<MonthlySales[]> => {
  const response = await api.get<MonthlySales[]>('/reports/sales/monthly');
  return response.data;
};

// Obtener ventas detalladas
export const getDetailedSales = async (startDate?: string, endDate?: string): Promise<DetailedSale[]> => {
  const response = await api.get<DetailedSale[]>('/reports/sales/detailed', {
    params: { start_date: startDate, end_date: endDate }
  });
  return response.data;
};

// Obtener sabores por mes
export const getFlavorsByMonth = async (): Promise<FlavorByMonth[]> => {
  const response = await api.get<FlavorByMonth[]>('/reports/sales/flavors-monthly');
  return response.data;
};