import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Phone, ArrowRight, Coffee } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface OnboardingProps {
  userProfile: UserProfile;
  isOpen: boolean;
  onComplete: () => void;
}

export default function Onboarding({ userProfile, isOpen, onComplete }: OnboardingProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(userProfile.name || '');
  const [phone, setPhone] = useState(userProfile.phone || '');
  const [loading, setLoading] = useState(false);

  // If name is just "Guest User" or empty, we definitely want them to change it
  const isGenericName = !userProfile.name || userProfile.name === 'Guest User';
  
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, {
        name: name.trim(),
        phone: phone.trim()
      });
      toast.success('Profile updated!');
      onComplete();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-950/80 backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="w-full max-w-md bg-stone-900 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl space-y-8"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10">
              <Coffee size={40} className="text-amber-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">{t('complete_profile')}</h2>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed">
                {t('onboarding_desc')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-4">{t('full_name')}</label>
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('full_name')}
                  className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-[2rem] focus:ring-2 focus:ring-white/20 outline-none transition-all text-white font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-4">{t('phone_number')} ({t('optional')})</label>
              <div className="relative">
                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+212 6xx xxxx"
                  className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-[2rem] focus:ring-2 focus:ring-white/20 outline-none transition-all text-white font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-stone-900 py-6 px-6 rounded-[2.5rem] shadow-2xl active:scale-95 transition-all font-black uppercase text-sm tracking-widest disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? t('updating') || '...' : t('start_ordering')}
              <ArrowRight size={20} />
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
