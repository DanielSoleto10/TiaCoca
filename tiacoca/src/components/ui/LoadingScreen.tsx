// src/components/ui/LoadingScreen.tsx
import React from 'react';
import { Spinner } from './Spinner';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-dark-200">
      <div className="flex flex-col items-center">
        <Spinner size="lg" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Cargando...</h3>
      </div>
    </div>
  );
};