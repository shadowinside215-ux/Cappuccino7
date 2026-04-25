import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Moon, Sun, Languages, ArrowLeft, LogOut, Shield, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';

interface SettingsProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export default function Settings({ theme, setTheme }: SettingsProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    toast.success(t('language_changed', { defaultValue: 'Language updated' }));
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    toast.success(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode enabled`);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="min-h-[80vh] pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-bento-card-bg rounded-xl border border-bento-card-border text-bento-primary hover:bg-stone-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-black italic text-bento-primary uppercase tracking-tighter">
          {t('settings', { defaultValue: 'Settings' })}
        </h1>
      </div>

      <div className="space-y-6">
        {/* Appearance Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bento-card-bg border border-bento-card-border rounded-[32px] p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center dark:bg-indigo-900/30 dark:text-indigo-400">
              {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            <h2 className="text-lg font-bold text-bento-primary">
              {t('appearance', { defaultValue: 'Appearance' })}
            </h2>
          </div>

          <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-black/20 rounded-2xl border border-stone-100 dark:border-white/5">
            <div>
              <p className="font-bold text-bento-ink">{t('dark_mode', { defaultValue: 'Dark Mode' })}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">{t('dark_mode_desc', { defaultValue: 'Enjoy a darker interface' })}</p>
            </div>
            <button 
              onClick={toggleTheme}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none ${
                theme === 'dark' ? 'bg-bento-primary' : 'bg-stone-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 transform ${
                theme === 'dark' ? 'translate-x-6' : ''
              }`} />
            </button>
          </div>
        </motion.div>

        {/* Language Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-bento-card-bg border border-bento-card-border rounded-[32px] p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center dark:bg-amber-900/30 dark:text-amber-400">
              <Languages size={20} />
            </div>
            <h2 className="text-lg font-bold text-bento-primary">
              {t('language', { defaultValue: 'Language' })}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'en', label: 'English', sub: 'USA / UK' },
              { id: 'fr', label: 'Français', sub: 'France' },
              { id: 'ar', label: 'العربية', sub: 'المغرب' }
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => changeLanguage(lang.id)}
                className={`p-4 rounded-2xl text-left border transition-all ${
                  i18n.language === lang.id 
                  ? 'bg-bento-primary text-white border-bento-primary shadow-lg ring-4 ring-bento-primary/10' 
                  : 'bg-stone-50 dark:bg-black/20 text-stone-500 dark:text-stone-400 border-stone-100 dark:border-white/5 hover:border-bento-primary/30'
                }`}
              >
                <p className="font-bold">{lang.label}</p>
                <p className={`text-[10px] uppercase tracking-widest ${i18n.language === lang.id ? 'text-white/60' : 'text-stone-400'}`}>
                  {lang.sub}
                </p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Account Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-bento-card-bg border border-bento-card-border rounded-[32px] p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-stone-100 text-stone-600 rounded-2xl flex items-center justify-center dark:bg-stone-800 dark:text-stone-400">
              <Shield size={20} />
            </div>
            <h2 className="text-lg font-bold text-bento-primary">
              {t('account', { defaultValue: 'Account' })}
            </h2>
          </div>

          <div className="space-y-3">
             <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <LogOut size={20} />
                <span className="font-bold">{t('logout', { defaultValue: 'Log Out' })}</span>
              </div>
            </button>
          </div>
        </motion.div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-[10px] font-black text-stone-300 dark:text-stone-600 uppercase tracking-[0.4em]">
          Version 2.4.0 • Made with Coffee
        </p>
      </div>
    </div>
  );
}
