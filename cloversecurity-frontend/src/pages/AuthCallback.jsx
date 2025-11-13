import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setToken, verifyToken } from '../redux/authSlice';

function AuthCallback() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const callbackProcessed = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple executions
      if (callbackProcessed.current) {
        return;
      }
      callbackProcessed.current = true;

      // Get token from URL
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        alert('Authentication failed. Please try again.');
        navigate('/login');
        return;
      }

      if (!token) {
        console.error('No token received');
        alert('Authentication failed. No token received.');
        navigate('/login');
        return;
      }

      try {
        // Save token to localStorage and Redux
        localStorage.setItem('authToken', token);
        dispatch(setToken(token));

        // Verify token and get user data
        const resultAction = await dispatch(verifyToken(token));
        
        if (verifyToken.fulfilled.match(resultAction)) {
          console.log('✅ Authentication successful!');
          // Redirect to dashboard
          navigate('/', { replace: true });
        } else {
          throw new Error('Token verification failed');
        }
      } catch (error) {
        console.error('Error processing authentication:', error);
        localStorage.removeItem('authToken');
        alert('Authentication failed. Please try again.');
        navigate('/login');
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