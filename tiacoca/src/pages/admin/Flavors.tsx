import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { getAllFlavors, createFlavor, updateFlavor, deleteFlavor } from '../../services/flavors';
import { getAllCategories } from '../../services/categories';

// Definición de interfaces
interface Flavor {
  id: string;
  name: string;
  category_id: string;
  categories?: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

interface FlavorFormData {
  name: string;
  category_id: string;
}

const Flavors = () => {
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFlavor, setCurrentFlavor] = useState<Flavor | null>(null);
  
  const [formData, setFormData] = useState<FlavorFormData>({
    name: '',
    category_id: ''
  });

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const [flavorsData, categoriesData] = await Promise.all([
        getAllFlavors() as Promise<Flavor[]>,
        getAllCategories() as Promise<Category[]>
      ]);
      setFlavors(flavorsData);
      setCategories(categoriesData);
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

  const handleOpenModal = (flavor: Flavor | null = null): void => {
    if (flavor) {
      setIsEditing(true);
      setCurrentFlavor(flavor);
      setFormData({
        name: flavor.name || '',
        category_id: flavor.category_id || ''
      });
    } else {
      setIsEditing(false);
      setCurrentFlavor(null);
      setFormData({
        name: '',
        category_id: categories.length > 0 ? categories[0].id : ''
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
      setError('');
      
      const flavorData = {
        name: formData.name,
        category_id: formData.category_id
      };
      
      if (isEditing && currentFlavor) {
        // Actualizar sabor existente
        await updateFlavor(currentFlavor.id, flavorData);
        setSuccess('Sabor actualizado exitosamente');
      } else {
        // Crear nuevo sabor
        await createFlavor(flavorData);
        setSuccess('Sabor creado exitosamente');
      }
      
      // Cerrar modal y actualizar lista
      setShowModal(false);
      void fetchData();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Error saving flavor:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar el sabor';
      setError(errorMessage);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este sabor?')) {
      try {
        await deleteFlavor(id);
        setSuccess('Sabor eliminado exitosamente');
        void fetchData();
        
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } catch (err) {
        console.error('Error deleting flavor:', err);
        setError('Error al eliminar el sabor');
      }
    }
  };

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'No disponible';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-white">Gestión de Sabores</h2>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 text-white bg-primary-500 rounded-md hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700"
        >
          Nuevo Sabor
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
                  Categoría
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-dark-200 dark:divide-dark-300">
              {flavors.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No hay sabores registrados.
                  </td>
                </tr>
              ) : (
                flavors.map((flavor) => (
                  <tr key={flavor.id} className="dark:hover:bg-dark-300">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{flavor.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {flavor.categories?.name || getCategoryName(flavor.category_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenModal(flavor)}
                        className="px-3 py-1 mr-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(flavor.id)}
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

      {/* Modal para crear/editar sabor */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-60" onClick={handleCloseModal}></div>
          <div className="w-full max-w-lg p-6 mx-4 bg-white dark:bg-dark-100 rounded-lg shadow-xl z-50 relative">
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
              {isEditing ? 'Editar Sabor' : 'Nuevo Sabor'}
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
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    autoFocus
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-black bg-white dark:text-white dark:bg-dark-300 dark:border-dark-400 dark:placeholder-gray-400"
                  />
                </div>
                
                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Categoría
                  </label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-black bg-white dark:text-white dark:bg-dark-300 dark:border-dark-400"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
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

export default Flavors;