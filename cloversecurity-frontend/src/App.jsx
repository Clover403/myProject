import React, { useEffect } from "react";
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
  const { token, isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Verify token on app load if token exists
    const storedToken = localStorage.getItem('authToken');
    
    if (storedToken && !user) {
      console.log('🔍 Verifying stored token...');
      dispatch(verifyToken(storedToken));
    }
  }, [dispatch, user]);

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

        {/* Redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;