import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOrdersByEmployee, updateOrderStatus } from '../../services/orders';
import { io } from 'socket.io-client';

// Definición de interfaces
interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  full_name: string;
  flavors?: string[];
  sweetness?: string;
  crushed_type?: string;
  package_type?: string;
  amount?: number;
  notes?: string;
  payment_proof_url?: string;
  assigned_to?: string;
}

type OrderStatus = 'pending' | 'completed' | 'cancelled';
type FilterType = 'all' | OrderStatus;

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [proofLoading, setProofLoading] = useState(false);
  
  // Estados para tiempo real
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  
  // DEBUGGING - LOG INICIAL
  useEffect(() => {
    console.log('🔍 =================================');
    console.log('🔍 EMPLEADO - INFORMACIÓN DE DEBUG');
    console.log('🔍 =================================');
    console.log('👤 User:', user);
    console.log('👤 User ID:', user?.id);
    console.log('🌐 VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('🔍 =================================');
  }, [user]);

  const fetchOrders = useCallback(async () => {
    try {
      if (!user || !user.id) return;
      
      setLoading(true);
      const data = await getOrdersByEmployee(
        user.id, 
        filter !== 'all' ? filter as OrderStatus : undefined
      );
      setOrders(data as Order[]);
      console.log('👤 Empleado: Pedidos cargados:', data.length);
    } catch (err) {
      console.error('❌ Error fetching employee orders:', err);
      setError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [user, filter]);

  // SOCKET.IO CON DEBUGGING PARA ENCONTRAR EL ERROR
  useEffect(() => {
    if (!user?.id) {
      console.log('⚠️ No hay user.id disponible');
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
                     import.meta.env.REACT_APP_SOCKET_URL || 
                     import.meta.env.REACT_APP_API_URL || 
                     'http://localhost:5001';
    
    console.log('🔌 EMPLEADO - Conectando Socket.IO a:', socketUrl);
    console.log('👤 EMPLEADO - User ID:', user.id);

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
      console.log('✅ EMPLEADO - Conectado a Socket.IO');
      console.log('✅ Socket ID:', socketInstance.id);
      
      // NUEVO: Unirse a AMBAS salas
      socketInstance.emit('join:employee', user.id);
      socketInstance.emit('join:employees'); // Sala general
      console.log(`👤 EMPLEADO - Unido a sala específica: employee:${user.id}`);
      console.log(`👥 EMPLEADO - Unido a sala general: employees`);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ EMPLEADO - Desconectado de Socket.IO');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ EMPLEADO - Error de conexión:', error);
    });

    // EVENTOS QUE DEBE RECIBIR EL EMPLEADO - SIMPLIFICADO
    socketInstance.on('order:created', (newOrder: Order) => {
      console.log('🆕 EMPLEADO - Evento order:created recibido:', newOrder);
      console.log('👤 Para todos los empleados - agregando pedido');
      
      setOrders(prevOrders => {
        const exists = prevOrders.some(order => order.id === newOrder.id);
        if (exists) {
          console.log('⚠️ Pedido ya existe, ignorando duplicado');
          return prevOrders;
        }
        console.log('✅ Agregando nuevo pedido a la lista');
        return [newOrder, ...prevOrders];
      });
      
      setNewOrdersCount(prev => prev + 1);
      setSuccess(`🆕 Nuevo pedido: ${newOrder.full_name}`);
      setTimeout(() => setSuccess(''), 4000);
    });

    // OPCIONAL: Mantener order:assigned por si se usa después
    socketInstance.on('order:assigned', (newOrder: Order) => {
      console.log('🎯 EMPLEADO - Evento order:assigned recibido:', newOrder);
      console.log('🎯 Asignado a:', newOrder.assigned_to, '| Mi ID:', user.id);
      
      if (newOrder.assigned_to === user.id) {
        console.log('✅ EMPLEADO - Es para mí, agregando pedido');
        setOrders(prevOrders => {
          const exists = prevOrders.some(order => order.id === newOrder.id);
          if (exists) return prevOrders;
          return [newOrder, ...prevOrders];
        });
        setNewOrdersCount(prev => prev + 1);
        setSuccess(`🎯 Pedido asignado específicamente: ${newOrder.full_name}`);
        setTimeout(() => setSuccess(''), 4000);
      }
    });

    socketInstance.on('order:updated', (updatedOrder: Order) => {
      console.log('📝 EMPLEADO - Evento order:updated recibido:', updatedOrder);
      
      setOrders(prevOrders => {
        const orderExists = prevOrders.some(order => order.id === updatedOrder.id);
        
        if (orderExists) {
          console.log('✅ Actualizando pedido existente');
          return prevOrders.map(order => 
            order.id === updatedOrder.id 
              ? { ...order, ...updatedOrder }
              : order
          );
        } else {
          console.log('⚠️ Pedido actualizado no está en mi lista');
          return prevOrders;
        }
      });

      const statusText = updatedOrder.status === 'completed' ? 'completado' : 
                        updatedOrder.status === 'cancelled' ? 'cancelado' : 'actualizado';
      
      setSuccess(`📱 Pedido ${statusText}`);
      setTimeout(() => setSuccess(''), 3000);
    });

    socketInstance.on('order:unassigned', (orderId: string) => {
      console.log('🔄 EMPLEADO - Evento order:unassigned recibido:', orderId);
      
      setOrders(prevOrders => 
        prevOrders.filter(order => order.id !== orderId)
      );
      
      setSuccess('Pedido reasignado a otro empleado');
      setTimeout(() => setSuccess(''), 3000);
    });

    socketInstance.on('order:deleted', (deletedOrderId: string) => {
      console.log('🗑️ EMPLEADO - Evento order:deleted recibido:', deletedOrderId);
      
      setOrders(prevOrders => 
        prevOrders.filter(order => order.id !== deletedOrderId)
      );
      
      setSuccess('Pedido eliminado');
      setTimeout(() => setSuccess(''), 3000);
    });

    socketInstance.on('test:message', (data) => {
      console.log('🧪 EMPLEADO - Test message recibido:', data);
      setSuccess(`🧪 Test: ${data.message}`);
      setTimeout(() => setSuccess(''), 3000);
    });

    return () => {
      console.log('🔌 EMPLEADO - Desconectando Socket.IO');
      socketInstance.disconnect();
    };
  }, [user?.id]);

  useEffect(() => {
    if (user && user.id) {
      void fetchOrders();
    }
  }, [user, filter, fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus): Promise<void> => {
    try {
      console.log('🔄 Empleado cambiando status:', orderId, '->', newStatus);
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );

      await updateOrderStatus(orderId, newStatus);
      
      const statusText = newStatus === 'completed' ? 'completado' : 
                        newStatus === 'cancelled' ? 'cancelado' : 'actualizado';
      
      setSuccess(`Pedido ${statusText} exitosamente`);
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('❌ Error updating order status:', err);
      setError('Error al actualizar el estado del pedido');
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

  const markNewOrdersAsSeen = () => {
    setNewOrdersCount(0);
  };

  const handleManualRefresh = async () => {
    console.log('🔄 Empleado: Actualización manual');
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
            Mis Pedidos Asignados
          </h2>
          
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
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>

          {/* FILTROS */}
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'all' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'pending' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'completed' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Completados
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'cancelled' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
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
          <div className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 border-t-4 border-b-4 border-green-500 rounded-full animate-spin"></div>
            <p className="text-gray-500">Cargando tus pedidos...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg font-medium">No tienes pedidos asignados</p>
              <p className="text-sm">
                {filter !== 'all' 
                  ? `No tienes pedidos ${filter === 'pending' ? 'pendientes' : filter === 'completed' ? 'completados' : 'cancelados'}`
                  : 'Espera a que el administrador te asigne pedidos'
                }
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Pedido #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-500">
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
                    <h4 className="mb-2 text-sm font-medium text-gray-500">Información del Cliente</h4>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Nombre:</span> {order.full_name}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Comprobante:</span> 
                      {order.payment_proof_url ? (
                        <span className="text-green-600 font-medium ml-1">✓ Subido</span>
                      ) : (
                        <span className="text-red-600 font-medium ml-1">✗ Sin comprobante</span>
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-500">Detalles del Pedido</h4>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Sabores:</span> {order.flavors?.join(', ') || 'No disponible'}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Dulzura:</span> {order.sweetness || 'No disponible'}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Machucado:</span> {order.crushed_type || 'No disponible'}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Paquete:</span> {order.package_type || 'No disponible'}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Monto:</span> {order.amount?.toFixed(2) || '0.00'} Bs
                    </p>
                    {order.notes && (
                      <p className="text-sm text-gray-700 mt-2">
                        <span className="font-medium">Notas:</span> {order.notes}
                      </p>
                    )}
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Comprobante de Pago</h3>
              <button
                onClick={handleCloseProof}
                className="text-gray-400 hover:text-gray-600 transition-colors"
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
                    <span className="ml-2 text-gray-700">Cargando imagen...</span>
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
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
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