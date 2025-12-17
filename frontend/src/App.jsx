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

function App() {
  const dispatch = useDispatch();
  const { token, isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // HANYA verify token SEKALI saat app pertama kali dimuat
    const initAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      
      // Jika ada token dan belum punya data user, verify
      if (storedToken && !user && !initialized) {
        console.log('🔍 Verifying stored token on app init...');
        try {
          await dispatch(verifyToken(storedToken)).unwrap();
        } catch (error) {
          console.error('❌ Token verification failed:', error);
          // Token invalid, hapus dari localStorage
          localStorage.removeItem('authToken');
        }
      }
      
      setInitialized(true);
    };

    initAuth();
  }, []); // HANYA jalankan sekali saat mount!

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
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Routes */}
        <Route
          path="/"
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

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;