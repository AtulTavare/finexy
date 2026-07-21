import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, Briefcase, CheckSquare, Plus, X, Menu,
  Calendar as CalendarIcon, FolderKanban, Search, Bell, HelpCircle, LogOut,
} from 'lucide-react';
import { useAuth } from '../store/AuthContext';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/personal', label: 'Activity', icon: Wallet },
  { path: '/business', label: 'Manage', icon: Briefcase },
  { path: '/projects', label: 'Program', icon: FolderKanban },
  { path: '/calendar', label: 'Account', icon: CalendarIcon },
  { path: '/tasks', label: 'Reports', icon: CheckSquare },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [fabOpen, setFabOpen] = useState(false);

  const trigger = (event: string, path: string) => {
    if (location.pathname !== path) {
      navigate(path);
      setTimeout(() => window.dispatchEvent(new Event(event)), 100);
    } else {
      window.dispatchEvent(new Event(event));
    }
    setFabOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  let fabActions = [
    { label: 'Add Task', action: () => trigger('open-task-modal', '/tasks') },
  ];

  if (location.pathname === '/personal') {
    fabActions = [
      { label: 'Add Income', action: () => trigger('open-income-modal', '/personal') },
      { label: 'Add Expense', action: () => trigger('open-expense-modal', '/personal') },
      { label: 'Add Debt', action: () => trigger('open-debt-modal', '/personal') },
    ];
  } else if (location.pathname === '/business') {
    fabActions = [
      { label: 'Add Lead', action: () => trigger('open-lead-modal', '/business') },
      { label: 'Add Client', action: () => trigger('open-client-modal', '/business') },
      { label: 'Add Engagement', action: () => trigger('open-engagement-modal', '/business') },
      { label: 'Log Payment', action: () => trigger('open-payment-modal', '/business') },
      { label: 'Add Expense', action: () => trigger('open-business-expense-modal', '/business') },
    ];
  } else if (location.pathname === '/') {
    fabActions = [
      { label: 'Add Task', action: () => trigger('open-task-modal', '/tasks') },
      { label: 'Add Expense', action: () => trigger('open-expense-modal', '/personal') },
      { label: 'Add Lead', action: () => trigger('open-lead-modal', '/business') },
    ];
  }

  const initials = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="flex h-[100dvh] w-full bg-[#f4f5f7] text-gray-900 font-sans p-3 sm:p-4">
      <div className="flex flex-1 rounded-none sm:rounded-[32px] bg-[#f9fafc] border border-white shadow-sm overflow-hidden relative">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col py-8 w-20 items-center bg-white border-r border-gray-100 z-10 shrink-0">
          <img src="/logo.png" alt="ShubhStack" className="mb-10 w-10 h-10 rounded-xl" />
          <nav className="flex flex-col space-y-4 w-full px-4">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={item.label}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-[#18181b] text-white' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                >
                  <item.icon size={20} className={isActive ? 'stroke-[2]' : 'stroke-2'} />
                </NavLink>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col space-y-4">
            <button onClick={handleLogout} className="w-12 h-12 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-all cursor-pointer" title="Sign Out">
              <LogOut size={20} />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full min-w-0 bg-[#f9fafc] relative overflow-hidden">
          {/* Top Bar */}
          <header className="hidden md:flex justify-between items-center p-6 pb-2 shrink-0">
            <div className="flex items-center space-x-2" />

            <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-100">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-5 py-2 rounded-full text-sm font-medium transition-all ${isActive ? 'bg-[#18181b] text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-100">
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50"><Search size={18} /></button>
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 relative">
                  <Bell size={18} />
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#f97316] rounded-full" />
                </button>
                <button onClick={handleLogout} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-gray-50"><LogOut size={18} /></button>
              </div>
              <div className="bg-white rounded-full p-1 flex items-center pr-4 shadow-sm border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-[#f97316] text-white flex items-center justify-center mr-2 text-sm font-bold">{initials}</div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">{user?.email?.split('@')[0] || 'User'}</span>
                  <span className="text-[10px] text-gray-500">{user?.email || ''}</span>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-20 pt-3 md:p-8 md:pt-4">
            <Outlet />
          </div>

          {/* Mobile Bottom Nav */}
          <div className="md:hidden absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white flex justify-around items-center h-16 pb-safe z-20">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-transform ${isActive ? 'text-[#18181b]' : 'text-gray-400'}`}
                >
                  <item.icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* FAB */}
          <div className="fixed bottom-20 md:bottom-8 right-6 md:right-10 z-50 flex flex-col items-end">
            {fabOpen && (
              <div className="mb-4 flex flex-col space-y-2 items-end">
                {fabActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={action.action}
                    className="bg-white border border-gray-100 px-5 py-2.5 text-sm font-medium rounded-full shadow-lg hover:bg-gray-50 text-gray-900 transition-all flex items-center space-x-2"
                  >
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setFabOpen(!fabOpen)}
              className="w-14 h-14 bg-[#f97316] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
            >
              {fabOpen ? <X size={24} className="stroke-[2.5]" /> : <Plus size={24} className="stroke-[2.5]" />}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
