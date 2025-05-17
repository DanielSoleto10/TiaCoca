import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import AdminLayout from './components/admin/AdminLayout';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import Employees from './pages/admin/Employees';
import Categories from './pages/admin/Categories';
import Flavors from './pages/admin/Flavors';
import AdminOrders from './pages/admin/Orders';
import Reports from './pages/admin/Reports';
import Cashier from './pages/admin/Cashier';
import Packages from './pages/admin/Packages';

// Employee pages
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeOrders from './pages/employee/Orders';

// Rutas protegidas
const ProtectedRoute: React.FC<{ 
  element: React.ReactNode; 
  allowedRoles?: ('admin' | 'employee')[];
}> = ({ element, allowedRoles }) => {
  const { isAuth, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-t-4 border-b-4 border-green-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!isAuth) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} />;
  }
  
  return <>{element}</>;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />
        
        {/* Rutas de administrador */}
        <Route path="/admin" element={
          <ProtectedRoute element={<AdminLayout />} allowedRoles={['admin']} />
        }>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="categories" element={<Categories />} />
          <Route path="flavors" element={<Flavors />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="reports" element={<Reports />} />
          <Route path="cashier" element={<Cashier />} />
          <Route path="packages" element={<Packages />} />
        </Route>
        
        {/* Rutas de empleado */}
        <Route path="/employee" element={
          <ProtectedRoute element={<AdminLayout />} allowedRoles={['employee', 'admin']} />
        }>
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="orders" element={<EmployeeOrders />} />
        </Route>
        
        {/* Redirecciones */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;