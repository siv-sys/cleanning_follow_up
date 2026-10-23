import React from 'react';

export interface ToastData {
  title: string;
  subtitle: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 left-4 right-4 max-w-md mx-auto z-50 flex items-center gap-3 p-4 rounded-xl bg-[#131b2e] text-white shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-6"
    >
      <span
        className="material-symbols-outlined text-[#6ffbbe] text-[24px] flex-shrink-0"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        check_circle
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{toast.title}</p>
        <p className="text-xs text-[#bec6e0] truncate">{toast.subtitle}</p>
      </div>
      <button
        onClick={onClose}
        className="text-[#bec6e0] hover:text-white p-1 rounded-md transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
};
