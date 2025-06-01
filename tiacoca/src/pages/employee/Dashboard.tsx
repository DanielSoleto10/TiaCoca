import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOrdersByEmployee } from '../../services/orders';

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

  const fetchOrders = useCallback(async () => {
    try {
      if (!user || !user.id) return;
      
      setLoading(true);
      const data = await getOrdersByEmployee(user.id);
      
      // Transformar los datos del servicio al formato que espera el componente
      const formattedOrders: OrderDisplay[] = data.map(order => {
        // Extraer nombre y apellido de full_name (suponiendo formato "Nombre Apellido")
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
      
      setOrders(formattedOrders);
      
      // Calcular estadísticas con los datos recibidos directamente
      const pending = data.filter(order => order.status === 'pending').length;
      const completed = data.filter(order => order.status === 'completed').length;
      const cancelled = data.filter(order => order.status === 'cancelled').length;
      
      setStats({
        pending,
        completed,
        cancelled,
        total: data.length
      });
      
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [user]);

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
      <h2 className="text-2xl font-bold">Dashboard de Empleado</h2>
      
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
          {/* Tarjetas de estadísticas */}
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
          
          {/* Pedidos recientes */}
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