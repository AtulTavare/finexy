import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

const SLIDE_COUNT = 8;

function generateSlides() {
  const ids = ['code', 'laptop', 'desk', 'team', 'office', 'design', 'startup', 'tech'];
  return ids.map((seed, i) => ({
    url: `https://picsum.photos/seed/client${seed}/1920/1080`,
    id: i,
  }));
}

export default function ClientLogin() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = useRef(generateSlides());

  useEffect(() => {
    if (user) {
      supabase.from('client_users').select('id').eq('user_id', user.id).single().then(({ data }) => {
        if (data) {
          navigate('/client/dashboard', { replace: true });
        } else {
          supabase.auth.signOut();
          setError('This account does not have client access. Please use the admin login.');
        }
      });
    }
  }, [user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_COUNT);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#f4f5f7]">
      <div className="hidden md:flex relative flex-1 overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          <motion.img
            key={slides.current[currentSlide].id}
            src={slides.current[currentSlide].url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        <div className="absolute bottom-12 left-12 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <img src="/logo.png" alt="Infinity" className="w-12 h-12 rounded-xl" />
            <span className="text-2xl font-bold">Client Portal</span>
          </div>
          <p className="text-lg text-white/80 max-w-md">
            Track your projects, payments, and documents.
          </p>
          <div className="flex space-x-2 mt-6">
            {slides.current.slice(0, 6).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentSlide % 6 ? 'bg-[#f97316] w-6' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex items-center space-x-3 mb-10">
            <img src="/logo.png" alt="Infinity" className="w-10 h-10 rounded-xl" />
            <span className="text-xl font-bold">Client Portal</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Client Login</h1>
          <p className="text-sm text-gray-500 mb-8">Sign in to view your projects and documents.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                placeholder="client@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                placeholder="Enter your password"
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl font-medium">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#18181b] text-white py-3 rounded-xl text-sm font-medium hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-8">
            Powered by <span className="font-semibold text-gray-600">Infinity Innovations</span>
          </p>
        </div>
      </div>
    </div>
  );
}
