const { supabase } = require('../app');

// Obtener ventas por día
exports.getSalesByDay = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    // Calcular fecha de inicio (hace X días)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    const startDateISO = startDate.toISOString();
    
    // Obtener pedidos completados desde la fecha de inicio
    const { data: orders, error } = await supabase
      .from('orders')
      .select('created_at, amount')
      .eq('status', 'completed')
      .gte('created_at', startDateISO)
      .order('created_at', { ascending: true });
      
    if (error) {
      return res.status(400).json({ message: 'Error al obtener ventas', error: error.message });
    }
    
    // Generar array de fechas para los últimos X días
    const dateArray = [];
    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      dateArray.unshift(date.toISOString().split('T')[0]);
    }
    
    // Agrupar ventas por día
    const salesByDay = dateArray.map(day => {
      const dayOrders = orders.filter(order => 
        order.created_at.split('T')[0] === day
      ) || [];
      
      return {
        day,
        total: dayOrders.reduce((sum, order) => sum + (order.amount || 0), 0),
        count: dayOrders.length
      };
    });
    
    res.json(salesByDay);
  } catch (error) {
    console.error('Error en getSalesByDay:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener resumen de ventas
exports.getSalesSummary = async (req, res) => {
  try {
    // Obtener fecha actual
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    
    // Calcular fecha de inicio del mes
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfMonthISO = startOfMonth.toISOString();
    
    // Obtener pedidos del día
    const { data: todayOrders, error: todayError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', todayISO);
      
    if (todayError) {
      return res.status(400).json({ message: 'Error al obtener pedidos del día', error: todayError.message });
    }
    
    // Obtener pedidos del mes
    const { data: monthOrders, error: monthError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startOfMonthISO);
      
    if (monthError) {
      return res.status(400).json({ message: 'Error al obtener pedidos del mes', error: monthError.message });
    }
    
    // Calcular estadísticas
    const todayTotal = todayOrders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + (order.amount || 0), 0);
      
    const monthTotal = monthOrders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + (order.amount || 0), 0);
      
    const todayCompleted = todayOrders.filter(order => order.status === 'completed').length;
    const todayPending = todayOrders.filter(order => order.status === 'pending').length;
    const todayCancelled = todayOrders.filter(order => order.status === 'cancelled').length;
    
    const monthCompleted = monthOrders.filter(order => order.status === 'completed').length;
    const monthPending = monthOrders.filter(order => order.status === 'pending').length;
    const monthCancelled = monthOrders.filter(order => order.status === 'cancelled').length;
    
    res.json({
      today: {
        total: todayTotal,
        count: todayOrders.length,
        completed: todayCompleted,
        pending: todayPending,
        cancelled: todayCancelled
      },
      month: {
        total: monthTotal,
        count: monthOrders.length,
        completed: monthCompleted,
        pending: monthPending,
        cancelled: monthCancelled
      }
    });
  } catch (error) {
    console.error('Error en getSalesSummary:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener cierres de caja
exports.getCashierClosings = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const { data, error } = await supabase
      .from('cashier_closings')
      .select('*')
      .order('closing_date', { ascending: false })
      .limit(parseInt(limit));
      
    if (error) {
      return res.status(400).json({ message: 'Error al obtener cierres de caja', error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error en getCashierClosings:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Crear cierre de caja
exports.createCashierClosing = async (req, res) => {
  try {
    const { total_sales, total_orders, completed_orders, pending_orders, cancelled_orders, notes } = req.body;
    
    const { data, error } = await supabase
      .from('cashier_closings')
      .insert([{
        closing_date: new Date().toISOString(),
        total_sales,
        total_orders,
        completed_orders,
        pending_orders,
        cancelled_orders,
        notes
      }])
      .select();
      
    if (error) {
      return res.status(400).json({ message: 'Error al crear cierre de caja', error: error.message });
    }
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error en createCashierClosing:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener ventas por sabor
exports.getSalesByFlavor = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // Calcular fecha de inicio (hace X días)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    const startDateISO = startDate.toISOString();
    
    // Obtener pedidos completados desde la fecha de inicio
    const { data: orders, error } = await supabase
      .from('orders')
      .select('flavors')
      .eq('status', 'completed')
      .gte('created_at', startDateISO);
      
    if (error) {
      return res.status(400).json({ message: 'Error al obtener ventas por sabor', error: error.message });
    }
    
    // Contar ocurrencias de cada sabor
    const flavorCounts = {};
    
    orders.forEach(order => {
      if (order.flavors && Array.isArray(order.flavors)) {
        order.flavors.forEach(flavor => {
          flavorCounts[flavor] = (flavorCounts[flavor] || 0) + 1;
        });
      }
    });
    
    // Convertir a array para ordenar
    const flavorArray = Object.entries(flavorCounts).map(([name, count]) => ({
      name,
      count
    }));
    
    // Ordenar por cantidad (descendente)
    flavorArray.sort((a, b) => b.count - a.count);
    
    res.json(flavorArray);
  } catch (error) {
    console.error('Error en getSalesByFlavor:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};