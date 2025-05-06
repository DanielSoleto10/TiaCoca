// src/components/ui/Select.tsx
interface SelectProps {
    id: string;
    name: string;
    label?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
    error?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
  }
  
  export const Select: React.FC<SelectProps> = ({
    id,
    name,
    label,
    value,
    onChange,
    options,
    error,
    required = false,
    disabled = false,
    className = '',
  }) => {
    return (
      <div className={className}>
        {label && (
          <label htmlFor={id} className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-400 dark:border-dark-300 dark:text-white ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600'
          } ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-dark-300' : ''}`}
        >
          <option value="">Seleccionar...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  };