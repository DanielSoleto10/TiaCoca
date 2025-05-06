// src/components/ui/TextArea.tsx
interface TextAreaProps {
    id: string;
    name: string;
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    rows?: number;
    className?: string;
  }
  
  export const TextArea: React.FC<TextAreaProps> = ({
    id,
    name,
    label,
    placeholder,
    value,
    onChange,
    error,
    required = false,
    disabled = false,
    rows = 3,
    className = '',
  }) => {
    return (
      <div className={className}>
        {label && (
          <label htmlFor={id} className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-400 dark:border-dark-300 dark:text-white ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600'
          } ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-dark-300' : ''}`}
        />
        {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  };