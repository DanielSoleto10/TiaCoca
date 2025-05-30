import { useState, useEffect, useCallback } from 'react';
import { getAllOrders, updateOrderStatus } from '../../services/orders';

// Definición de interfaces
interface Order {
  id: string;
  created_at: string;
  status: 'pending' | 'completed' | 'cancelled';
  full_name: string;
  flavors?: string[];
  sweetness?: string;
  crushed_type?: string;
  package_type?: string; // Cambiado de package a package_type
  amount?: number;
  notes?: string;
  assigned_to?: string;
  profiles?: {
    full_name?: string;
  };
}

type OrderStatus = 'pending' | 'completed' | 'cancelled';
type FilterType = 'all' | OrderStatus;

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllOrders(filter !== 'all' ? filter : undefined);
      setOrders(data as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus): Promise<void> => {
    try {
      await updateOrderStatus(orderId, newStatus);
      
      setSuccess(`Pedido ${newStatus === 'completed' ? 'completado' : newStatus === 'cancelled' ? 'cancelado' : 'actualizado'} exitosamente`);
      void fetchOrders();
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Error al actualizar el estado del pedido');
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestión de Pedidos</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'all' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'pending' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'completed' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Completados
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'cancelled' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Cancelados
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-t-4 border-b-4 border-green-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No hay pedidos {filter !== 'all' ? `${filter === 'pending' ? 'pendientes' : filter === 'completed' ? 'completados' : 'cancelados'}` : ''} para mostrar.
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="p-6 bg-white rounded-lg shadow">
                <div className="flex flex-wrap items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Pedido #{order.id.slice(0, 8)}</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(order.status)}
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(order.id, 'completed')}
                          className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                        >
                          Completar
                        </button>
                        <button
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-500">Información del Cliente</h4>
                    <p className="text-sm"><span className="font-medium">Nombre:</span> {order.full_name}</p>
                  </div>
                  
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-500">Detalles del Pedido</h4>
                    <p className="text-sm"><span className="font-medium">Sabores:</span> {order.flavors?.join(', ') || 'No disponible'}</p>
                    <p className="text-sm"><span className="font-medium">Dulzura:</span> {order.sweetness || 'No disponible'}</p>
                    <p className="text-sm"><span className="font-medium">Machucado:</span> {order.crushed_type || 'No disponible'}</p>
                    <p className="text-sm"><span className="font-medium">Paquete:</span> {order.package_type || 'No disponible'}</p>
                    <p className="text-sm"><span className="font-medium">Monto:</span> {order.amount?.toFixed(2) || '0.00'} Bs</p>
                  </div>
                </div>
                
                {order.notes && (
                  <div className="mt-4">
                    <h4 className="mb-2 text-sm font-medium text-gray-500">Notas</h4>
                    <p className="text-sm">{order.notes}</p>
                  </div>
                )}
                
                {order.assigned_to && (
                  <div className="mt-4">
                    <h4 className="mb-2 text-sm font-medium text-gray-500">Asignado a</h4>
                    <p className="text-sm">{order.profiles?.full_name || 'Empleado'}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;