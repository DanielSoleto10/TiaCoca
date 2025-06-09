import { supabase } from '../app.js';

// Obtener ventas por día
export const getSalesByDay = async (req, res) => {
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
export const getSalesSummary = async (req, res) => {
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
export const getCashierClosings = async (req, res) => {
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
export const createCashierClosing = async (req, res) => {
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
export const getSalesByFlavor = async (req, res) => {
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

// ============ NUEVAS FUNCIONES PARA EXCEL ============

// Obtener ventas por mes
export const getSalesByMonth = async (req, res) => {
  try {
    console.log('=== DEBUG getSalesByMonth ===');
    
    // Primero, vamos a contar cuántos registros hay en total
    const { count, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total de registros en la tabla orders: ${count}`);
    
    // Obtener TODOS los pedidos usando múltiples consultas si es necesario
    let allOrders = [];
    let currentOffset = 0;
    const batchSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data: batch, error } = await supabase
        .from('orders')
        .select('created_at, amount, status')
        .order('created_at', { ascending: true })
        .range(currentOffset, currentOffset + batchSize - 1);
        
      if (error) {
        console.error('Error al obtener lote de pedidos:', error);
        break;
      }
      
      if (!batch || batch.length === 0) {
        hasMore = false;
      } else {
        allOrders = allOrders.concat(batch);
        currentOffset += batchSize;
        console.log(`Lote ${Math.ceil(currentOffset / batchSize)}: ${batch.length} registros. Total acumulado: ${allOrders.length}`);
        
        // Si el lote es menor que batchSize, ya no hay más datos
        if (batch.length < batchSize) {
          hasMore = false;
        }
      }
    }
    
    console.log(`Total pedidos obtenidos después de paginación: ${allOrders.length}`);
    
    if (allOrders.length > 0) {
      console.log(`Fecha más antigua: ${allOrders[0].created_at}`);
      console.log(`Fecha más reciente: ${allOrders[allOrders.length - 1].created_at}`);
    }
    
    // Agrupar por mes
    const monthlyData = {};
    
    allOrders.forEach((order, index) => {
      const date = new Date(order.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Solo mostrar los primeros 5 y últimos 5 logs para no saturar
      if (index < 5 || index >= allOrders.length - 5) {
        console.log(`[${index}] Procesando pedido de fecha: ${order.created_at} -> mes: ${monthKey}`);
      }
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          year: date.getFullYear(),
          total: 0,
          count: 0,
          completed: 0,
          pending: 0,
          cancelled: 0
        };
      }
      
      // Contar todos los pedidos
      monthlyData[monthKey].count += 1;
      
      // Sumar solo ventas completadas al total
      if (order.status === 'completed') {
        monthlyData[monthKey].total += parseFloat(order.amount) || 0;
        monthlyData[monthKey].completed += 1;
      } else if (order.status === 'pending') {
        monthlyData[monthKey].pending += 1;
      } else if (order.status === 'cancelled') {
        monthlyData[monthKey].cancelled += 1;
      }
    });
    
    const result = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    
    console.log('=== RESUMEN POR MESES ===');
    result.forEach(month => {
      console.log(`${month.month}: ${month.count} pedidos, ${month.completed} completados, total: ${month.total}`);
    });
    
    console.log(`Total de meses encontrados: ${result.length}`);
    
    res.json(result);
  } catch (error) {
    console.error('Error en getSalesByMonth:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener ventas detalladas - CORREGIDO para usar full_name de orders
export const getDetailedSales = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = supabase
      .from('orders')
      .select(`
        id,
        created_at,
        amount,
        status,
        flavors,
        full_name
      `)
      .order('created_at', { ascending: false });
    
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    
    const { data: orders, error } = await query;
    
    if (error) {
      return res.status(400).json({ message: 'Error al obtener ventas detalladas', error: error.message });
    }
    
    const result = orders.map(order => ({
      id: order.id,
      date: order.created_at,
      user_name: order.full_name || 'Cliente sin nombre',
      total: order.amount || 0,
      status: order.status,
      flavors: order.flavors || []
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Error en getDetailedSales:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener sabores por mes
export const getFlavorsByMonth = async (req, res) => {
  try {
    console.log('=== DEBUG getFlavorsByMonth ===');
    
    // Obtener pedidos con sabores
    const { data: orders, error } = await supabase
      .from('orders')
      .select('created_at, flavors')
      .eq('status', 'completed')
      .not('flavors', 'is', null)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error al obtener pedidos:', error);
      return res.status(400).json({ message: 'Error al obtener sabores por mes', error: error.message });
    }
    
    console.log(`Pedidos con sabores encontrados: ${orders.length}`);
    
    // Mostrar algunos ejemplos de flavors para debug
    orders.slice(0, 3).forEach((order, index) => {
      console.log(`Ejemplo ${index + 1} - flavors:`, order.flavors, typeof order.flavors);
    });
    
    const monthlyFlavors = {};
    
    orders.forEach(order => {
      if (order.flavors && Array.isArray(order.flavors)) {
        const date = new Date(order.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        // Los flavors ya son nombres (strings), no necesitamos conversión
        order.flavors.forEach(flavorName => {
          if (flavorName && typeof flavorName === 'string') {
            const key = `${monthKey}_${flavorName}`;
            if (!monthlyFlavors[key]) {
              monthlyFlavors[key] = {
                month: monthKey,
                flavor_name: flavorName,
                count: 0
              };
            }
            monthlyFlavors[key].count += 1;
          }
        });
      }
    });
    
    const result = Object.values(monthlyFlavors).sort((a, b) => {
      if (a.month === b.month) {
        return b.count - a.count; // Ordenar por cantidad dentro del mismo mes
      }
      return a.month.localeCompare(b.month); // Ordenar por mes
    });
    
    console.log(`Sabores procesados: ${result.length}`);
    console.log('Primeros 5 sabores:', result.slice(0, 5));
    
    res.json(result);
  } catch (error) {
    console.error('Error en getFlavorsByMonth:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};