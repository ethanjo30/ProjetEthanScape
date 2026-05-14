import React, { useState, createContext, useContext } from "react";

const TabsContext = createContext();

export const Tabs = ({ defaultValue, children, className = "" }) => {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = "" }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-slate-800 p-1 text-slate-400 ${className}`}>
    {children}
  </div>
);

export const TabsTrigger = ({ value, children, className = "" }) => {
  const { value: activeValue, setValue } = useContext(TabsContext);
  const isActive = activeValue === value;
  return (
    <button
      onClick={() => setValue(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
        isActive ? "bg-slate-950 text-white shadow" : "hover:text-slate-200"
      } ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, className = "" }) => {
  const { value: activeValue } = useContext(TabsContext);
  if (activeValue !== value) return null;
  return <div className={`mt-2 ${className}`}>{children}</div>;
};