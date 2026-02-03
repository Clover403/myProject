import React from "react";
import { useSelector } from "react-redux";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";

function LayoutContent({ children }) {
  const { user } = useSelector((state) => state.auth);
  const { collapsed } = useSidebar();

  // Check if user should see sidebar (admin or ethack)
  const hasSidebar = user?.role === "admin" || user?.role === "ethack";

  if (hasSidebar) {
    return (
      <div className="min-h-screen">
        <Sidebar />
        <div className={`transition-all duration-300 ${collapsed ? 'pl-16' : 'pl-64'}`}>
          {children}
        </div>
      </div>
    );
  }

  // Regular user layout with navbar
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function Layout({ children }) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}

export default Layout;
