// src/components/ui/Badge.tsx
interface BadgeProps {
    variant: 'success' | 'warning' | 'danger' | 'info' | 'default';
    children: React.ReactNode;
  }
  
  export const Badge: React.FC<BadgeProps> = ({ variant, children }) => {
    const variants = {
      success: 'bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900',
      danger: 'bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-900',
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
  
    return (
      <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${variants[variant]}`}>
        {children}
      </span>
    );
  };