import { useState, useEffect, useCallback } from 'react';
import { getAllOrders, updateOrderStatus } from '../../services/orders';
import { io } from 'socket.io-client';

// Definición de interfaces
interface Order {
  id: string;
  created_at: string;
  status: 'pending' | 'completed' | 'cancelled';
  full_name: string;
  flavors?: string[];
  sweetness?: string;
  crushed_type?: string;
  package_type?: string;
  amount?: number;
  notes?: string;
  assigned_to?: string;
  payment_proof_url?: string;
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
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [proofLoading, setProofLoading] = useState(false);
  
  // Estados para tiempo real
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllOrders(filter !== 'all' ? filter : undefined);
      setOrders(data as Order[]);
      console.log('📋 Admin: Pedidos cargados:', data.length);
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      setError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Configuración de Socket.IO
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
                     import.meta.env.REACT_APP_SOCKET_URL || 
                     import.meta.env.REACT_APP_API_URL || 
                     'http://localhost:5001';
    
    console.log('🔌 Admin conectando Socket.IO a:', socketUrl);
    
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    socketInstance.on('connect', () => {
      console.log('✅ Admin conectado a Socket.IO:', socketInstance.id);
      
      // Unirse a la sala de admins
      socketInstance.emit('join:admin');
      console.log('👑 Admin unido a la sala de admins');
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Admin desconectado de Socket.IO');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Error de conexión Socket.IO:', error);
    });

    // Escuchar nuevos pedidos
    socketInstance.on('order:created', (newOrder: Order) => {
      console.log('🆕 Admin: Nuevo pedido recibido:', newOrder);
      
      setOrders(prevOrders => {
        // Evitar duplicados
        const exists = prevOrders.some(order => order.id === newOrder.id);
        if (exists) return prevOrders;
        
        return [newOrder, ...prevOrders];
      });
      
      setNewOrdersCount(prev => prev + 1);
      setSuccess(`🆕 Nuevo pedido de ${newOrder.full_name}`);
      
      setTimeout(() => setSuccess(''), 4000);
    });

    // Escuchar actualizaciones de estado
    socketInstance.on('order:updated', (updatedOrder: Order) => {
      console.log('📝 Admin: Pedido actualizado:', updatedOrder);
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === updatedOrder.id 
            ? { ...order, ...updatedOrder }
            : order
        )
      );

      const statusText = updatedOrder.status === 'completed' ? 'completado' : 
                        updatedOrder.status === 'cancelled' ? 'cancelado' : 'actualizado';
      
      setSuccess(`📱 Pedido ${statusText} (sincronizado)`);
      setTimeout(() => setSuccess(''), 3000);
    });

    // Escuchar eliminaciones de pedidos
    socketInstance.on('order:deleted', (deletedOrderId: string) => {
      console.log('🗑️ Admin: Pedido eliminado:', deletedOrderId);
      
      setOrders(prevOrders => 
        prevOrders.filter(order => order.id !== deletedOrderId)
      );
      
      setSuccess('Pedido eliminado (sincronizado)');
      setTimeout(() => setSuccess(''), 3000);
    });

    return () => {
      console.log('🔌 Admin desconectando Socket.IO');
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus): Promise<void> => {
    try {
      console.log('🔄 Admin cambiando status:', orderId, '->', newStatus);
      
      // 1. Actualización optimista (inmediata en UI)
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );

      // 2. Actualizar en base de datos
      await updateOrderStatus(orderId, newStatus);
      
      const statusText = newStatus === 'completed' ? 'completado' : 
                        newStatus === 'cancelled' ? 'cancelado' : 'actualizado';
      
      setSuccess(`Pedido ${statusText} exitosamente`);
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      setError('Error al actualizar el estado del pedido');
      
      // En caso de error, restaurar estado y hacer refetch
      fetchOrders();
    }
  };

  const handleViewProof = (proofUrl: string) => {
    setProofLoading(true);
    setSelectedProof(proofUrl);
  };

  const handleCloseProof = () => {
    setSelectedProof(null);
    setProofLoading(false);
  };

  // Marcar pedidos nuevos como vistos
  const markNewOrdersAsSeen = () => {
    setNewOrdersCount(0);
  };

  // Actualización manual
  const handleManualRefresh = async () => {
    console.log('🔄 Admin: Actualización manual');
    await fetchOrders();
    setSuccess('Pedidos actualizados manualmente');
    setTimeout(() => setSuccess(''), 2000);
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
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Pedidos
          </h2>
          
          {/* Indicador de pedidos nuevos */}
          {newOrdersCount > 0 && (
            <div 
              onClick={markNewOrdersAsSeen}
              className="cursor-pointer bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse hover:bg-red-600 transition-colors"
            >
              {newOrdersCount} nuevo{newOrdersCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Botón de actualización manual */}
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>

          {/* Filtros */}
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'all' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'pending' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'completed' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
            }`}
          >
            Completados
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'cancelled' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
            }`}
          >
            Cancelados
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-700/20 dark:text-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-700/20 dark:text-green-100">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 border-t-4 border-b-4 border-green-500 dark:border-green-400 rounded-full animate-spin"></div>
            <p className="text-gray-500 dark:text-gray-400">Cargando pedidos...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg font-medium">No hay pedidos</p>
              <p className="text-sm">
                {filter !== 'all' 
                  ? `No se encontraron pedidos ${filter === 'pending' ? 'pendientes' : filter === 'completed' ? 'completados' : 'cancelados'}`
                  : 'Aún no se han registrado pedidos en el sistema'
                }
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Pedido #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(order.status)}
                    
                    {order.payment_proof_url && (
                      <button
                        onClick={() => handleViewProof(order.payment_proof_url!)}
                        className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center space-x-1 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Ver Comprobante</span>
                      </button>
                    )}
                    
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(order.id, 'completed')}
                          className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                        >
                          Completar
                        </button>
                        <button
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Información del Cliente</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Nombre:</span> {order.full_name}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Comprobante:</span> 
                      {order.payment_proof_url ? (
                        <span className="text-green-600 font-medium ml-1">✓ Subido</span>
                      ) : (
                        <span className="text-red-600 font-medium ml-1">✗ Sin comprobante</span>
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Detalles del Pedido</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Sabores:</span> {order.flavors?.join(', ') || 'No disponible'}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Dulzura:</span> {order.sweetness || 'No disponible'}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Machucado:</span> {order.crushed_type || 'No disponible'}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Paquete:</span> {order.package_type || 'No disponible'}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Monto:</span> {order.amount?.toFixed(2) || '0.00'} Bs
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal para ver comprobante */}
      {selectedProof && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-600">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Comprobante de Pago</h3>
              <button
                onClick={handleCloseProof}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <div className="text-center">
                {proofLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                    <span className="ml-2 text-gray-700 dark:text-gray-300">Cargando imagen...</span>
                  </div>
                )}
                
                <img
                  src={selectedProof}
                  alt="Comprobante de pago"
                  className="max-w-full max-h-[60vh] mx-auto rounded-lg shadow-lg"
                  onLoad={() => setProofLoading(false)}
                  onError={() => {
                    setProofLoading(false);
                    setError('Error al cargar la imagen del comprobante');
                  }}
                  style={{ display: proofLoading ? 'none' : 'block' }}
                />
              </div>
              
              <div className="flex justify-center space-x-3 mt-4">
                <a
                  href={selectedProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>Abrir en nueva pestaña</span>
                </a>
                
                <button
                  onClick={handleCloseProof}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;