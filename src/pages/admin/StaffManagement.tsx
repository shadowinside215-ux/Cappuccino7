import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Shield, Save, User, Lock, Loader2, ChevronLeft, ChefHat, Coffee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';

interface StaffConfig {
  id: string;
  username: string;
  password: string;
  displayName: string;
}

export default function StaffManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<StaffConfig[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'staffConfigs'), (snap) => {
      if (snap.empty) {
        // Initialize defaults if empty
        const defaults: StaffConfig[] = [
          { id: 'waiter1', username: 'waiter', password: 'waiter1', displayName: 'Waiter 1' },
          { id: 'waiter2', username: 'waiter', password: 'waiter2', displayName: 'Waiter 2' },
          { id: 'waiter3', username: 'waiter', password: 'waiter3', displayName: 'Waiter 3' },
          { id: 'waiter4', username: 'waiter', password: 'waiter4', displayName: 'Waiter 4' },
          { id: 'kitchen', username: 'kitchen', password: 'kitchen7000', displayName: 'Kitchen' },
          { id: 'barman', username: 'barman', password: 'barman5000', displayName: 'Barman' },
          { id: 'cashier', username: 'cashier', password: 'cashier9000', displayName: 'Cashier' },
        ];
        setConfigs(defaults);
      } else {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffConfig));
        // Ensure all required IDs exist in state even if not in DB yet
        const requiredIds = ['waiter1', 'waiter2', 'waiter3', 'waiter4', 'kitchen', 'barman', 'cashier' ];
        const merged = requiredIds.map(id => {
          const found = data.find(d => d.id === id);
          if (found) return found;
          // Fallback defaults
          if (id === 'kitchen') return { id, username: 'kitchen', password: 'kitchen7000', displayName: 'Kitchen' };
          if (id === 'barman') return { id, username: 'barman', password: 'barman5000', displayName: 'Barman' };
          if (id === 'cashier') return { id, username: 'cashier', password: 'cashier9000', displayName: 'Cashier' };
          return { id, username: 'waiter', password: id, displayName: `Waiter ${id.slice(-1)}` };
        });
        merged.sort((a, b) => a.id.localeCompare(b.id));
        setConfigs(merged);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleUpdate = (id: string, field: keyof StaffConfig, value: string) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const saveConfigs = async () => {
    setSaving(true);
    const toastId = toast.loading('Saving staff configurations...');
    try {
      for (const config of configs) {
        await setDoc(doc(db, 'staffConfigs', config.id), config);
      }
      toast.success('Staff accounts updated successfully!', { id: toastId });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'staffConfigs');
      toast.error('Failed to update staff accounts', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="text-amber-400 animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')}
            className="p-3 bg-white rounded-2xl text-stone-400 hover:text-stone-900 shadow-sm border border-stone-100 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-stone-900 uppercase italic tracking-tighter">
              Staff Accounts
            </h1>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">
              Manage credentials for system accounts
            </p>
          </div>
        </div>

        <button 
          onClick={saveConfigs}
          disabled={saving}
          className="flex items-center gap-2 bg-stone-900 text-white px-8 py-4 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {configs.map((config) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={config.id}
            className={`bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-xl space-y-6 ${config.id.startsWith('waiter') ? '' : 'border-t-4 border-t-stone-900'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-3 rounded-2xl ${config.id.startsWith('waiter') ? 'bg-amber-400 text-stone-900' : 'bg-stone-900 text-white'}`}>
                {config.id === 'kitchen' ? <ChefHat size={20} /> : config.id === 'barman' ? <Coffee size={20} /> : config.id === 'cashier' ? <Shield size={20} /> : <User size={20} />}
              </div>
              <h3 className="font-black text-stone-900 uppercase italic">{config.displayName}</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1.5 ml-1">Username (Station ID)</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={14} />
                  <input 
                    type="text" 
                    value={config.username}
                    onChange={(e) => handleUpdate(config.id, 'username', e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold focus:ring-2 ring-amber-400/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1.5 ml-1">Password (Security Key)</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={14} />
                  <input 
                    type="text" 
                    value={config.password}
                    onChange={(e) => handleUpdate(config.id, 'password', e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold focus:ring-2 ring-amber-400/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4">
        <Shield className="text-amber-500 shrink-0" size={24} />
        <div className="space-y-1">
          <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight italic">Security Tip</h4>
          <p className="text-xs text-amber-800/80 leading-relaxed">
            Changing these credentials will affect how staff members log in. Make sure to communicate new credentials to your team immediately after saving.
          </p>
        </div>
      </div>
    </div>
  );
}
