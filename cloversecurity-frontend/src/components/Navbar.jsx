import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuth } from "../redux/authSlice";
import { LogOut, Menu, X, Shield, Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    // Clear Redux auth state
    dispatch(clearAuth());
    // Redirect to login
    navigate("/login", { replace: true });
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0f1117]/90 backdrop-blur-md border-b border-[#1a1d24]">
      {/* Container utama, max-w-7xl, dipusatkan, dan memiliki padding horizontal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Flex container: Logo Kiri, Navigasi/User Kanan */}
        <div className="flex justify-between items-center h-16"> 
          
          {/* Logo (Rata Kiri) */}
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition"
            onClick={() => navigate("/dashboard")}
          >
            <div className="p-2 rounded-lg bg-[#3ecf8e]/10 border border-[#3ecf8e]/20">
              <Shield className="w-5 h-5 text-[#3ecf8e]" />
            </div>
            <span className="text-xl font-semibold text-gray-100 tracking-tight">
              CloverSecurity
            </span>
          </div>

          {/* Desktop Navigation, User Info, dan Logout (Rata Kanan) */}
          <div className="hidden md:flex items-center gap-8"> 
             
            {/* Navigasi Link */}
            {[
              { name: "Dashboard", href: "/dashboard" },
              { name: "Scans", href: "/scans" },
              { name: "Targets", href: "/targets" },
            ].map((link, i) => (
              <a
                key={i}
                href={link.href}
                className="text-gray-400 hover:text-[#3ecf8e] font-medium transition-colors"
              >
                {link.name}
              </a>
            ))}

            {/* User Info + Logout + Theme Toggle */}
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1a1d24] hover:bg-[#25272e] transition">
                    {user.picture ? (
                      <img
                        src={user.picture}
                        // alt={user.name}
                        className="w-9 h-9 rounded-full object-cover border border-[#3ecf8e]/30"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#3ecf8e]/20 flex items-center justify-center border border-[#3ecf8e]/30">
                        <span className="text-xs font-semibold text-[#3ecf8e]">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-100 leading-tight">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 leading-tight">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-lg bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] hover:bg-[#3ecf8e]/20 hover:border-[#3ecf8e]/40 transition-all flex items-center gap-2 text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              )}
              
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-[#1a1d24] hover:bg-[#2a2e38] text-gray-400 hover:text-[#3ecf8e] transition-colors"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            </div>
            
          </div>

          {/* Mobile Menu Button (Rata Kanan pada Mobile) */}
          <button
            className="md:hidden p-2 hover:bg-[#1a1d24] rounded-lg transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-300" />
            ) : (
              <Menu className="w-6 h-6 text-gray-300" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-[#1a1d24]">
            <div className="space-y-2">
              {["Dashboard", "Scans", "Targets"].map((item, i) => (
                <a
                  key={i}
                  href={`/${item.toLowerCase()}`}
                  className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-[#1a1d24] hover:text-[#3ecf8e] transition"
                >
                  {item}
                </a>
              ))}
              
              {/* Theme Toggle for Mobile */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:bg-[#1a1d24] hover:text-[#3ecf8e] transition"
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    Dark Mode
                  </>
                )}
              </button>
              
              {user && (
                <div className="px-4 py-4 border-t border-[#1a1d24] space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1d24]">
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#3ecf8e]/30"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#3ecf8e]/20 flex items-center justify-center border border-[#3ecf8e]/30">
                        <span className="text-sm font-semibold text-[#3ecf8e]">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-100">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] hover:bg-[#3ecf8e]/20 hover:border-[#3ecf8e]/40 transition-all font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;