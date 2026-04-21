import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, ShieldCheck, Lock, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Specific business requirement credentials
    if (username === 'admin' && password === 'admin2000') {
      // Store a temporary session flag for admin mode
      sessionStorage.setItem('admin_mode', 'true');
      toast.success('Admin access granted');
      navigate('/admin');
    } else {
      toast.error('Invalid administrative credentials');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center -mt-20">
      <div className="card w-full max-w-md !p-10 space-y-8 bg-white border-2 border-bento-primary/10 shadow-2xl">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-bento-primary text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-bento-primary/20 rotate-3">
            <ShieldCheck size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black italic text-bento-primary tracking-tighter">Cappuccino7</h1>
            <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px] mt-2">Management Console</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <UserIcon size={12} /> Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-bento-accent transition-all outline-none font-medium"
              placeholder="Enter admin name"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Lock size={12} /> Access Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-bento-accent transition-all outline-none font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-bento-primary text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-bento-primary/20 hover:bg-bento-ink transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {loading ? 'Verifying...' : (
              <>
                Unlock System <Coffee size={20} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-stone-300 text-[10px] font-bold uppercase tracking-[0.2em] pt-4">
          Strictly for internal staff use
        </p>
      </div>
    </div>
  );
}
