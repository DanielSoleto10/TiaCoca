// src/components/ui/Table.tsx 
interface TableProps {
    headers: string[];
    children: React.ReactNode;
    className?: string;
  }
  
  export const Table: React.FC<TableProps> = ({ 
    headers, 
    children, 
    className = '' 
  }) => {
    return (
      <div className={`overflow-x-auto ${className}`}>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-dark-400">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-dark-300 dark:divide-gray-700">
            {children}
          </tbody>
        </table>
      </div>
    );
  };
  
  export const TableRow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-dark-400">{children}</tr>;
  };
  
  export const TableCell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-gray-200">{children}</td>;
  };