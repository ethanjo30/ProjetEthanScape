import React from "react";

export const Select = ({ children, onValueChange, ...props }) => (
  <div className="relative w-full">{children}</div>
);

export const SelectTrigger = ({ children, className = "", ...props }) => (
  <div className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white ${className}`} {...props}>
    {children}
  </div>
);

export const SelectValue = ({ placeholder }) => <span>{placeholder}</span>;

export const SelectContent = ({ children }) => (
  <div className="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-slate-800 bg-slate-950 text-white shadow-md">
    {children}
  </div>
);

export const SelectItem = ({ children, value, ...props }) => (
  <div className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-800" {...props}>
    {children}
  </div>
);