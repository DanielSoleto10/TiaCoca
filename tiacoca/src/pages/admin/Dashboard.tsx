import { useState, useEffect } from 'react';
import {
  getSalesSummary,
  getSalesByDay,
  getSalesByFlavor,
  SalesSummary,
  DailySales,
  FlavorSales,
} from '../../services/reports';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Registrar componentes de ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

const Dashboard = () => {
  /* ---------- Estados tipados ---------- */
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<SalesSummary>({
    today: { total: 0, count: 0, completed: 0, pending: 0, cancelled: 0 },
    month: { total: 0, count: 0, completed: 0, pending: 0, cancelled: 0 },
  });
  const [salesByDay, setSalesByDay] = useState<DailySales[]>([]);
  const [salesByFlavor, setSalesByFlavor] = useState<FlavorSales[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const summaryData = await getSalesSummary();
        setSummary(summaryData);

        const salesByDayData = await getSalesByDay(7);
        setSalesByDay(salesByDayData);

        const salesByFlavorData = await getSalesByFlavor(30);
        setSalesByFlavor(salesByFlavorData);
      } catch (err) {
        console.error(err);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  /* ---------- Gráficos ---------- */
  const salesByDayChart = {
    labels: salesByDay.map((d) =>
      new Date(d.day).toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
      }),
    ),
    datasets: [
      {
        label: 'Ventas (Bs)',
        data: salesByDay.map((d) => d.total),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
      },
    ],
  };

  const salesByFlavorChart = {
    labels: salesByFlavor.slice(0, 5).map((f) => f.name),
    datasets: [
      {
        label: 'Cantidad',
        data: salesByFlavor.slice(0, 5).map((f) => f.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const orderStatusChart = {
    labels: ['Completados', 'Pendientes', 'Cancelados'],
    datasets: [
      {
        data: [
          summary.today.completed,
          summary.today.pending,
          summary.today.cancelled,
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  /* ---------- Render ---------- */
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-t-4 border-b-4 border-green-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Tarjetas */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Summary title="Ventas Hoy" value={`${summary.today.total.toFixed(2)} Bs`} color="green" />
            <Summary title="Pedidos Hoy" value={summary.today.count} color="blue" />
            <Summary title="Ventas Mes" value={`${summary.month.total.toFixed(2)} Bs`} color="green" />
            <Summary title="Pedidos Mes" value={summary.month.count} color="blue" />
          </div>

          {/* Gráficos */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Ventas por Día">
              <Line data={salesByDayChart} options={{ responsive: true, maintainAspectRatio: false }} />
            </ChartCard>
            <ChartCard title="Estado Pedidos (Hoy)">
              <Pie data={orderStatusChart} options={{ responsive: true, maintainAspectRatio: false }} />
            </ChartCard>
            <ChartCard title="Sabores Más Vendidos" full>
              <Bar data={salesByFlavorChart} options={{ responsive: true, maintainAspectRatio: false }} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
};

/* ---------- Auxiliares ---------- */
const Summary = ({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: 'green' | 'blue';
}) => (
  <div className="p-6 bg-white rounded-lg shadow">
    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
    <p className={`mt-2 text-3xl font-bold text-${color}-600`}>{value}</p>
  </div>
);

const ChartCard = ({
  title,
  full = false,
  children,
}: {
  title: string;
  full?: boolean;
  children: React.ReactNode;
}) => (
  <div className={`p-6 bg-white rounded-lg shadow ${full ? 'lg:col-span-2' : ''}`}>
    <h3 className="mb-4 text-lg font-medium text-gray-900">{title}</h3>
    <div className="relative h-64">{children}</div>
  </div>
);

export default Dashboard;