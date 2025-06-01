// src/components/admin/AdminLayout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Efecto para cargar la preferencia de tema del localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('tiacoca-theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Cambiar el tema claro/oscuro
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tiacoca-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tiacoca-theme', 'light');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-green-700 dark:bg-green-900 text-white transition-all duration-300 ease-in-out fixed h-full z-10`}>
        <div className="flex items-center justify-between p-4 border-b border-green-600 dark:border-green-700">
          <h2 className={`font-bold transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
            Tia Coca
          </h2>
          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleDarkMode} 
              className="p-1 rounded hover:bg-green-600 dark:hover:bg-green-800"
              title={darkMode ? "Modo claro" : "Modo oscuro"}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1 rounded hover:bg-green-600 dark:hover:bg-green-800"
            >
              {isSidebarOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {/* Links para Administrador */}
            {isAdmin && (
              <>
                <li className="mb-6">
                  <Link
                    to="/admin/dashboard"
                    className={`flex items-center p-2 rounded hover:bg-green-600 dark:hover:bg-green-800 transition-colors ${isActive('/admin/dashboard') ? 'bg-green-600 dark:bg-green-800' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    {isSidebarOpen && <span className="ml-3">Dashboard</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/employees"
                    className={`flex items-center p-2 rounded hover:bg-green-600 dark:hover:bg-green-800 transition-colors ${isActive('/admin/employees') ? 'bg-green-600 dark:bg-green-800' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {isSidebarOpen && <span className="ml-3">Empleados</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/packages"
                    className={`flex items-center p-2 rounded hover:bg-green-600 dark:hover:bg-green-800 transition-colors ${isActive('/admin/packages') ? 'bg-green-600 dark:bg-green-800' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M12 4h.01M12 16h.01M4 12h16m-8-8h8a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2V6a2 2 0 012-2z" />
                    </svg>
                    {isSidebarOpen && <span className="ml-3">Paquetes</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/categories"
                    className={`flex items-center p-2 rounded hover:bg-green-600 dark:hover:bg-green-800 transition-colors ${isActive('/admin/categories') ? 'bg-green-600 dark:bg-green-800' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {isSidebarOpen && <span className="ml-3">Categorías</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/flavors"
                    className={`flex items-center p-2 rounded hover:bg-green-600 dark:hover:bg-green-800 transition-colors ${isActive('/admin/flavors') ? 'bg-green-600 dark:bg-green-800' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    {isSidebarOpen && <span className="ml-3">Sabores</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/crushed-types"
                    className={`flex items-center p-2 rounded hover:bg-green-600 dark:hover:bg-green-800 transition-colors ${isActive('/admin/crushed-types') ? 'bg-green-600 dark:bg-green-800' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    {isSidebarOpen && <span className="ml-3">Tipos de Machucado</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/orders"
                    className={`flex items-center p-2 rounded hover:bg-green-600 dark:hover:bg-green-800 transition-colors ${isActive('/admin/orders') ? 'bg-green-600 dark:bg-green-800' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    {isSidebarOpen && <span className="ml-3">Pedidos</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/reports"
                    className={`flex items-center p-2 rounded hover:bg-green-600 dark:hover:bg-green-800 transition-colors ${isActive('/admin/reports') ? 'bg-green-600 dark:bg-green-800' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {isSidebarOpen && <span className="ml-3">Reportes</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/cashier"
                    className={`flex items-center p-2 rounded hover:bg-green-600 dark:hover:bg-green-800 transition-colors ${isActive('/admin/cashier') ? 'bg-green-600 dark:bg-green-800' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {isSidebarOpen && <span className="ml-3">Cierre de Caja</span>}
                  </Link>
                </li>
              </>
            )}

            {/* Links para Empleado */}
            {!isAdmin && (
              <>
                <li>
                  <Link
                    to="/employee/dashboard"
                    className={`flex items-center p-2 rounded hover:bg-green-600 dark:hover:bg-green-800 transition-colors ${isActive('/employee/dashboard') ? 'bg-green-600 dark:bg-green-800' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    {isSidebarOpen && <span className="ml-3">Dashboard</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/employee/orders"
                    className={`flex items-center p-2 rounded hover:bg-green-600 dark:hover:bg-green-800 transition-colors ${isActive('/employee/orders') ? 'bg-green-600 dark:bg-green-800' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    {isSidebarOpen && <span className="ml-3">Mis Pedidos</span>}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-green-600 dark:border-green-700">
          <button 
            onClick={handleLogout} 
            className="flex items-center w-full p-2 rounded hover:bg-green-600 dark:hover:bg-green-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isSidebarOpen && <span className="ml-3">Cerrar Sesión</span>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 overflow-auto ${isSidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow border-b dark:border-gray-700">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Tia Coca - {isAdmin ? 'Panel de Administración' : 'Panel de Empleado'}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {/* Usar el email en lugar de full_name para evitar el error */}
              {user?.email} ({isAdmin ? 'Admin' : 'Empleado'})
            </span>
          </div>
        </header>
        <main className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;