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

const Dashboard = () => {
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

  // 🆕 Estados para Socket.IO (sin cambiar la UI)
  const [isConnected, setIsConnected] = useState(false);

  // Función para calcular estadísticas desde OrderDisplay
  const calculateStatsFromDisplay = useCallback((displayOrders: OrderDisplay[]) => {
    const pending = displayOrders.filter(order => order.status === 'pending').length;
    const completed = displayOrders.filter(order => order.status === 'completed').length;
    const cancelled = displayOrders.filter(order => order.status === 'cancelled').length;
    
    setStats({
      pending,
      completed,
      cancelled,
      total: displayOrders.length
    });
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
      if (!user || !user.id) return;
      
      setLoading(true);
      const data = await getOrdersByEmployee(user.id);
      
      // Transformar los datos del servicio al formato que espera el componente
      const formattedOrders = transformOrderData(data);
      setOrders(formattedOrders);
      
      // Calcular estadísticas con los datos transformados
      calculateStatsFromDisplay(formattedOrders);
      
      console.log('👤 Dashboard Empleado: Pedidos cargados:', data.length);
      
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [user, transformOrderData, calculateStatsFromDisplay]);

  // 🆕 Socket.IO para tiempo real (SIN cambiar la UI)
  useEffect(() => {
    if (!user?.id) return;

    // Determinar URL del socket
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
                     import.meta.env.REACT_APP_SOCKET_URL || 
                     import.meta.env.REACT_APP_API_URL || 
                     'http://localhost:5001';
    
    console.log('🔌 Dashboard Empleado conectando Socket.IO a:', socketUrl);
    console.log('👤 User ID:', user.id);

    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      query: {
        userId: user.id,
        userType: 'employee'
      }
    });

    socketInstance.on('connect', () => {
      console.log('✅ Dashboard Empleado conectado a Socket.IO:', socketInstance.id);
      setIsConnected(true);
      
      // Unirse a la sala del empleado
      socketInstance.emit('join:employee', user.id);
      console.log(`👤 Dashboard Empleado ${user.id} unido a su sala`);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Dashboard Empleado desconectado de Socket.IO');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Dashboard Empleado error de conexión Socket.IO:', error);
      setIsConnected(false);
    });

    // 🆕 Escuchar nuevos pedidos asignados a este empleado
    socketInstance.on('order:assigned', (newOrder: Order) => {
      console.log('🆕 Dashboard Empleado: Nuevo pedido asignado:', newOrder);
      
      // Verificar si el pedido es para este empleado
      if (newOrder.assigned_to === user.id) {
        // Transformar el nuevo pedido
        const formattedOrder = transformOrderData([newOrder])[0];
        
        setOrders(prevOrders => {
          // Evitar duplicados
          const exists = prevOrders.some(order => order.id === newOrder.id);
          if (exists) return prevOrders;
          
          const newOrders = [formattedOrder, ...prevOrders];
          
          // Recalcular estadísticas usando la función simple
          calculateStatsFromDisplay(newOrders);
          
          return newOrders;
        });
        
        console.log('✅ Dashboard actualizado con nuevo pedido');
      }
    });

    // 🆕 Escuchar cuando se crea un pedido general
    socketInstance.on('order:created', (newOrder: Order) => {
      console.log('🆕 Dashboard Empleado: Nuevo pedido creado (general):', newOrder);
      
      // Si ya está asignado a este empleado, mostrarlo
      if (newOrder.assigned_to === user.id) {
        const formattedOrder = transformOrderData([newOrder])[0];
        
        setOrders(prevOrders => {
          const exists = prevOrders.some(order => order.id === newOrder.id);
          if (exists) return prevOrders;
          
          const newOrders = [formattedOrder, ...prevOrders];
          
          // Recalcular estadísticas usando la función simple
          calculateStatsFromDisplay(newOrders);
          
          return newOrders;
        });
      }
    });

    // 🆕 Escuchar actualizaciones de estado
    socketInstance.on('order:updated', (updatedOrder: Order) => {
      console.log('📝 Dashboard Empleado: Pedido actualizado:', updatedOrder);
      
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
          
          // Recalcular estadísticas usando la función simple
          calculateStatsFromDisplay(updatedOrders);
          
          return updatedOrders;
        }
        
        return prevOrders;
      });
    });

    // 🆕 Escuchar cuando un pedido es reasignado (removido de este empleado)
    socketInstance.on('order:unassigned', (orderId: string) => {
      console.log('🔄 Dashboard Empleado: Pedido reasignado/removido:', orderId);
      
      setOrders(prevOrders => {
        const filteredOrders = prevOrders.filter(order => order.id !== orderId);
        
        // Recalcular estadísticas usando la función simple
        calculateStatsFromDisplay(filteredOrders);
        
        return filteredOrders;
      });
    });

    // 🆕 Escuchar eliminaciones de pedidos
    socketInstance.on('order:deleted', (deletedOrderId: string) => {
      console.log('🗑️ Dashboard Empleado: Pedido eliminado:', deletedOrderId);
      
      setOrders(prevOrders => {
        const filteredOrders = prevOrders.filter(order => order.id !== deletedOrderId);
        
        // Recalcular estadísticas usando la función simple
        calculateStatsFromDisplay(filteredOrders);
        
        return filteredOrders;
      });
    });

    return () => {
      console.log('🔌 Dashboard Empleado desconectando Socket.IO');
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
        <h2 className="text-2xl font-bold">Dashboard de Empleado</h2>
        
        {/* 🆕 Indicador de conexión (DISCRETO, no invasivo) */}
        {process.env.NODE_ENV === 'development' && (
          <div className={`flex items-center space-x-2 px-2 py-1 rounded text-xs ${
            isConnected 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span>{isConnected ? 'En vivo' : 'Sin conexión'}</span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-t-4 border-b-4 border-green-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Tarjetas de estadísticas - SIN CAMBIOS */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Total Pedidos</h3>
              <p className="mt-2 text-3xl font-bold text-blue-600">{stats.total}</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Pedidos Pendientes</h3>
              <p className="mt-2 text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Pedidos Completados</h3>
              <p className="mt-2 text-3xl font-bold text-green-600">{stats.completed}</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Pedidos Cancelados</h3>
              <p className="mt-2 text-3xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
          </div>
          
          {/* Pedidos recientes - SIN CAMBIOS */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Pedidos Recientes</h3>
            
            {orders.length === 0 ? (
              <p className="text-gray-500">No tienes pedidos asignados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        ID
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.client_name} {order.client_last_name || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(order.created_at)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.amount?.toFixed(2) || '0.00'} Bs</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;