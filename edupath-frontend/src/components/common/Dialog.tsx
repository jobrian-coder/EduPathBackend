import { useEffect } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  widthClassName?: string;
}

export const Dialog = ({
  title,
  isOpen,
  onClose,
  children,
  widthClassName = 'max-w-lg',
}: DialogProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div
        className={`relative w-full ${widthClassName} rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {title && (
          <h2 id="dialog-title" className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
        )}

        {children}
      </div>
    </div>
  );
};

export default Dialog;
