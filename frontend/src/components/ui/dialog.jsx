import React from "react";

export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-lg animate-in fade-in zoom-in duration-200">
        {children}
      </div>
    </div>
  );
};

export const DialogContent = ({ children, className = "" }) => (
  <div className={`relative border border-slate-800 bg-slate-900 p-6 shadow-lg sm:rounded-lg ${className}`}>
    {children}
  </div>
);

export const DialogHeader = ({ children }) => <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">{children}</div>;
export const DialogTitle = ({ children }) => <h2 className="text-lg font-semibold text-white">{children}</h2>;
export const DialogFooter = ({ children }) => <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6">{children}</div>;