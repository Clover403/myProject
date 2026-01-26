import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setToken, verifyToken } from '../redux/authSlice';

function AuthCallback() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const processing = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple executions
      if (processing.current) {
        console.log('⏭️ Already processing callback, skipping...');
        return;
      }
      processing.current = true;

      // Get token from URL
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      console.log('📥 OAuth callback received:', { hasToken: !!token, error });

      if (error) {
        console.error('❌ OAuth error:', error);
        navigate('/login?error=' + encodeURIComponent(error), { replace: true });
        return;
      }

      if (!token) {
        console.error('❌ No token received');
        navigate('/login?error=' + encodeURIComponent('No token received'), { replace: true });
        return;
      }

      try {
        console.log('💾 Saving token...');
        
        // 1. Save token to localStorage FIRST
        localStorage.setItem('authToken', token);
        
        // 2. Update Redux state
        dispatch(setToken(token));

        // 3. Verify token and get user data
        console.log('🔍 Verifying token...');
        const resultAction = await dispatch(verifyToken(token));
        
        if (verifyToken.fulfilled.match(resultAction)) {
          console.log('✅ Authentication successful!');
          console.log('👤 User data:', resultAction.payload);
          
          // Give a small delay to ensure state is updated
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 100);
        } else {
          throw new Error('Token verification failed');
        }
      } catch (error) {
        console.error('❌ Error processing authentication:', error);
        console.error('❌ Error details:', error.message, error.stack);
        localStorage.removeItem('authToken');
        const errorMsg = error.message || 'Authentication failed';
        navigate('/login?error=' + encodeURIComponent(errorMsg), { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#3ecf8e] mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Authenticating...
        </h2>
        <p className="text-gray-400">Please wait while we sign you in</p>
      </div>
    </div>
  );
}

export default AuthCallback;