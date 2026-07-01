import React from "react";

export const Select = ({ children, onValueChange, value }) => {
  return <div className="relative w-full">{React.Children.map(children, child => 
    React.cloneElement(child, { onValueChange, value }))}</div>;
};

export const SelectTrigger = ({ children, className = "" }) => (
  <div className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white ${className}`}>
    {children}
  </div>
);

export const SelectValue = ({ placeholder, value }) => <span>{value || placeholder}</span>;
export const SelectContent = ({ children }) => <div className="mt-1 border border-slate-700 bg-slate-800 rounded-md p-1">{children}</div>;
export const SelectItem = ({ value, children, onValueChange }) => (
  <div 
    onClick={() => onValueChange && onValueChange(value)}
    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm text-white hover:bg-slate-700 outline-none"
  >
    {children}
  </div>
);