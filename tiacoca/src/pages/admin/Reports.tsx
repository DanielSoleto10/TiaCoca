import { useState, useEffect, useCallback } from 'react';
import { getSalesByDay, getSalesByFlavor, getSalesSummary, getSalesByMonth, getDetailedSales, getFlavorsByMonth } from '../../services/reports';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Interfaz para jsPDF con autoTable
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

// Definición de interfaces
interface DailySales {
  day: string;
  total: number;
  count: number;
}

interface FlavorSales {
  name: string;
  count: number;
}

interface SalesSummary {
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

// Nuevas interfaces para Excel
interface MonthlySales {
  month: string;
  year: number;
  total: number;
  count: number;
  completed: number;
  pending: number;
  cancelled: number;
}

interface DetailedSale {
  id: string;
  date: string;
  user_name: string;
  total: number;
  status: string;
  flavors: string[];
}

interface FlavorByMonth {
  month: string;
  flavor_name: string;
  count: number;
}

// Registrar componentes de ChartJS
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [salesByDay, setSalesByDay] = useState<DailySales[]>([]);
  const [salesByFlavor, setSalesByFlavor] = useState<FlavorSales[]>([]);
  const [summary, setSummary] = useState<SalesSummary>({
    today: {
      total: 0,
      count: 0,
      completed: 0,
      pending: 0,
      cancelled: 0
    },
    month: {
      total: 0,
      count: 0,
      completed: 0,
      pending: 0,
      cancelled: 0
    }
  });
  
  const [dateRange, setDateRange] = useState(7); // Días para mostrar en el gráfico de ventas por día
  const [flavorRange, setFlavorRange] = useState(30); // Días para mostrar en el gráfico de sabores

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener resumen de ventas
      const summaryData = await getSalesSummary();
      setSummary(summaryData as SalesSummary);
      
      // Obtener ventas por día
      const salesByDayData = await getSalesByDay(dateRange);
      setSalesByDay(salesByDayData as DailySales[]);
      
      // Obtener ventas por sabor
      const salesByFlavorData = await getSalesByFlavor(flavorRange);
      setSalesByFlavor(salesByFlavorData as FlavorSales[]);
      
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError('Error al cargar los datos de reportes');
    } finally {
      setLoading(false);
    }
  }, [dateRange, flavorRange]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      if (showDropdown) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDropdown]);

  // Datos para el gráfico de ventas por día
  const salesByDayChart = {
    labels: salesByDay.map(item => {
      const date = new Date(item.day);
      return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Ventas (Bs)',
        data: salesByDay.map(item => item.total),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      },
      {
        label: 'Cantidad de Pedidos',
        data: salesByDay.map(item => item.count),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        tension: 0.1,
        yAxisID: 'y1'
      }
    ]
  };

  // Datos para el gráfico de ventas por sabor
  const salesByFlavorChart = {
    labels: salesByFlavor.slice(0, 10).map(item => item.name),
    datasets: [
      {
        label: 'Cantidad',
        data: salesByFlavor.slice(0, 10).map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
          'rgba(83, 102, 255, 0.6)',
          'rgba(78, 252, 154, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
          'rgba(78, 252, 154, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Datos para el gráfico de estado de pedidos
  const orderStatusChart = {
    labels: ['Completados', 'Pendientes', 'Cancelados'],
    datasets: [
      {
        data: [summary.month.completed, summary.month.pending, summary.month.cancelled],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const generateSalesReport = () => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    
    // Título
    doc.setFontSize(18);
    doc.text('Reporte de Ventas', 14, 20);
    
    // Fecha
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 30);
    
    // Resumen
    doc.text('Resumen de Ventas', 14, 40);
    
    // Tabla de resumen
    autoTable(doc, {
      startY: 45,
      head: [['Período', 'Total Ventas', 'Pedidos Completados', 'Pedidos Pendientes', 'Pedidos Cancelados']],
      body: [
        ['Hoy', `${summary.today.total.toFixed(2)} Bs`, summary.today.completed, summary.today.pending, summary.today.cancelled],
        ['Este Mes', `${summary.month.total.toFixed(2)} Bs`, summary.month.completed, summary.month.pending, summary.month.cancelled]
      ],
    });
    
    // Ventas por día
    const finalY1 = doc.lastAutoTable.finalY || 45;
    doc.text('Ventas por Día', 14, finalY1 + 10);
    
    autoTable(doc, {
      startY: finalY1 + 15,
      head: [['Fecha', 'Total Ventas', 'Cantidad de Pedidos']],
      body: salesByDay.map(item => [
        new Date(item.day).toLocaleDateString('es-ES'),
        `${item.total.toFixed(2)} Bs`,
        item.count
      ]),
    });
    
    // Sabores más vendidos
    const finalY2 = doc.lastAutoTable.finalY || finalY1 + 15;
    doc.text('Sabores Más Vendidos', 14, finalY2 + 10);
    
    autoTable(doc, {
      startY: finalY2 + 15,
      head: [['Sabor', 'Cantidad']],
      body: salesByFlavor.slice(0, 10).map(item => [
        item.name,
        item.count
      ]),
    });
    
    // Guardar PDF
    doc.save(`reporte_ventas_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.pdf`);
    
    setSuccess('Reporte generado exitosamente');
    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };

  const generateExcelReport = async () => {
    try {
      setLoading(true);
      
      // Obtener datos para Excel
      const [monthlySalesData, detailedSalesData, flavorsByMonthData] = await Promise.all([
        getSalesByMonth() as Promise<MonthlySales[]>,
        getDetailedSales() as Promise<DetailedSale[]>,
        getFlavorsByMonth() as Promise<FlavorByMonth[]>
      ]);
      
      // Crear libro de Excel
      const workbook = XLSX.utils.book_new();
      
      // Hoja 1: Resumen Mensual
      const monthlySheet = XLSX.utils.json_to_sheet(
        monthlySalesData.map(item => ({
          'Mes': item.month,
          'Año': item.year,
          'Total Ventas (Bs)': item.total.toFixed(2),
          'Pedidos Completados': item.completed,
          'Pedidos Pendientes': item.pending,
          'Pedidos Cancelados': item.cancelled,
          'Promedio por Pedido': item.count > 0 ? (item.total / item.count).toFixed(2) : '0.00'
        }))
      );
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Resumen Mensual');
      
      // Hoja 2: Detalle de Ventas
      const detailedSheet = XLSX.utils.json_to_sheet(
        detailedSalesData.map(item => ({
          'Fecha': new Date(item.date).toLocaleDateString('es-ES'),
          'Usuario/Cliente': item.user_name,
          'Total Venta (Bs)': item.total.toFixed(2),
          'Estado': item.status === 'completed' ? 'Completado' : 
                   item.status === 'pending' ? 'Pendiente' : 'Cancelado',
          'Sabores': item.flavors.join(', ')
        }))
      );
      XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detalle de Ventas');
      
      // Hoja 3: Sabores por Mes
      const flavorsSheet = XLSX.utils.json_to_sheet(
        flavorsByMonthData.map(item => ({
          'Mes': item.month,
          'Sabor': item.flavor_name,
          'Cantidad Vendida': item.count
        }))
      );
      XLSX.utils.book_append_sheet(workbook, flavorsSheet, 'Sabores por Mes');
      
      // Generar y descargar archivo
      const fileName = `reporte_ventas_completo_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      setSuccess('Reporte Excel generado exitosamente');
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (error) {
      console.error('Error generando Excel:', error);
      setError('Error al generar el reporte Excel');
      setTimeout(() => {
        setError('');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reportes</h2>
        
        {/* Dropdown de reportes */}
        <div className="relative inline-block">
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Botón clickeado, showDropdown:', !showDropdown);
              setShowDropdown(!showDropdown);
            }}
            className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center space-x-2 transition-colors"
          >
            <span>Generar Reporte</span>
            <svg className={`w-5 h-5 transform transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Dropdown Menu */}
          {showDropdown && (
            <div 
              className="absolute right-0 mt-2 w-48 bg-green-600 dark:bg-green-700 rounded-md shadow-xl z-[9999] border border-green-500 dark:border-green-600 overflow-hidden"
              style={{ position: 'absolute', top: '100%', right: 0 }}
            >
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('PDF clickeado');
                    generateSalesReport();
                    setShowDropdown(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generar PDF
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Excel clickeado');
                    generateExcelReport();
                    setShowDropdown(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Generar Excel
                </button>
              </div>
            </div>
          )}
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
        <>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Ventas Hoy</h3>
              <p className="mt-2 text-3xl font-bold text-green-600">{summary.today.total.toFixed(2)} Bs</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Pedidos Hoy</h3>
              <p className="mt-2 text-3xl font-bold text-blue-600">{summary.today.count}</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Ventas del Mes</h3>
              <p className="mt-2 text-3xl font-bold text-green-600">{summary.month.total.toFixed(2)} Bs</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Pedidos del Mes</h3>
              <p className="mt-2 text-3xl font-bold text-blue-600">{summary.month.count}</p>
            </div>
          </div>
          
          {/* Gráfico de ventas por día */}
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Ventas por Día</h3>
              <div className="flex items-center space-x-2">
                <label htmlFor="dateRange" className="text-sm text-gray-600">Mostrar últimos:</label>
                <select
                  id="dateRange"
                  value={dateRange}
                  onChange={(e) => setDateRange(parseInt(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="7">7 días</option>
                  <option value="14">14 días</option>
                  <option value="30">30 días</option>
                  <option value="90">90 días</option>
                </select>
              </div>
            </div>
            <div className="h-80">
              <Line 
                data={salesByDayChart} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Ventas (Bs)'
                      },
                      ticks: {
                        callback: function(value) {
                          return value + ' Bs';
                        }
                      }
                    },
                    y1: {
                      beginAtZero: true,
                      position: 'right',
                      title: {
                        display: true,
                        text: 'Cantidad de Pedidos'
                      },
                      grid: {
                        drawOnChartArea: false
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
          
          {/* Gráficos de sabores y estado de pedidos */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Gráfico de sabores más vendidos */}
            <div className="p-6 bg-white rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Sabores Más Vendidos</h3>
                <div className="flex items-center space-x-2">
                  <label htmlFor="flavorRange" className="text-sm text-gray-600">Período:</label>
                  <select
                    id="flavorRange"
                    value={flavorRange}
                    onChange={(e) => setFlavorRange(parseInt(e.target.value))}
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="7">Última semana</option>
                    <option value="30">Último mes</option>
                    <option value="90">Últimos 3 meses</option>
                    <option value="365">Último año</option>
                  </select>
                </div>
              </div>
              <div className="h-80">
                <Bar 
                  data={salesByFlavorChart} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }}
                />
              </div>
            </div>
            
            {/* Gráfico de estado de pedidos */}
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Estado de Pedidos (Este Mes)</h3>
              <div className="flex items-center justify-center h-80">
                <Pie 
                  data={orderStatusChart} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Tabla de resumen de ventas por día */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Detalle de Ventas por Día</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Total Ventas
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Cantidad de Pedidos
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Promedio por Pedido
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesByDay.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(item.day).toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.total.toFixed(2)} Bs</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.count}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.count > 0 ? (item.total / item.count).toFixed(2) : '0.00'} Bs
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;