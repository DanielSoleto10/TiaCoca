// src/components/ui/Alert.tsx
interface AlertProps {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    onClose?: () => void;
  }
  
  export const Alert: React.FC<AlertProps> = ({ 
    type, 
    message, 
    onClose 
  }) => {
    const typeClasses = {
      success: 'bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900',
      error: 'bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-900',
    };
  
    return (
      <div className={`p-4 mb-4 rounded-lg flex items-center justify-between ${typeClasses[type]}`}>
        <span>{message}</span>
        {onClose && (
          <button 
            onClick={onClose} 
            className="text-sm hover:bg-opacity-20 hover:bg-gray-900 p-1 rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    );
  };