import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

export function AuthGuard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#f4f5f7]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 rounded-xl bg-[#f97316] text-white flex items-center justify-center font-bold text-xl">F</div>
          <div className="w-6 h-6 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
