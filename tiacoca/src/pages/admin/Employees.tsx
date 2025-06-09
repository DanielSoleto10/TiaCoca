import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  setUserPassword,
  clearTempPassword,
  type User,
  type CreateUserData,
} from '../../services/users';

interface FormData extends Omit<CreateUserData, 'role'> {
  role: 'employee' | 'admin';
}

const Employees = () => {
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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  // Generar contraseña automática
  const handleGeneratePassword = async (employee: User) => {
    if (!confirm(`¿Generar nueva contraseña automática para ${employee.full_name}?`)) return;
    
    try {
      await resetUserPassword(employee.id);
      setSuccess('Contraseña generada exitosamente');
      void fetchEmployees();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al generar contraseña';
      setError(msg);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Establecer contraseña personalizada
  const handleSetCustomPassword = async (employee: User) => {
    const newPassword = prompt(`Nueva contraseña para ${employee.full_name}:\n(Mínimo 6 caracteres)`);
    if (!newPassword) return;

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      await setUserPassword(employee.id, { password: newPassword });
      setSuccess('Contraseña personalizada establecida');
      void fetchEmployees();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al establecer contraseña';
      setError(msg);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Ocultar contraseña temporal
  const handleHidePassword = async (employee: User) => {
    try {
      await clearTempPassword(employee.id);
      setSuccess('Contraseña ocultada');
      void fetchEmployees();
      setTimeout(() => setSuccess(''), 2000);
    } catch {
      setError('Error al ocultar contraseña');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Copiar al portapapeles
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Contraseña copiada al portapapeles');
      setTimeout(() => setSuccess(''), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setSuccess('Contraseña copiada al portapapeles');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  // Verificar si la contraseña es reciente (últimas 24 horas)
  const isPasswordRecent = (passwordDate: string) => {
    const now = new Date();
    const created = new Date(passwordDate);
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  const formatDateTime = (isoDate: string) => {
    return new Date(isoDate).toLocaleString('es-BO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-white">Gestión de Empleados</h2>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 text-white bg-primary-500 rounded-md hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700"
        >
          Nuevo Empleado
        </button>
      </header>

      {error && <Alert color="red" message={error} />}
      {success && <Alert color="green" message={success} />}

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-300">
              <thead className="bg-gray-50 dark:bg-dark-300">
                <tr>
                  <TH>Nombre</TH>
                  <TH>Email</TH>
                  <TH>Cédula</TH>
                  <TH>Rol</TH>
                  <TH>🔑 Contraseña</TH>
                  <TH>Acciones</TH>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-dark-200 dark:divide-dark-300">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No hay empleados registrados.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id} className="dark:hover:bg-dark-300">
                      <TD>{emp.full_name ?? '—'}</TD>
                      <TD>{emp.email}</TD>
                      <TD>{emp.identity_card ?? '—'}</TD>
                      <TD>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          emp.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {emp.role === 'admin' ? 'Administrador' : 'Empleado'}
                        </span>
                      </TD>
                      
                      {/* Columna de contraseña */}
                      <TD>
                        {emp.role === 'employee' ? (
                          <div className="flex flex-col gap-2">
                            {emp.temp_password && emp.password_created_at && isPasswordRecent(emp.password_created_at) ? (
                              // Mostrar contraseña reciente
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <code className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-mono border">
                                    {emp.temp_password}
                                  </code>
                                  <button
                                    onClick={() => copyToClipboard(emp.temp_password!)}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                    title="Copiar contraseña"
                                  >
                                    📋
                                  </button>
                                  <button
                                    onClick={() => handleHidePassword(emp)}
                                    className="text-gray-500 hover:text-gray-700 text-sm"
                                    title="Ocultar contraseña"
                                  >
                                    👁️‍🗨️
                                  </button>
                                </div>
                                <div className="text-xs text-green-600">
                                  Creada: {formatDateTime(emp.password_created_at)}
                                </div>
                              </div>
                            ) : (
                              // Contraseña oculta o antigua
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-sm">••••••••</span>
                                <button
                                  onClick={() => handleGeneratePassword(emp)}
                                  className="text-yellow-600 hover:text-yellow-800 text-xs px-2 py-1 border border-yellow-300 rounded"
                                  title="Generar contraseña automática"
                                >
                                  🔄 Auto
                                </button>
                                <button
                                  onClick={() => handleSetCustomPassword(emp)}
                                  className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded"
                                  title="Establecer contraseña personalizada"
                                >
                                  ✏️ Custom
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TD>

                      <TD>
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => handleOpenModal(emp)}
                            className="px-3 py-1 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id)}
                            className="px-3 py-1 text-xs text-white bg-red-500 rounded-md hover:bg-red-700"
                          >
                            Eliminar
                          </button>
                        </div>
                      </TD>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Información importante */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-800">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-blue-500 text-lg">ℹ️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Gestión de Contraseñas
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>🔄 Auto:</strong> Genera contraseñas automáticas como "RapidoCoca1234"</li>
                    <li><strong>✏️ Custom:</strong> Te permite establecer una contraseña personalizada</li>
                    <li><strong>⏰ Visibilidad:</strong> Las contraseñas son visibles por 24 horas después de crearlas</li>
                    <li><strong>🔒 Seguridad:</strong> Se almacenan encriptadas en el sistema de autenticación</li>
                    <li><strong>👁️‍🗨️ Ocultar:</strong> Puedes ocultar manualmente las contraseñas antes de las 24h</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
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

// Componentes auxiliares
const Alert = ({ color, message }: { color: 'red' | 'green'; message: string }) => (
  <div className={`p-4 text-sm rounded-lg ${
    color === 'red' 
      ? 'text-red-700 bg-red-100 dark:bg-red-700/20 dark:text-red-100' 
      : 'text-green-700 bg-green-100 dark:bg-green-700/20 dark:text-green-100'
  }`}>
    {message}
  </div>
);

const Spinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-16 h-16 border-t-4 border-b-4 border-primary-500 rounded-full animate-spin dark:border-primary-400" />
  </div>
);

const TH: React.FC<React.PropsWithChildren> = ({ children }) => (
  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-300">
    {children}
  </th>
);

const TD: React.FC<React.PropsWithChildren> = ({ children }) => (
  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-white">
    {children}
  </td>
);

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
    <label htmlFor={name} className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
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
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black bg-white dark:text-white dark:bg-dark-300 dark:border-dark-400 dark:placeholder-gray-400"
    />
  </div>
);

interface ModalProps {
  isEditing: boolean;
  formData: FormData;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

const EmployeeModal: React.FC<ModalProps> = ({ isEditing, formData, onChange, onSubmit, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
    <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-60" onClick={onClose}></div>
    <div className="w-full max-w-lg p-6 mx-4 bg-white dark:bg-dark-100 rounded-lg shadow-xl z-50 relative">
      <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
        {isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}
      </h3>
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
            label="Contraseña Inicial" 
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
          <label htmlFor="role" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Rol
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black bg-white dark:text-white dark:bg-dark-300 dark:border-dark-400"
          >
            <option value="employee">Empleado</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-dark-300 dark:text-gray-200 dark:hover:bg-dark-400"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-primary-500 rounded-md hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700"
          >
            {isEditing ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default Employees;