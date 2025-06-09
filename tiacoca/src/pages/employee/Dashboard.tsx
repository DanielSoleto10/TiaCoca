import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOrdersByEmployee } from '../../services/orders';
import { io } from 'socket.io-client';

// 🆕 Interfaces completas para Socket.IO
interface Order {
  id: string;
  full_name: string;
  created_at: string;
  status: OrderStatus;
  amount?: number;
  assigned_to?: string;
}

// Definición de tipo de estado
type OrderStatus = 'pending' | 'completed' | 'cancelled';

// Interfaz Order adaptada para el componente
interface OrderDisplay {
  id: string;
  client_name: string;
  client_last_name?: string;
  created_at: string;
  status: OrderStatus;
  amount?: number;
}

interface Stats {
  pending: number;
  completed: number;
  cancelled: number;
  total: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    completed: 0,
    cancelled: 0,
    total: 0
  });

  // 🔧 FUNCIÓN CORREGIDA para calcular estadísticas
  const calculateStatsFromDisplay = useCallback((displayOrders: OrderDisplay[]) => {
    const pending = displayOrders.filter(order => order.status === 'pending').length;
    const completed = displayOrders.filter(order => order.status === 'completed').length;
    const cancelled = displayOrders.filter(order => order.status === 'cancelled').length;
    const total = displayOrders.length;
    
    const newStats = {
      pending,
      completed,
      cancelled,
      total
    };
    
    setStats(newStats);
    return newStats;
  }, []);

  // Función para transformar datos (reutilizable)
  const transformOrderData = useCallback((data: Order[]): OrderDisplay[] => {
    return data.map(order => {
      const nameParts = order.full_name.split(' ');
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      return {
        id: order.id,
        client_name: nameParts[0],
        client_last_name: lastName || undefined,
        created_at: order.created_at,
        status: order.status,
        amount: order.amount
      };
    });
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      if (!user || !user.id) {
        return;
      }
      
      setLoading(true);
      setError('');
      
      const data = await getOrdersByEmployee(user.id);

      if (!Array.isArray(data)) {
        setError('Error: Los datos recibidos no son válidos');
        setOrders([]);
        setStats({ pending: 0, completed: 0, cancelled: 0, total: 0 });
        return;
      }
      
      // Filtrar solo pedidos de HOY para todo (estadísticas Y tabla)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = data.filter(order => {
        const orderDate = new Date(order.created_at);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });
      
      // Transformar datos de hoy
      const todayOrdersFormatted = transformOrderData(todayOrders);
      
      // Ordenar por fecha más reciente primero
      const sortedOrders = todayOrdersFormatted.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // Usar los mismos datos para estadísticas y tabla
      setOrders(sortedOrders);
      calculateStatsFromDisplay(todayOrdersFormatted);
      
    } catch (err) {
      console.error('❌ Error fetching employee orders:', err);
      setError('Error al cargar los pedidos');
      setOrders([]);
      setStats({ pending: 0, completed: 0, cancelled: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [user, transformOrderData, calculateStatsFromDisplay]);

  // 🔧 EFECTO ADICIONAL para debug de estadísticas
  useEffect(() => {
    // Debug silencioso - solo en desarrollo si es necesario
    if (process.env.NODE_ENV === 'development') {
      console.log('Estado actual - Orders:', orders.length, 'Stats:', stats);
    }
  }, [orders, stats]);

  // 🆕 Socket.IO para tiempo real
  useEffect(() => {
    if (!user?.id) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
                     import.meta.env.REACT_APP_SOCKET_URL || 
                     import.meta.env.REACT_APP_API_URL || 
                     'http://localhost:5001';

    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: false,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      query: {
        userId: user.id,
        userType: 'employee'
      }
    });

    socketInstance.on('connect', () => {
      // Unirse a las salas de empleados
      socketInstance.emit('join:employee', user.id);
      socketInstance.emit('join:employees');
    });

    // Escuchar nuevos pedidos asignados a este empleado
    socketInstance.on('order:assigned', (newOrder: Order) => {
      if (newOrder.assigned_to === user.id) {
        const formattedOrder = transformOrderData([newOrder])[0];
        
        setOrders(prevOrders => {
          const exists = prevOrders.some(order => order.id === newOrder.id);
          if (exists) return prevOrders;
          
          const newOrders = [formattedOrder, ...prevOrders];
          calculateStatsFromDisplay(newOrders);
          return newOrders;
        });
      }
    });

    // Escuchar cuando se crea un pedido general
    socketInstance.on('order:created', (newOrder: Order) => {
      // Solo agregar si es de hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const orderDate = new Date(newOrder.created_at);
      orderDate.setHours(0, 0, 0, 0);
      
      if (orderDate.getTime() === today.getTime()) {
        const formattedOrder = transformOrderData([newOrder])[0];
        
        setOrders(prevOrders => {
          const exists = prevOrders.some(order => order.id === newOrder.id);
          if (exists) return prevOrders;
          
          const newOrders = [formattedOrder, ...prevOrders];
          calculateStatsFromDisplay(newOrders);
          return newOrders;
        });
      }
    });

    // Escuchar actualizaciones de estado
    socketInstance.on('order:updated', (updatedOrder: Order) => {
      setOrders(prevOrders => {
        const orderExists = prevOrders.some(order => order.id === updatedOrder.id);
        const isForThisEmployee = updatedOrder.assigned_to === user.id;
        
        if (orderExists || isForThisEmployee) {
          const updatedOrders = prevOrders.map(order => {
            if (order.id === updatedOrder.id) {
              const formattedUpdated = transformOrderData([updatedOrder])[0];
              return formattedUpdated;
            }
            return order;
          });
          
          calculateStatsFromDisplay(updatedOrders);
          return updatedOrders;
        }
        
        return prevOrders;
      });
    });

    // Escuchar cuando un pedido es removido
    socketInstance.on('order:unassigned', (orderId: string) => {
      setOrders(prevOrders => {
        const filteredOrders = prevOrders.filter(order => order.id !== orderId);
        calculateStatsFromDisplay(filteredOrders);
        return filteredOrders;
      });
    });

    // Escuchar eliminaciones de pedidos
    socketInstance.on('order:deleted', (deletedOrderId: string) => {
      setOrders(prevOrders => {
        const filteredOrders = prevOrders.filter(order => order.id !== deletedOrderId);
        calculateStatsFromDisplay(filteredOrders);
        return filteredOrders;
      });
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user?.id, transformOrderData, calculateStatsFromDisplay]);

  useEffect(() => {
    if (user && user.id) {
      void fetchOrders();
    }
  }, [user, fetchOrders]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">Pendiente</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Completado</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Cancelado</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">Desconocido</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard de Empleado</h2>
        
        {/* Botón de actualización manual */}
        <button
          onClick={() => {
            void fetchOrders();
          }}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-700/20 dark:text-red-100">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 border-t-4 border-b-4 border-green-500 rounded-full animate-spin"></div>
            <p className="text-gray-500 dark:text-gray-400">Cargando dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Tarjetas de estadísticas - SOLO DE HOY */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pedidos de Hoy</h3>
              <p className="mt-2 text-3xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pendientes Hoy</h3>
              <p className="mt-2 text-3xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-gray-500 mt-1">Requieren atención</p>
            </div>
            
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Completados Hoy</h3>
              <p className="mt-2 text-3xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-gray-500 mt-1">Finalizados exitosamente</p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Cancelados Hoy</h3>
              <p className="mt-2 text-3xl font-bold text-red-600">{stats.cancelled}</p>
              <p className="text-xs text-gray-500 mt-1">Pedidos rechazados</p>
            </div>
          </div>
          
          {/* Pedidos recientes - ÚLTIMOS 7 DÍAS */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pedidos de Hoy</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </span>
            </div>
            
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="mt-2 text-gray-500 dark:text-gray-400">No tienes pedidos asignados.</p>
                <p className="text-sm text-gray-400">Los pedidos aparecerán aquí cuando te sean asignados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-300 uppercase">
                        ID
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-300 uppercase">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-300 uppercase">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-300 uppercase">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-300 uppercase">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {orders.map((order: OrderDisplay) => (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100 font-mono">{order.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">{order.client_name} {order.client_last_name || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">{formatDate(order.created_at)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{order.amount?.toFixed(2) || '0.00'} Bs</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Mostrar todos los pedidos de hoy */}
                {orders.length > 0 && (
                  <div className="text-center py-3 border-t dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Mostrando todos los {orders.length} pedidos de hoy
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;