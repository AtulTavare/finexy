import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, FileText, CreditCard, Info, Scale, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { useClientData } from '../store/ClientDataContext';
import { ConfirmDialog } from './ui';

const NAV_ITEMS = [
  { path: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/client/projects', label: 'Projects', icon: FolderKanban },
  { path: '/client/documents', label: 'Documents', icon: FileText },
  { path: '/client/payments', label: 'Payments', icon: CreditCard },
  { path: '/client/about', label: 'About Us', icon: Info },
  { path: '/client/terms', label: 'Terms', icon: Scale },
  { path: '/client/calendar', label: 'Calendar', icon: Calendar },
];

export default function ClientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { client } = useClientData();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => setShowLogoutConfirm(true);

  const confirmLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const initials = user?.email?.charAt(0).toUpperCase() || 'C';

  return (
    <div className="flex h-[100dvh] w-full bg-[#f4f5f7] text-gray-900 font-sans p-3 sm:p-4">
      <div className="flex flex-1 rounded-none sm:rounded-[32px] bg-[#f9fafc] border border-white shadow-sm overflow-hidden relative flex-col">
        <header className="flex items-center justify-between p-4 md:px-8 shrink-0 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Infinity" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-sm hidden sm:inline">Client Portal</span>
            <div className="hidden md:flex ml-6 space-x-1">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${
                      isActive ? 'bg-[#18181b] text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all cursor-pointer"
            >
              <LogOut size={14} /> Sign Out
            </button>
            <button
              onClick={() => navigate('/client/profile')}
              className="w-8 h-8 rounded-full bg-[#f97316] text-white flex items-center justify-center text-sm font-bold overflow-hidden hover:ring-2 hover:ring-orange-500 transition-all cursor-pointer"
            >
              {client?.avatarUrl ? (
                <img src={client.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </button>
          </div>
        </header>


        <main className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile dock-style nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 flex justify-center pb-3 pt-1 z-50 pointer-events-none">
          <div className="flex items-center justify-around bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/5 border border-gray-100/80 px-1 py-1.5 mx-3 max-w-[95vw] w-full pointer-events-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center gap-0.5 px-1.5 py-1.5 rounded-xl transition-all min-w-0 flex-1 ${
                    isActive ? 'bg-[#18181b] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <item.icon size={18} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
                  <span className="text-[8px] font-medium leading-none whitespace-nowrap">{item.label}</span>
                </NavLink>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center gap-0.5 px-1.5 py-1.5 rounded-xl transition-all min-w-0 flex-1 text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
            >
              <LogOut size={18} />
              <span className="text-[8px] font-medium leading-none whitespace-nowrap">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        destructive
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
