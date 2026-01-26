import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuth } from "../redux/authSlice";
import { useTheme } from "../context/ThemeContext";
import { useSocket } from "../context/SocketContext";
import { useSidebar } from "../context/SidebarContext";
import {
  LayoutDashboard,
  Shield,
  Target,
  Scan,
  Bot,
  BookOpen,
  Package,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  User,
  MessageCircle,
  ShoppingBag,
  Briefcase,
} from "lucide-react";

function Sidebar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isDark, toggleTheme } = useTheme();
  const { collapsed, setCollapsed } = useSidebar();
  
  // Get socket context for unread messages
  const socketContext = useSocket();
  const unreadCount = socketContext?.unreadCount || 0;

  const handleLogout = () => {
    dispatch(clearAuth());
    navigate("/login", { replace: true });
  };

  // Navigation items based on role
  const getNavigationItems = () => {
    console.log('🔍 [Sidebar] Getting navigation items for user:', user?.email, 'role:', user?.role);
    console.log('🔍 [Sidebar] User object:', JSON.stringify(user, null, 2));
    
    const baseItems = [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Scans", path: "/scans", icon: Scan },
      { label: "Targets", path: "/targets", icon: Target },
      { label: "AI Copilot", path: "/ai", icon: Bot },
      { label: "OWASP Top 10", path: "/owasp-top-10", icon: BookOpen },
    ];

    const publicItems = [
      { label: "Products", path: "/products", icon: Package },
      { label: "Ethical Hackers", path: "/ethical-hackers", icon: Users },
    ];
    
    // Messaging & Orders section
    const messagingItems = [
      { type: "divider", label: "Communications" },
      { label: "Messages", path: "/chat", icon: MessageCircle, badge: unreadCount },
    ];
    
    // Order items based on role
    const orderItems = user?.role === "ethack"
      ? [{ label: "Incoming Orders", path: "/seller-orders", icon: Briefcase }]
      : [{ label: "My Orders", path: "/my-orders", icon: ShoppingBag }];

    if (user?.role === "admin") {
      console.log('👑 [Sidebar] Rendering ADMIN navigation');
      return [
        ...baseItems,
        { type: "divider", label: "Marketplace" },
        ...publicItems,
        ...messagingItems,
        ...orderItems,
        { type: "divider", label: "Admin Panel" },
        { label: "Manage Users", path: "/admin/users", icon: Users },
        { label: "Manage Products", path: "/admin/products", icon: Package },
      ];
    }

    if (user?.role === "ethack") {
      console.log('🛡️ [Sidebar] Rendering ETHACK navigation');
      return [
        ...baseItems,
        { type: "divider", label: "Marketplace" },
        ...publicItems,
        ...messagingItems,
        ...orderItems,
        { type: "divider", label: "My Services" },
        { label: "My Products", path: "/ethack/products", icon: Package },
      ];
    }

    console.log('👤 [Sidebar] Rendering USER (default) navigation');
    return [
      ...baseItems,
      { type: "divider", label: "Marketplace" },
      ...publicItems,
      ...messagingItems,
      ...orderItems,
    ];
  };

  const navigationItems = getNavigationItems();

  // Theme-based styles
  const sidebarBg = isDark ? "bg-[#0f1117]" : "bg-white";
  const borderColor = isDark ? "border-[#1a1d24]" : "border-gray-200";
  const textColor = isDark ? "text-gray-300" : "text-gray-700";
  const textMuted = isDark ? "text-gray-500" : "text-gray-400";
  const hoverBg = isDark ? "hover:bg-[#1a1d24]" : "hover:bg-gray-100";
  const activeBg = isDark ? "bg-[#1a1d24]" : "bg-gray-100";
  const activeText = "text-green-700";

  return (
    <aside
      className={`fixed left-0 top-0 h-screen ${sidebarBg} border-r ${borderColor} transition-all duration-300 z-40 flex flex-col ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b ${borderColor}`}>
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <img
            src="/file_000000001d206246bd4f17ee6a946aa9.png"
            alt="CloverGuard Logo"
            className="w-8 h-8 object-contain rounded-full flex-shrink-0"
          />
          {!collapsed && (
            <span className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"} tracking-tight`}>
              CloverGuard
            </span>
          )}
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navigationItems.map((item, index) => {
            if (item.type === "divider") {
              return (
                <li key={index} className="pt-4 pb-2">
                  {!collapsed && (
                    <span className={`px-3 text-xs font-semibold uppercase tracking-wider ${textMuted}`}>
                      {item.label}
                    </span>
                  )}
                  {collapsed && <div className={`border-t ${borderColor} mx-2`}></div>}
                </li>
              );
            }

            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={(e) => {
                    // Jika layar kecil (mobile), tutup sidebar saat navigasi
                    if (window.innerWidth < 768) {
                      setCollapsed(true);
                    }
                    // Jika sidebar di collapse (desktop), biarkan navigasi jalan tanpa expand
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative group ${
                      isActive
                        ? `${activeBg} ${activeText}`
                        : `${textColor} ${hoverBg}`
                    } ${collapsed ? "justify-center" : ""}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {/* Badge for collapsed state */}
                    {collapsed && item.badge > 0 && (
                      <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </div>
                  {!collapsed && (
                    <span className="text-sm font-medium flex-1 truncate">{item.label}</span>
                  )}
                  {/* Badge for expanded state */}
                  {!collapsed && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                  
                  {/* Tooltip on hover when collapsed */}
                  {collapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className={`p-2 border-t ${borderColor}`}>
        {/* User Info */}
        {user && !collapsed && (
          <div className={`flex items-center gap-3 px-3 py-2 mb-2 rounded-lg ${isDark ? "bg-[#1a1d24]" : "bg-gray-50"}`}>
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "bg-[#2a2e38]" : "bg-gray-200"}`}>
                <User className="w-4 h-4" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                {user.name}
              </p>
              <p className={`text-xs truncate ${textMuted}`}>
                {(() => {
                  console.log('🎭 [Sidebar Badge] user.role:', user.role);
                  console.log('🎭 [Sidebar Badge] Checking: admin?', user.role === "admin", 'ethack?', user.role === "ethack");
                  if (user.role === "admin") return "Administrator";
                  if (user.role === "ethack") return "Ethical Hacker";
                  return "User";
                })()}
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className={`flex ${collapsed ? "flex-col" : ""} gap-1`}>
          <button
            onClick={toggleTheme}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg ${textColor} ${hoverBg} transition-colors ${
              collapsed ? "w-full" : "flex-1"
            }`}
            title={isDark ? "Light Mode" : "Dark Mode"}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {!collapsed && <span className="text-sm">Theme</span>}
          </button>

          <button
            onClick={handleLogout}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors ${
              collapsed ? "w-full" : "flex-1"
            }`}
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 rounded-lg ${textColor} ${hoverBg} transition-colors`}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
