import { useState, useEffect, ChangeEvent } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import  {
  getSalesSummary,
  getCashierClosings,
  createCashierClosing,
  CashierClosing,
  SalesSummary,
} from '../../services/reports';

/* ---------- Tipos auxiliares ---------- */
interface NewClosingPayload
  extends Omit<CashierClosing, 'id' | 'closing_date' | 'notes'> {
  notes?: string;
}

interface PdfWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

/* ====================================== */
const Cashier = () => {
  /* --- Estado ---- */
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [closings, setClosings] = useState<CashierClosing[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* --- Cargar datos ---- */
  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [s, c] = await Promise.all([
        getSalesSummary(),
        getCashierClosings(5),
      ]);

      setSummary(s);
      setClosings(c);
    } catch (err) {
      console.error(err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  /* --- Cerrar caja ---- */
  const handleCloseCashier = async () => {
    if (!summary) return;
    try {
      const payload: NewClosingPayload = {
        total_sales: summary.today.total,
        total_orders: summary.today.count,
        completed_orders: summary.today.completed,
        pending_orders: summary.today.pending,
        cancelled_orders: summary.today.cancelled,
        notes: note || undefined,
      };

      const newClosing = await createCashierClosing(payload);

      setSuccess('Cierre realizado');
      setShowModal(false);
      setNote('');
      void fetchData();
      generatePdf(newClosing);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Error al cerrar la caja');
    }
  };

  /* --- PDF ---- */
  const generatePdf = (closing: CashierClosing) => {
    const doc: PdfWithAutoTable = new jsPDF() as PdfWithAutoTable;

    doc.setFontSize(18);
    doc.text('Reporte de Cierre de Caja', 14, 20);

    doc.setFontSize(12);
    doc.text(
      `Fecha: ${new Date(closing.closing_date).toLocaleDateString('es-BO')}`,
      14,
      30,
    );

    autoTable(doc, {
      startY: 40,
      head: [['Concepto', 'Valor']],
      body: [
        ['Total Ventas', `${closing.total_sales.toFixed(2)} Bs`],
        ['Pedidos Totales', closing.total_orders],
        ['Completados', closing.completed_orders],
        ['Pendientes', closing.pending_orders],
        ['Cancelados', closing.cancelled_orders],
      ],
    });

    if (closing.notes) {
      const y = doc.lastAutoTable?.finalY ?? 40;
      doc.text('Notas:', 14, y + 10);
      doc.setFontSize(10);
      doc.text(closing.notes, 14, y + 20);
    }

    doc.save(`cierre_${closing.id}.pdf`);
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  /* ---------- UI ---------- */
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cierre de Caja</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
        >
          Realizar Cierre
        </button>
      </header>

      {error && <Alert color="red">{error}</Alert>}
      {success && <Alert color="green">{success}</Alert>}

      {loading || !summary ? (
        <Spinner />
      ) : (
        <>
          {/* Tarjetas resumen */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card title="Total Ventas Hoy" value={`${summary.today.total.toFixed(2)} Bs`} />
            <Card title="Completados Hoy" value={summary.today.completed} />
            <Card title="Pendientes Hoy" value={summary.today.pending} accent="yellow" />
          </div>

          {/* Tabla de cierres */}
          <section className="p-6 mt-6 bg-white rounded-lg shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Cierres Anteriores</h3>
            {closings.length === 0 ? (
              <p className="text-gray-500">No hay cierres registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <TH>Fecha</TH>
                      <TH>Total Ventas</TH>
                      <TH>Completados</TH>
                      <TH>Notas</TH>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {closings.map(cl => (
                      <tr key={cl.id}>
                        <TD>{fmt(cl.closing_date)}</TD>
                        <TD>{cl.total_sales.toFixed(2)} Bs</TD>
                        <TD>{cl.completed_orders}</TD>
                        <TD>{cl.notes ?? '—'}</TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {showModal && summary && (
        <Modal
          summary={summary.today}
          note={note}
          onChange={e => setNote(e.target.value)}
          onConfirm={handleCloseCashier}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

/* ---------- Sub-componentes ---------- */
const Alert: React.FC<{ color: 'red' | 'green'; children: string }> = ({
  color,
  children,
}) => (
  <div
    className={`p-4 text-sm rounded-lg ${
      color === 'red'
        ? 'text-red-700 bg-red-100'
        : 'text-green-700 bg-green-100'
    }`}
  >
    {children}
  </div>
);

const Spinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-16 h-16 border-t-4 border-b-4 border-green-500 rounded-full animate-spin" />
  </div>
);

const Card = ({
  title,
  value,
  accent = 'green',
}: {
  title: string;
  value: string | number;
  accent?: 'green' | 'yellow';
}) => (
  <div className="p-6 bg-white rounded-lg shadow">
    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
    <p
      className={`mt-2 text-3xl font-bold ${
        accent === 'green' ? 'text-green-600' : 'text-yellow-600'
      }`}
    >
      {value}
    </p>
  </div>
);

const TH: React.FC<React.PropsWithChildren> = ({ children }) => (
  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">
    {children}
  </th>
);

const TD: React.FC<React.PropsWithChildren> = ({ children }) => (
  <td className="px-6 py-4 whitespace-nowrap">
    <span className="text-sm text-gray-900">{children}</span>
  </td>
);

interface ModalProps {
  summary: SalesSummary['today'];
  note: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const Modal: React.FC<ModalProps> = ({
  summary,
  note,
  onChange,
  onConfirm,
  onCancel,
}) => (
  <div className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto bg-black/30">
    <div className="w-full max-w-lg p-6 mx-4 bg-white rounded-lg shadow-xl">
      <h3 className="mb-4 text-lg font-medium text-gray-900">Confirmar Cierre</h3>

      <label className="block mb-1 text-sm font-medium text-gray-700">
        Notas (opcional)
      </label>
      <textarea
        rows={3}
        value={note}
        onChange={onChange}
        className="block w-full px-3 py-2 mb-4 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
      />

      <ul className="mb-6 space-y-1 text-sm text-gray-700">
        <li>Total Ventas: {summary.total.toFixed(2)} Bs</li>
        <li>Completados: {summary.completed}</li>
        <li>Pendientes: {summary.pending}</li>
      </ul>

      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
        >
          Confirmar Cierre
        </button>
      </div>
    </div>
  </div>
);

export default Cashier;
