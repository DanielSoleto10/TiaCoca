import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, getUser, isAuthenticated, verifyToken, logout } from '../services/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuth: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  setUser: (user: User | null) => void; // Añadida esta función
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuth: false,
  isAdmin: false,
  isEmployee: false,
  setUser: () => {}, // Añadida esta función
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          const isValid = await verifyToken();
          if (isValid) {
            setUser(getUser());
          }
        } catch (error) {
          console.error('Error verificando token:', error);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const value = {
    user,
    loading,
    isAuth: !!user,
    isAdmin: user?.role === 'admin',
    isEmployee: user?.role === 'employee',
    setUser, // Añadida esta función
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);