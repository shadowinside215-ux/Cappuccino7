import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, ShieldCheck, Lock, User as UserIcon, Mail } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { useBrandSettings } from '../../lib/brand';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFirebaseAuthed, setIsFirebaseAuthed] = useState(false);
  const { settings: brand } = useBrandSettings();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (auth.currentUser?.email?.toLowerCase() === 'dragonballsam86@gmail.com') {
      navigate('/admin');
    }
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        setIsFirebaseAuthed(true);
        toast.success(`Authenticated as ${result.user.email}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Identity verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFirebaseAuthed && auth.currentUser === null) {
      toast.error('Please verify your email identity first');
      return;
    }

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
          <div className="w-28 h-28 bg-white rounded-full overflow-hidden shadow-2xl shadow-bento-primary/20 p-1 mx-auto rotate-3 border-2 border-stone-50">
             <img 
               src={brand.logoUrl} 
               alt="Management Logo" 
               className="w-full h-full object-contain rounded-full"
             />
          </div>
          <div>
            <h1 className="text-4xl font-black italic text-bento-primary tracking-tighter">Cappuccino7</h1>
            <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px] mt-2">Management Console</p>
          </div>
        </div>

        {!isFirebaseAuthed && !auth.currentUser ? (
          <div className="space-y-6">
            <div className="bg-stone-50 p-6 rounded-2xl border border-dashed border-stone-200">
              <p className="text-center text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">Step 1: Identity Verification</p>
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white border-2 border-stone-200 text-stone-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-stone-50 transition-all shadow-sm active:scale-95"
              >
                <Mail size={20} className="text-bento-accent" />
                {loading ? 'Connecting...' : 'Verify with Google'}
              </button>
            </div>
            <p className="text-[10px] text-center text-stone-400 font-medium">Firebase identity is required for security rules</p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 bg-green-50 text-green-700 p-3 rounded-xl border border-green-100 mb-2">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Identity Verified: {auth.currentUser?.email}</span>
            </div>

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
              Unlock Console <Coffee size={20} />
            </button>
          </form>
        )}

        <p className="text-center text-stone-300 text-[10px] font-bold uppercase tracking-[0.2em] pt-4">
          Strictly for authorized administrators
        </p>
      </div>
    </div>
  );
}
