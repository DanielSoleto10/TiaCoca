import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    // Si necesitas redireccionar después del logout, puedes usar navigate aquí
    // navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-green-800 text-white transition-all duration-300 ease-in-out`}>
        <div className="flex items-center justify-between p-4 border-b border-green-700">
          <h2 className={`font-bold ${isSidebarOpen ? 'block' : 'hidden'}`}>
            {isAdmin ? 'Panel Admin' : 'Panel Empleado'}
          </h2>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 rounded hover:bg-green-700">
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
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link 
                to={isAdmin ? "/admin/dashboard" : "/employee/dashboard"} 
                className={`flex items-center p-2 rounded hover:bg-green-700 ${isActive(isAdmin ? '/admin/dashboard' : '/employee/dashboard') ? 'bg-green-700' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {isSidebarOpen && <span className="ml-3">Dashboard</span>}
              </Link>
            </li>
            
            {isAdmin && (
              <>
                <li>
                  <Link 
                    to="/admin/employees" 
                    className={`flex items-center p-2 rounded hover:bg-green-700 ${isActive('/admin/employees') ? 'bg-green-700' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {isSidebarOpen && <span className="ml-3">Empleados</span>}
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/categories" 
                    className={`flex items-center p-2 rounded hover:bg-green-700 ${isActive('/admin/categories') ? 'bg-green-700' : ''}`}
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
                    className={`flex items-center p-2 rounded hover:bg-green-700 ${isActive('/admin/flavors') ? 'bg-green-700' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    {isSidebarOpen && <span className="ml-3">Sabores</span>}
                  </Link>
                </li>
              </>
            )}
            
            <li>
              <Link 
                to={isAdmin ? "/admin/orders" : "/employee/orders"} 
                className={`flex items-center p-2 rounded hover:bg-green-700 ${isActive(isAdmin ? '/admin/orders' : '/employee/orders') ? 'bg-green-700' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                {isSidebarOpen && <span className="ml-3">Pedidos</span>}
              </Link>
            </li>
            
            {isAdmin && (
              <>
                <li>
                  <Link 
                    to="/admin/reports" 
                    className={`flex items-center p-2 rounded hover:bg-green-700 ${isActive('/admin/reports') ? 'bg-green-700' : ''}`}
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
                    className={`flex items-center p-2 rounded hover:bg-green-700 ${isActive('/admin/cashier') ? 'bg-green-700' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {isSidebarOpen && <span className="ml-3">Cierre de Caja</span>}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-green-700">
          <button 
            onClick={handleLogout} 
            className="flex items-center w-full p-2 rounded hover:bg-green-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isSidebarOpen && <span className="ml-3">Cerrar Sesión</span>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="flex items-center justify-between p-4 bg-white shadow">
          <h1 className="text-xl font-semibold">Coca Order App - {isAdmin ? 'Panel de Administración' : 'Panel de Empleado'}</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.name} ({isAdmin ? 'Admin' : 'Empleado'})</span>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;