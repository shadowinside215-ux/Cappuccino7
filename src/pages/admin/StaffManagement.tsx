import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, onSnapshot, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Shield, Save, User, Loader2, ChevronLeft, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../../types';

export default function StaffManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [staffUsers, setStaffUsers] = useState<UserProfile[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    // Only loading users that are not normal clients (having some role assigned or pending)
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (snap) => {
      const usersList = snap.docs.map(doc => doc.data() as UserProfile)
                               .filter(u => u.role && u.role !== 'client');
      setStaffUsers(usersList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleRoleUpdate = async (userId: string) => {
    if (!selectedRole) return;
    const toastId = toast.loading('Updating role...');
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: selectedRole,
        isAdmin: selectedRole === 'admin',
        isWaiter: selectedRole === 'waiter',
        isCashier: selectedRole === 'cashier',
        isKitchen: selectedRole === 'kitchen',
        isBarman: selectedRole === 'barman',
        isDriver: selectedRole === 'driver'
      });
      toast.success('Role updated successfully', { id: toastId });
      setEditingId(null);
    } catch (err: any) {
      toast.error('Failed to update role', { id: toastId });
    }
  };

  const roles = ['admin', 'waiter', 'cashier', 'kitchen', 'barman', 'driver', 'client'];

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
              Staff Role Assignments
            </h1>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">
              Securely map Auth permissions
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-100">
              <th className="p-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Name / Email</th>
              <th className="p-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Current Role</th>
              <th className="p-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffUsers.map((user) => (
              <tr key={user.uid} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-stone-900">{user.name}</div>
                  <div className="text-xs text-stone-500">{user.email}</div>
                </td>
                <td className="p-4">
                  {editingId === user.uid ? (
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="bg-stone-100 border-none rounded-xl py-2 px-4 text-sm font-bold focus:ring-2 ring-amber-400/20 outline-none"
                    >
                      <option value="" disabled>Select a role...</option>
                      {roles.map(r => (
                        <option key={r} value={r}>{r.toUpperCase()}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      user.role === 'pending' ? 'bg-red-100 text-red-600' : 
                      user.role === 'admin' ? 'bg-stone-900 text-white' : 
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  {editingId === user.uid ? (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditingId(null); setSelectedRole(''); }} className="p-2 text-stone-400 hover:text-stone-900 bg-stone-100 rounded-xl transition-colors"><X size={16} /></button>
                      <button onClick={() => handleRoleUpdate(user.uid)} className="p-2 text-green-600 hover:text-white hover:bg-green-600 bg-green-50 rounded-xl flex items-center transition-colors"><Check size={16} /></button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setEditingId(user.uid); setSelectedRole(user.role || ''); }}
                      className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-4 py-2 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
                    >
                      Edit Role
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {staffUsers.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-stone-400 font-bold">No staff found. Ask staff to sign in via /staff-login first.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4">
        <Shield className="text-amber-500 shrink-0" size={24} />
        <div className="space-y-1">
          <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight italic">Security Info</h4>
          <p className="text-xs text-amber-800/80 leading-relaxed">
            Staff users must first create their own account at <strong>/staff-login</strong>. Once they appear here as "pending", approve them by assigning the correct system role. Passwords are fully secured via Firebase Auth.
          </p>
        </div>
      </div>
    </div>
  );
}
