import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Shield, ArrowRight, CheckCircle, AlertCircle, Mail, Lock, User, Loader } from 'lucide-react';

function Login() {
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [error, setError] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
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

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGoogleLogin = () => {
    setError('');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const endpoint = isLoginView ? '/auth/login' : '/auth/register';
      
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Handle successful login/register
      if (data.token) {
        // Store token and redirect
        // Assuming AuthContext handles token storage via URL param or we do it manually here for now
        // But for consistency with OAuth flow, we might want to redirect to a callback handler or just navigate
        // Let's manually trigger the auth success flow
        window.location.href = `/auth/callback?token=${data.token}`;
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
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

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
              {!isLoginView && (
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Full Name
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                    <input
                      type="text"
                      name="name"
                      required={!isLoginView}
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors ${
                        isDark 
                          ? "bg-[#0f1117] border-[#2a2e38] text-white placeholder-gray-600" 
                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                      }`}
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@company.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors ${
                      isDark 
                        ? "bg-[#0f1117] border-[#2a2e38] text-white placeholder-gray-600" 
                        : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors ${
                      isDark 
                        ? "bg-[#0f1117] border-[#2a2e38] text-white placeholder-gray-600" 
                        : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-green-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isLoginView ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center mb-6">
              <button
                type="button"
                onClick={() => setIsLoginView(!isLoginView)}
                className="text-sm text-green-500 hover:text-green-400 font-medium"
              >
                {isLoginView ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDark ? "border-[#2a2e38]" : "border-gray-200"}`}></div>
              </div>
              <div className="relative flex justify-center">
                <span className={`px-3 text-xs font-medium ${isDark ? "bg-[#1a1d24] text-gray-400" : "bg-white text-gray-500"}`}>
                  Or continue with
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
              Google
            </button>
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