import React, { useState, useRef } from 'react';
import { User, Camera, LogOut } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button, ConfirmDialog } from '../../components/ui';

export default function AdminProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(user?.user_metadata?.avatar_url || null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    const path = `avatars/admin/${user.id}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) { console.error(upErr); setUploading(false); return; }
    const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(path, 31536000);
    if (signed?.signedUrl) {
      await supabase.auth.updateUser({ data: { avatar_url: signed.signedUrl } });
    }
    setUploading(false);
  };

  const initials = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profile</h1>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div
            className="relative w-28 h-28 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-orange-500 overflow-hidden group"
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <User size={36} className="text-gray-400" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
              <Camera size={24} className="text-white" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">{user?.email?.split('@')[0] || 'Admin'}</p>
            <p className="text-sm text-gray-500">{user?.email || ''}</p>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900 font-medium">{user?.email || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Role</span>
            <span className="text-gray-900 font-medium">Admin</span>
          </div>
        </div>
      </div>
      <Button onClick={() => window.history.back()} variant="secondary" className="w-full">Back to Dashboard</Button>
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
