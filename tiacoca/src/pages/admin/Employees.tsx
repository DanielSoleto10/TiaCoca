import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  type User,
  type CreateUserData,
} from '../../services/users';

/* --------- Tipos auxiliares --------- */
interface FormData extends Omit<CreateUserData, 'role'> {
  role: 'employee' | 'admin';
}

/* ==================================== */
const Employees = () => {
  /* ---------- Estado ---------- */
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<User | null>(null);

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    fullName: '',
    birthDate: '',
    identityCard: '',
    role: 'employee',
  });

  /* ---------- Cargar empleados ---------- */
  useEffect(() => {
    void fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setEmployees(data);
    } catch {
      setError('Error al cargar los empleados');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Handlers ---------- */
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (emp?: User) => {
    if (emp) {
      setIsEditing(true);
      setCurrentEmployee(emp);
      setFormData({
        email: emp.email,
        password: '',
        fullName: emp.full_name ?? '',
        birthDate: emp.birth_date ? emp.birth_date.split('T')[0] : '',
        identityCard: emp.identity_card ?? '',
        role: emp.role,
      });
    } else {
      setIsEditing(false);
      setCurrentEmployee(null);
      setFormData({
        email: '',
        password: '',
        fullName: '',
        birthDate: '',
        identityCard: '',
        role: 'employee',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (isEditing && currentEmployee) {
        await updateUser(currentEmployee.id, {
          full_name: formData.fullName,
          birth_date: formData.birthDate,
          identity_card: formData.identityCard,
          role: formData.role,
        });
        setSuccess('Empleado actualizado');
      } else {
        if (!formData.password) {
          setError('La contraseña es obligatoria');
          return;
        }
        await createUser({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          birthDate: formData.birthDate,
          identityCard: formData.identityCard,
          role: formData.role,
        });
        setSuccess('Empleado creado');
      }

      setShowModal(false);
      void fetchEmployees();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setError(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este empleado?')) return;
    try {
      await deleteUser(id);
      setSuccess('Empleado eliminado');
      void fetchEmployees();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Error al eliminar el empleado');
    }
  };

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('es-BO') : '—';

  /* ---------- Render ---------- */
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestión de Empleados</h2>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
        >
          Nuevo Empleado
        </button>
      </header>

      {error && <Alert color="red" message={error} />}
      {success && <Alert color="green" message={success} />}

      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <TH>Nombre</TH>
                <TH>Email</TH>
                <TH>Cédula</TH>
                <TH>Nacimiento</TH>
                <TH>Rol</TH>
                <TH>Acciones</TH>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No hay empleados registrados.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id}>
                    <TD>{emp.full_name ?? '—'}</TD>
                    <TD>{emp.email}</TD>
                    <TD>{emp.identity_card ?? '—'}</TD>
                    <TD>{fmt(emp.birth_date)}</TD>
                    <TD>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${emp.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}
                      >
                        {emp.role === 'admin' ? 'Administrador' : 'Empleado'}
                      </span>
                    </TD>
                    <TD>
                      <button
                        onClick={() => handleOpenModal(emp)}
                        className="px-3 py-1 mr-2 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="px-3 py-1 text-xs text-white bg-red-600 rounded-md hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </TD>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <EmployeeModal
          isEditing={isEditing}
          formData={formData}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

/* ---------- UI aux ---------- */
const Alert = ({ color, message }: { color: 'red' | 'green'; message: string }) => (
  <div className={`p-4 text-sm rounded-lg ${color === 'red' ? 'text-red-700 bg-red-100' : 'text-green-700 bg-green-100'}`}>{message}</div>
);

const Spinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-16 h-16 border-t-4 border-b-4 border-green-500 rounded-full animate-spin" />
  </div>
);

const TH: React.FC<React.PropsWithChildren> = ({ children }) => (
  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">{children}</th>
);

const TD: React.FC<React.PropsWithChildren> = ({ children }) => (
  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{children}</td>
);

/* ---------- Input Component ---------- */
interface InputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  disabled = false,
  required = false,
}) => (
  <div className="mb-4">
    <label htmlFor={name} className="block mb-2 text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
    />
  </div>
);

/* ---------- Modal ---------- */
interface ModalProps {
  isEditing: boolean;
  formData: FormData;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

const EmployeeModal: React.FC<ModalProps> = ({ isEditing, formData, onChange, onSubmit, onClose }) => (
  <div className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto bg-black/30">
    <div className="w-full max-w-lg p-6 mx-4 bg-white rounded-lg shadow-xl">
      <h3 className="mb-4 text-lg font-medium text-gray-900">{isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input 
          label="Email" 
          name="email" 
          type="email" 
          value={formData.email} 
          onChange={onChange} 
          disabled={isEditing} 
          required 
        />
        
        {!isEditing && (
          <Input 
            label="Contraseña" 
            name="password" 
            type="password" 
            value={formData.password} 
            onChange={onChange} 
            required 
          />
        )}
        
        <Input 
          label="Nombre Completo" 
          name="fullName" 
          value={formData.fullName} 
          onChange={onChange} 
          required 
        />
        
        <Input 
          label="Cédula de Identidad" 
          name="identityCard" 
          value={formData.identityCard} 
          onChange={onChange} 
        />
        
        <Input 
          label="Fecha de Nacimiento" 
          name="birthDate" 
          type="date" 
          value={formData.birthDate} 
          onChange={onChange} 
        />
        
        <div className="mb-4">
          <label htmlFor="role" className="block mb-2 text-sm font-medium text-gray-700">
            Rol
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="employee">Empleado</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            {isEditing ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default Employees;