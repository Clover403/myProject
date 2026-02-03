import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { verifyToken } from "./redux/authSlice";
import Dashboard from "./pages/Dashboard";
import NewScan from "./pages/NewScan";
import ScanList from "./pages/ScanList";
import ScanDetail from "./pages/ScanDetail";
import Targets from "./pages/Targets";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import AIChat from "./pages/AIChat";
import OwaspTop10 from "./pages/OwaspTop10";
import LandingPage from "./pages/LandingPage";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import EthicalHackers from "./pages/EthicalHackers";
import EthicalHackerProfile from "./pages/EthicalHackerProfile";
import AdminUsers from "./pages/AdminUsers";
import AdminProducts from "./pages/AdminProducts";
import EthackProducts from "./pages/EthackProducts";
import Chat from "./pages/Chat";
import MyOrders from "./pages/MyOrders";
import SellerOrders from "./pages/SellerOrders";
import { SocketProvider } from "./context/SocketContext";
import { ToastProvider } from "./context/ToastContext";
import { useTheme } from "./context/ThemeContext";

// Protected Route Component
function ProtectedRoute({ element }) {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f1117]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3ecf8e]"></div>
      </div>
    );
  }

  return isAuthenticated ? element : <Navigate to="/login" replace />;
}

// Admin Route Component - Only for admin users
function AdminRoute({ element }) {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f1117]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3ecf8e]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return element;
}

// Ethack Route Component - Only for ethical hackers
function EthackRoute({ element }) {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f1117]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3ecf8e]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "ethack" && user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return element;
}

// App Content Component to access theme context
function AppContent() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [initialized, setInitialized] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    // Verify token once when app loads
    const initAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      
      // If token exists and no user data, verify
      if (storedToken && !user) {
        try {
          await dispatch(verifyToken(storedToken)).unwrap();
        } catch (error) {
          console.error('Token verification failed:', error);
          // Invalid token, remove from localStorage
          localStorage.removeItem('authToken');
        }
      }
      
      setInitialized(true);
    };

    if (!initialized) {
      initAuth();
    }
  }, [initialized, user, dispatch]); // Dependency array lengkap tapi dengan guard !initialized

  // Show loading hanya saat initialization
  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f1117]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3ecf8e]"></div>
      </div>
    );
  }

  return (
    <Router>
      <ToastProvider isDark={isDark}>
        <SocketProvider>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Public Product and Ethical Hacker Routes */}
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/ethical-hackers" element={<EthicalHackers />} />
          <Route path="/ethical-hackers/:id" element={<EthicalHackerProfile />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={<ProtectedRoute element={<Dashboard />} />}
          />
          <Route
            path="/scan/new"
            element={<ProtectedRoute element={<NewScan />} />}
          />
          <Route
            path="/scans"
            element={<ProtectedRoute element={<ScanList />} />}
          />
          <Route
            path="/scans/:id"
            element={<ProtectedRoute element={<ScanDetail />} />}
          />
          <Route
            path="/targets"
            element={<ProtectedRoute element={<Targets />} />}
          />
          <Route
            path="/ai"
            element={<ProtectedRoute element={<AIChat />} />}
          />
          <Route
            path="/owasp-top-10"
            element={<ProtectedRoute element={<OwaspTop10 />} />}
          />
          
          {/* Chat Routes */}
          <Route
            path="/chat"
            element={<ProtectedRoute element={<Chat />} />}
          />
          <Route
            path="/chat/:conversationId"
            element={<ProtectedRoute element={<Chat />} />}
          />
          
          {/* Order Routes */}
          <Route
            path="/my-orders"
            element={<ProtectedRoute element={<MyOrders />} />}
          />
          <Route
            path="/seller-orders"
            element={<EthackRoute element={<SellerOrders />} />}
          />

          {/* Admin Only Routes */}
          <Route
            path="/admin/users"
            element={<AdminRoute element={<AdminUsers />} />}
          />
          <Route
            path="/admin/products"
            element={<AdminRoute element={<AdminProducts />} />}
          />

          {/* Ethack Only Routes */}
          <Route
            path="/ethack/products"
            element={<EthackRoute element={<EthackProducts />} />}
          />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
        </Routes>
      </SocketProvider>
      </ToastProvider>
    </Router>
  );
}

// Main App wrapper
function App() {
  return <AppContent />;
}

export default App;