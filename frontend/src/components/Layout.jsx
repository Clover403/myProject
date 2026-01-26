import React from "react";
import { useSelector } from "react-redux";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";

function LayoutContent({ children }) {
  const { user } = useSelector((state) => state.auth);
  const { collapsed } = useSidebar();

  console.log('🎨 [Layout] Rendering with user:', user?.email, 'role:', user?.role);

  // Check if user should see sidebar (admin or ethack)
  const hasSidebar = user?.role === "admin" || user?.role === "ethack";

  console.log('🎨 [Layout] hasSidebar:', hasSidebar, '(admin or ethack)');
  console.log('🎨 [Layout] collapsed:', collapsed);

  if (hasSidebar) {
    console.log('✅ [Layout] Showing SIDEBAR layout for role:', user?.role);
    return (
      <div className="min-h-screen">
        <Sidebar />
        <div className={`transition-all duration-300 ${collapsed ? 'pl-16' : 'pl-64'}`}>
          {children}
        </div>
      </div>
    );
  }

  console.log('📄 [Layout] Showing REGULAR layout for role:', user?.role);
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
