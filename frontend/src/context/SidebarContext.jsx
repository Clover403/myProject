import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarCollapsed");
      return saved === "true";
    }
    return false;
  });

  const handleSetCollapsed = (value) => {
    const newValue = typeof value === "function" ? value(collapsed) : value;
    setCollapsed(newValue);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarCollapsed", String(newValue));
    }
  };

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed: handleSetCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};
