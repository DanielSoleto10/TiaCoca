// src/components/ui/Modal.tsx
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
  }
  
  export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
  }) => {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" aria-hidden="true" onClick={onClose}></div>
  
          <div className="relative z-10 w-full max-w-lg p-6 mx-auto overflow-hidden text-left align-bottom transition-all transform bg-white dark:bg-dark-100 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white" id="modal-title">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 rounded-full hover:text-gray-500 dark:text-gray-300 dark:hover:text-white"
              >
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-2">{children}</div>
            {footer && <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">{footer}</div>}
          </div>
        </div>
      </div>
    );
  };