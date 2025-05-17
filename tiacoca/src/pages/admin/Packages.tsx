import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { getAllPackages, createPackage, updatePackage, deletePackage } from '../../services/packages';

// Definición de interfaces
interface Package {
  id: string;
  price: number;
  weight: number;
  weight_unit: string;
  name: string;
}

interface PackageFormData {
  name: string;
  price: string;
  weight: string;
  weight_unit: string;
}

const Packages = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<Package | null>(null);
  
  const [formData, setFormData] = useState<PackageFormData>({
    name: '',
    price: '',
    weight: '',
    weight_unit: 'g'
  });

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await getAllPackages();
      setPackages(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleOpenModal = (pkg: Package | null = null): void => {
    if (pkg) {
      setIsEditing(true);
      setCurrentPackage(pkg);
      setFormData({
        name: pkg.name || '',
        price: pkg.price.toString(),
        weight: pkg.weight.toString(),
        weight_unit: pkg.weight_unit
      });
    } else {
      setIsEditing(false);
      setCurrentPackage(null);
      setFormData({
        name: '',
        price: '',
        weight: '',
        weight_unit: 'g'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = (): void => {
    setShowModal(false);
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    try {
      // Validación básica
      if (!formData.price.trim() || !formData.weight.trim()) {
        setError('Todos los campos son obligatorios');
        return;
      }

      const price = parseFloat(formData.price);
      const weight = parseFloat(formData.weight);

      if (isNaN(price) || price <= 0) {
        setError('El precio debe ser un número mayor que cero');
        return;
      }

      if (isNaN(weight) || weight <= 0) {
        setError('El peso debe ser un número mayor que cero');
        return;
      }

      setError('');
      
      const packageData = {
        name: formData.name,
        price: price,
        weight: weight,
        weight_unit: formData.weight_unit
      };
      
      if (isEditing && currentPackage) {
        await updatePackage(currentPackage.id, packageData);
        setSuccess('Paquete actualizado exitosamente');
      } else {
        await createPackage(packageData);
        setSuccess('Paquete creado exitosamente');
      }
      
      // Cerrar modal y actualizar lista
      setShowModal(false);
      void fetchData();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Error saving package:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar el paquete';
      setError(errorMessage);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este paquete?')) {
      try {
        await deletePackage(id);
        setSuccess('Paquete eliminado exitosamente');
        void fetchData();
        
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } catch (err) {
        console.error('Error deleting package:', err);
        setError('Error al eliminar el paquete');
      }
    }
  };

  // Formatea el precio para mostrar
  const formatPrice = (price: number): string => {
    return `${price.toFixed(2)} Bs`;
  };

  // Formatea el peso para mostrar
  const formatWeight = (weight: number, unit: string): string => {
    return `${weight} ${unit}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-white">Gestión de Paquetes</h2>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 text-white bg-primary-500 rounded-md hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700"
        >
          Nuevo Paquete
        </button>
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
          <div className="w-16 h-16 border-t-4 border-b-4 border-primary-500 rounded-full animate-spin dark:border-primary-400"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-300">
            <thead className="bg-gray-50 dark:bg-dark-300">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                  Nombre
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                  Precio
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                  Peso
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-dark-200 dark:divide-dark-300">
              {packages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No hay paquetes registrados.
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id} className="dark:hover:bg-dark-300">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{pkg.name || `Paquete ${pkg.id.slice(0, 8)}`}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{formatPrice(pkg.price)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{formatWeight(pkg.weight, pkg.weight_unit)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenModal(pkg)}
                        className="px-3 py-1 mr-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-500"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para crear/editar paquete */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-60" onClick={handleCloseModal}></div>
          <div className="w-full max-w-lg p-6 mx-4 bg-white dark:bg-dark-100 rounded-lg shadow-xl z-50 relative">
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
              {isEditing ? 'Editar Paquete' : 'Nuevo Paquete'}
            </h3>
            
            {error && (
              <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-700/20 dark:text-red-100">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre (opcional)
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej: Paquete pequeño"
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-black bg-white dark:text-white dark:bg-dark-300 dark:border-dark-400 dark:placeholder-gray-400"
                  />
                </div>
                
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Precio (Bs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    autoFocus
                    placeholder="Ej: 15.00"
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-black bg-white dark:text-white dark:bg-dark-300 dark:border-dark-400 dark:placeholder-gray-400"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Peso
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="weight"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej: 75"
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-black bg-white dark:text-white dark:bg-dark-300 dark:border-dark-400 dark:placeholder-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="weight_unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Unidad
                    </label>
                    <select
                      id="weight_unit"
                      name="weight_unit"
                      value={formData.weight_unit}
                      onChange={handleInputChange}
                      required
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-black bg-white dark:text-white dark:bg-dark-300 dark:border-dark-400"
                    >
                      <option value="g">gramos (g)</option>
                      <option value="kg">kilogramos (kg)</option>
                      <option value="ml">mililitros (ml)</option>
                      <option value="l">litros (l)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-dark-300 dark:text-gray-200 dark:border-dark-400 dark:hover:bg-dark-400"
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
      )}
    </div>
  );
};

export default Packages;