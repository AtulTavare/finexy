import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useClientData } from '../../store/ClientDataContext';
import { Badge, Button } from '../../components/ui';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '../../components/ui';

export default function ClientProfile() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { client } = useClientData();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = async () => {
    await signOut();
    navigate('/client/login', { replace: true });
  };

  if (!client) return null;

  const initials = client.userName?.charAt(0).toUpperCase() || 'C';

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profile</h1>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-28 h-28 rounded-full bg-[#f97316] text-white flex items-center justify-center text-3xl font-bold overflow-hidden">
            {client.avatarUrl ? (
              <img src={client.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">{client.userName}</p>
            <p className="text-sm text-gray-500">{client.email}</p>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Contact</span>
            <span className="text-gray-900 font-medium">{client.contact || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900 font-medium">{client.mail || client.email || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Business Name</span>
            <span className="text-gray-900 font-medium">{client.businessName || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Address</span>
            <span className="text-gray-900 font-medium">{client.address || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Brand</span>
            <Badge>{client.brand || 'Infinity Innovations'}</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <Badge variant={client.status === 'Active' ? 'success' : client.status === 'Paused' ? 'warning' : 'danger'}>
              {client.status || 'Active'}
            </Badge>
          </div>
        </div>
      </div>
      <Button onClick={() => navigate('/client/dashboard')} variant="secondary" className="w-full">Back to Dashboard</Button>
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="md:hidden w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
      >
        <LogOut size={16} /> Sign Out
      </button>
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
