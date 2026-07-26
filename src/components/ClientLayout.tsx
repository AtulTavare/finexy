import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, FileText, CreditCard, Info, Scale, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { ConfirmDialog } from './ui';

const NAV_ITEMS = [
  { path: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/client/projects', label: 'Projects', icon: FolderKanban },
  { path: '/client/documents', label: 'Documents', icon: FileText },
  { path: '/client/payments', label: 'Payments', icon: CreditCard },
  { path: '/client/about', label: 'About Us', icon: Info },
  { path: '/client/terms', label: 'Terms', icon: Scale },
];

export default function ClientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
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
            <div className="w-8 h-8 rounded-full bg-[#f97316] text-white flex items-center justify-center text-sm font-bold">
              {initials}
            </div>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full cursor-pointer"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        {menuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-4 py-2 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive ? 'bg-[#18181b] text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full cursor-pointer"
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8">
          <Outlet />
        </main>
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
