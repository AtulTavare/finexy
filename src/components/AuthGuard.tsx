import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import Lottie from 'lottie-react';
import animationData from '../assets/infinity-loader.json';

export function AuthGuard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#f4f5f7]">
        <div className="w-40 h-40">
          <Lottie animationData={animationData} loop />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin-shubhaminfinity/login" replace />;
  }

  if (user.user_metadata?.role === 'client') {
    return <Navigate to="/client/dashboard" replace />;
  }

  return <Outlet />;
}
