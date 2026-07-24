import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { ClientDataProvider } from '../store/ClientDataContext';
import Lottie from 'lottie-react';
import animationData from '../assets/infinity-loader.json';

export function ClientGuard() {
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
    return <Navigate to="/client/login" replace />;
  }

  return (
    <ClientDataProvider>
      <Outlet />
    </ClientDataProvider>
  );
}
