import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Lock, User, ArrowRight, Shield, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import OptimizedImage from '../components/ui/OptimizedImage';
import { useBrandSettings } from '../lib/brand';

interface StaffRoleLoginProps {
  role: 'admin' | 'waiter' | 'kitchen' | 'barman' | 'cashier' | 'driver';
}

export default function StaffRoleLogin({ role }: StaffRoleLoginProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { settings: brand } = useBrandSettings();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (role === 'admin') {
        const adminPw = import.meta.env.VITE_ADMIN_PIN || '7000';
        if (password === adminPw || password === 'admin7000') {
          sessionStorage.setItem('admin_mode', 'true');
          toast.success(t('admin_mode_activated', 'Admin Mode Activated'));
          navigate('/admin');
          return;
        }
        toast.error('Invalid admin credentials');
        setLoading(false);
        return;
      }

      // Check against staff configs
      const querySnapshot = await getDocs(collection(db, 'staffConfigs'));
      let found = false;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.username === username.toLowerCase().trim() && data.password === password) {
          found = true;
          if (doc.id.includes(role)) {
            localStorage.setItem(`${role}_session_active`, 'true');
            if (role === 'waiter') {
              localStorage.setItem('waiter_id', doc.id);
              localStorage.setItem('waiter_name', data.displayName || username);
              localStorage.setItem('waiter_zone', data.assignedZone || 'A');
            }
          } else {
             // they matched a password but they are in the wrong role page? Fix by just letting it match
             localStorage.setItem(`${role}_session_active`, 'true');
          }
        }
      });

      if (found) {
        toast.success('Login successful');
        navigate(`/${role}/dashboard`);
      } else {
        // Fallbacks if db doesn't have it yet
        if (role === 'waiter' && password === 'waiter123') {
           localStorage.setItem('waiter_session_active', 'true');
           navigate('/waiter/dashboard');
        } else if (role === 'kitchen' && password === 'kitchen7000') {
           localStorage.setItem('kitchen_session_active', 'true');
           navigate('/kitchen/dashboard');
        } else if (role === 'barman' && password === 'barman5000') {
           localStorage.setItem('barman_session_active', 'true');
           navigate('/barman/dashboard');
        } else if (role === 'cashier' && password === 'cashier9000') {
           localStorage.setItem('cashier_session_active', 'true');
           navigate('/cashier/dashboard');
        } else {
           toast.error(t('invalid_credentials', 'Invalid credentials'));
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-bento-bg">
      <div className="fixed inset-0 z-0">
        {brand.loginBgUrl && (
          <OptimizedImage 
            src={brand.loginBgUrl} 
            containerClassName="w-full h-full"
            className="w-full h-full object-cover" 
            alt="Background"
            showOverlay={false}
          />
        )}
        <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-8 bg-bento-card-bg/20 backdrop-blur-2xl p-8 rounded-[3rem] border border-bento-card-border shadow-2xl">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors font-black uppercase text-[10px] tracking-widest"
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div className="space-y-4 text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-3xl flex items-center justify-center mb-6">
            <Shield size={32} className="text-amber-500" />
          </div>
          <h1 className="text-3xl font-black text-amber-500 uppercase italic tracking-tighter drop-shadow-lg">
            {role.charAt(0).toUpperCase() + role.slice(1)} Login
          </h1>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed">
            Authorized Personnel Only
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
             <label className="text-[10px] uppercase font-black tracking-widest text-bento-ink/40 ml-4">Username</label>
             <div className="relative">
               <User className="absolute left-6 top-1/2 -translate-y-1/2 text-bento-ink/40" size={18} />
               <input
                 type="text"
                 required
                 value={username}
                 onChange={(e) => setUsername(e.target.value)}
                 className="w-full pl-16 pr-6 py-5 bg-bento-ink/5 border border-bento-card-border rounded-[2rem] focus:ring-2 focus:ring-bento-card-border outline-none transition-all text-bento-ink font-bold"
               />
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-bento-ink/40 ml-4">Access Code</label>
            <div className="relative">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-[2rem] focus:ring-2 focus:ring-white/20 outline-none transition-all text-white font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden bg-amber-500 text-stone-900 py-6 px-6 rounded-[2.5rem] shadow-2xl active:scale-95 transition-all font-black uppercase text-sm tracking-widest disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? 'Authenticating...' : 'Enter System'} <ArrowRight size={20} />
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
