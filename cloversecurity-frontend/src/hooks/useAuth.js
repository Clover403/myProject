import { useDispatch, useSelector } from 'react-redux';
import { logout, verifyToken } from '../redux/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );

  const handleLogout = async () => {
    try {
      await dispatch(logout());
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleVerifyToken = async (authToken) => {
    try {
      await dispatch(verifyToken(authToken));
    } catch (err) {
      console.error('Token verification error:', err);
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    logout: handleLogout,
    verifyToken: handleVerifyToken
  };
};

export default useAuth;
