import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  const menuRef = useRef(null);

  const navigationLinks = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Scans", path: "/scans" },
    { label: "Targets", path: "/targets" },
    { label: "AI Copilot", path: "/ai" },
    { label: "OWASP Top 10", path: "/owasp-top-10" },
  ];

  const handleLogout = () => {
    // Clear Redux auth state
    dispatch(clearAuth());
    // Redirect to login
    navigate("/login", { replace: true });
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileMenuOpen]);

  const menuPanelClasses = isDark
    ? "bg-[#151822] border border-[#1f2330] shadow-xl"
    : "bg-white border border-gray-200 shadow-2xl";

  const linkClasses = isDark
    ? "text-gray-300 hover:text-[#3ecf8e] hover:bg-[#1f2330]"
    : "text-gray-700 hover:text-[#3ecf8e] hover:bg-gray-100";

  const dividerClass = isDark ? "border-[#1f2330]" : "border-gray-200";
  const primaryTextClass = isDark ? "text-gray-100" : "text-gray-900";
  const secondaryTextClass = isDark ? "text-gray-500" : "text-gray-500";

  return (
    <nav className="sticky top-0 z-50 bg-[#0f1117]/90 backdrop-blur-md border-b border-[#1a1d24]">
      {/* Container utama, max-w-7xl, dipusatkan, dan memiliki padding horizontal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Flex container: Logo Kiri, Navigasi/User Kanan */}
        <div className="flex justify-between items-center h-16">
          
          {/* Logo (Rata Kiri) */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition"
          >
            <img 
              src="/file_000000001d206246bd4f17ee6a946aa9.png" 
              alt="CloverGuard Logo" 
              className="w-8 h-8 object-contain rounded-full"
            />
            <span className="text-xl font-semibold text-gray-100 tracking-tight">
              CloverSecurity
            </span>
          </Link>

          {/* Toolbar kanan */}
          <div className="relative flex items-center gap-2" ref={menuRef}>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-[#1a1d24] hover:bg-[#2a2e38] text-gray-400 hover:text-[#3ecf8e] transition-colors"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              className="p-2 rounded-lg hover:bg-[#1a1d24] transition"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-300" />
              )}
            </button>
            {mobileMenuOpen && (
              <div
                className={`fixed right-4 top-16 w-72 rounded-xl overflow-hidden ${menuPanelClasses}`}
              >
                {user && (
                  <div className={`flex items-center gap-3 px-4 py-3 border-b ${dividerClass}`}>
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#3ecf8e]/40"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#3ecf8e]/20 flex items-center justify-center border border-[#3ecf8e]/40">
                        <span className="text-sm font-semibold text-[#3ecf8e]">
                          {user?.name?.charAt(0)?.toUpperCase() || "C"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${primaryTextClass}`}>
                        {user?.name || "Clover User"}
                      </p>
                      <p className={`text-xs truncate ${secondaryTextClass}`}>
                        {user?.email || "secure@clover.ai"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="py-2">
                  {navigationLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center justify-between px-4 py-2 text-sm font-medium transition ${linkClasses}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className={`border-t ${dividerClass}`}>
                  <button
                    onClick={toggleTheme}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium transition ${linkClasses}`}
                  >
                    <span>Switch Theme</span>
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                </div>

                {token && (
                  <div className={`border-t ${dividerClass}`}>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                    >
                      Logout
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;