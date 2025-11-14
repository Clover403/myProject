import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
// Hapus 'useNavigate' dan 'useSelector' karena kita tidak lagi melakukan redirect dari sini
import { useTheme } from '../context/ThemeContext';
import { Shield, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

function Login() {
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();
  
  // HAPUS: Logika state isAuthenticated dan loading dari Redux tidak diperlukan lagi di file ini
  // const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  const [error, setError] = React.useState('');

  useEffect(() => {
    // EFEK INI BOLEH TETAP ADA: Hanya untuk menampilkan pesan error dari callback
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const errorMessages = {
        auth_failed: 'Authentication failed. Please try again.',
        no_user: 'Unable to authenticate user. Please try again.',
        server_error: 'Server error occurred. Please try again later.'
      };
      setError(errorMessages[errorParam] || 'Authentication failed');
    }
  }, [searchParams]);

  // HAPUS SEMUA BLOK useEffect YANG INI:
  // Logika ini sekarang ditangani oleh <PublicLayout> di App.jsx,
  // menyimpannya di sini menyebabkan konflik dan loop.
  /*
  useEffect(() => {
    // Redirect if already authenticated (but not if loading)
    if (isAuthenticated && !loading) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams, loading]);
  */

  const handleGoogleLogin = () => {
    // Clear any previous errors
    setError('');
    
    // Redirect to backend OAuth endpoint
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? "bg-[#0f1117]" : "bg-gray-50"}`}>
      <div className="w-full max-w-lg">
        {/* Main Card */}
        <div className={`rounded-xl shadow-lg border overflow-hidden ${isDark ? "bg-[#1a1d24] border-[#2a2e38]" : "bg-white border-gray-200"}`}>
          {/* Header with gradient */}
          <div className="h-32 gradient-dark relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-green-400 rounded-full blur-2xl transform translate-x-20 -translate-y-20"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-gradient-primary p-4 rounded-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8 relative z-10">
            <div className="text-center mb-8">
              <h1 className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                CloverSecurity
              </h1>
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Advanced Security Scanner & Vulnerability Management
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                  <button 
                    onClick={() => setError('')}
                    className="text-red-300 text-xs mt-1 hover:text-red-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>Real-time vulnerability scanning</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>AI-powered threat analysis</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>Comprehensive security reports</span>
              </div>
            </div>

            {/* Divider */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDark ? "border-[#2a2e38]" : "border-gray-200"}`}></div>
              </div>
              <div className="relative flex justify-center">
                <span className={`px-3 text-xs font-medium ${isDark ? "bg-[#1a1d24] text-gray-400" : "bg-white text-gray-500"}`}>
                  Sign in with Google
                </span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              className={`w-full border-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-3 mb-4 ${isDark ? "bg-[#0f1117] border-[#2a2e38] hover:border-green-400 hover:shadow-md text-gray-200" : "bg-white border-gray-300 hover:border-green-400 hover:shadow-md text-gray-900"}`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Info text */}
            <p className={`text-xs text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Sign in securely with your Google account. No password needed.
            </p>
          </div>

          {/* Footer */}
          <div className={`px-8 py-4 border-t ${isDark ? "bg-[#0f1117] border-[#2a2e38]" : "bg-gray-50 border-gray-200"}`}>
            <p className={`text-xs text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              By signing in, you agree to our Terms of Service & Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;