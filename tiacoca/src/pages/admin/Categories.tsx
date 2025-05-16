import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import type { Category } from '../../services/categories';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../../services/categories';

/* ──────────────────────────────────────────────── */
const Categories = () => {
  /* ── Estados ──────────────────────────────── */
  const [categories, setCategories]   = useState<Category[]>([]);
  const [loading,    setLoading]      = useState<boolean>(true);
  const [error,      setError]        = useState<string>('');
  const [success,    setSuccess]      = useState<string>('');

  const [showModal,      setShowModal]       = useState<boolean>(false);
  const [isEditing,      setIsEditing]       = useState<boolean>(false);
  const [currentCategory,setCurrentCategory] = useState<Category | null>(null);
  const [categoryName,   setCategoryName]    = useState<string>('');

  /* ── Cargar lista ─────────────────────────── */
  useEffect(() => { void fetchCategories(); }, []);

  const fetchCategories = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await getAllCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  /* ── Modal ─────────────────────────────────── */
  const handleOpenModal = (category?: Category): void => {
    if (category) {
      setIsEditing(true);
      setCurrentCategory(category);
      setCategoryName(category.name);
    } else {
      setIsEditing(false);
      setCurrentCategory(null);
      setCategoryName('');
    }
    setShowModal(true);
  };

  const handleCloseModal = (): void => {
    setShowModal(false);
    setError('');
  };

  /* ── Input Change Handler ─────────────────── */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value;
    setCategoryName(newValue);
  };

  /* ── Guardar ───────────────────────────────── */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      setError('El nombre de la categoría es obligatorio');
      return;
    }

    try {
      setError('');
      if (isEditing && currentCategory) {
        await updateCategory(currentCategory.id, categoryName);
        setSuccess('Categoría actualizada exitosamente');
      } else {
        await createCategory(categoryName);
        setSuccess('Categoría creada exitosamente');
      }

      setShowModal(false);
      await fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la categoría';
      console.error(err);
      setError(msg);
    }
  };

  /* ── Eliminar ──────────────────────────────── */
  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('¿Eliminar esta categoría? (también se borrarán sus sabores)')) return;

    try {
      await deleteCategory(id);
      setSuccess('Categoría eliminada exitosamente');
      await fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Error al eliminar la categoría');
    }
  };

  /* ── Render ─────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-white">Gestión de Categorías</h2>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 text-white bg-primary-500 rounded-md hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700">
          Nueva Categoría
        </button>
      </div>

      {/* Mensajes */}
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

      {/* Tabla / Loader */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-t-4 border-b-4 border-primary-500 rounded-full animate-spin dark:border-primary-400" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-300">
            <thead className="bg-gray-50 dark:bg-dark-300">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-300">
                  Nombre
                </th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-300">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200 dark:bg-dark-200 dark:divide-dark-300">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No hay categorías registradas.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="dark:hover:bg-dark-300">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">{cat.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenModal(cat)}
                        className="px-3 py-1 mr-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600">
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-500">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-60" onClick={handleCloseModal}></div>
          <div className="w-full max-w-lg p-6 mx-4 bg-white dark:bg-dark-100 rounded-lg shadow-xl z-50 relative">
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
              {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
            </h3>

            {error && (
              <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-700/20 dark:text-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="categoryName" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre de la Categoría
                </label>
                <input
                  id="categoryName"
                  value={categoryName}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 mb-6 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-black bg-white dark:text-white dark:bg-dark-300 dark:border-dark-400 dark:placeholder-gray-400"
                  required
                  autoFocus
                  placeholder="Nombre de la categoría"
                />
                {/* Se eliminó la línea "Valor actual" */}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-dark-300 dark:text-gray-200 dark:border-dark-400 dark:hover:bg-dark-400">
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700">
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

export default Categories;