import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, actions }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface border border-white/10 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        {title && (
          <div className="flex justify-between items-center p-6 border-b border-white/5">
            <h2 className="text-xl font-bold text-white bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">{title}</h2>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-white transition-colors text-2xl leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {actions && (
          <div className="flex gap-3 p-6 border-t border-white/5 justify-end bg-surface-container-low/30">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
