import React, { useState, useEffect } from 'react';
import { Download, Share, X, Coffee, WifiOff, RefreshCw, Smartphone, Plus, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';

export default function PWAInstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Custom iPhone dialog modal state
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 1. Standalone / installed check
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // 2. iOS check
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(iOS);

    // 3. Prompt dismissal check for 7 days
    const checkDismissalExpiry = () => {
      const dismissedAtStr = localStorage.getItem('cappuccino7_pwa_dismissed_at');
      if (dismissedAtStr) {
        const dismissedAt = parseInt(dismissedAtStr, 10);
        const elapsed = Date.now() - dismissedAt;
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (elapsed < sevenDaysMs) {
          return true; // Still within 7 days, keep dismissed
        }
      }
      return false;
    };

    const currentlyDismissed = checkDismissalExpiry();
    setIsDismissed(currentlyDismissed);

    // 4. Android beforeinstallprompt event handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show Android prompt if not in standalone and not within 7-day dismissal window
      if (!isStandalone && !currentlyDismissed) {
        setShowAndroidPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Connection listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 6. iOS Safari Detection
    const isSafari = /Safari/i.test(ua) && !/CriOS/i.test(ua) && !/FxiOS/i.test(ua);
    if (iOS && !isStandalone && !currentlyDismissed && isSafari) {
      setShowIOSPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isStandalone]);

  const handleAndroidInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
      setShowAndroidPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    // Dismiss prompt and remember timestamp for 7 days
    localStorage.setItem('cappuccino7_pwa_dismissed_at', Date.now().toString());
    setIsDismissed(true);
    setShowAndroidPrompt(false);
    setShowIOSPrompt(false);
    setShowIOSModal(false);
  };

  const handleForceReload = () => {
    window.location.reload();
  };

  const openIosGuideModal = () => {
    setShowIOSModal(true);
  };

  return (
    <>
      <div className="fixed bottom-24 left-4 right-4 z-[90] max-w-md mx-auto space-y-3 pointer-events-none">
        <AnimatePresence>
          {/* Offline Status Indicator */}
          {!isOnline && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-amber-950/95 backdrop-blur-xl border border-amber-600/30 text-amber-200 px-5 py-4 rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] flex items-center justify-between gap-4 pointer-events-auto"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500">
                  <WifiOff size={20} className="animate-pulse" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-wider text-amber-500">Browsing Offline</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">Cappuccino7 cached menu + prices are loaded successfully.</p>
                </div>
              </div>
              <button 
                onClick={handleForceReload}
                className="p-2 hover:bg-white/5 rounded-xl text-amber-500 transition-colors"
                title="Try reconnecting"
              >
                <RefreshCw size={14} />
              </button>
            </motion.div>
          )}

          {/* Android Native Install Prompt Banner */}
          {showAndroidPrompt && !isDismissed && !isStandalone && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="bg-stone-900/95 backdrop-blur-xl border border-bento-card-border p-5 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col gap-4 pointer-events-auto"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2.5 shadow-md flex-shrink-0">
                    <Coffee className="text-amber-600 w-full h-full animate-bounce" strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-black text-white tracking-tight uppercase leading-none">Install Cappuccino7</h4>
                    <p className="text-[10px] text-stone-400 mt-2 leading-relaxed">Add Cappuccino7 to your home screen for instant ordering, faster performance, and offline access.</p>
                  </div>
                </div>
                <button 
                  onClick={handleDismiss}
                  className="p-1.5 hover:bg-white/5 text-stone-500 hover:text-white rounded-xl transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest bg-stone-800 text-stone-300 rounded-xl hover:bg-stone-750 active:scale-95 transition-all text-center"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleAndroidInstallClick}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-stone-900 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={12} strokeWidth={2.5} />
                  Install App
                </button>
              </div>
            </motion.div>
          )}

          {/* iOS / iPhone Install App Button Banner */}
          {showIOSPrompt && !isDismissed && !isStandalone && !showIOSModal && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="bg-stone-900/95 backdrop-blur-xl border border-bento-card-border p-5 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col gap-4 pointer-events-auto"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2.5 shadow-md flex-shrink-0">
                    <Coffee className="text-amber-600 w-full h-full" strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-black text-white tracking-tight uppercase leading-none text-amber-500">Install Cappuccino7</h4>
                    <p className="text-[10px] text-stone-400 mt-2 leading-relaxed">Enjoy high-speed barista service and instant coffee pickups straight from your iPhone.</p>
                  </div>
                </div>
                <button 
                  onClick={handleDismiss}
                  className="p-1.5 hover:bg-white/5 text-stone-500 hover:text-white rounded-xl transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest bg-stone-800 text-stone-300 rounded-xl hover:bg-stone-750 active:scale-95 transition-all text-center"
                >
                  Maybe Later
                </button>
                <button
                  onClick={openIosGuideModal}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-stone-900 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Smartphone size={12} strokeWidth={2.5} />
                  Install App
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* iPhone Safari Custom Guide Modal Banner */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-stone-900 border border-bento-card-border p-6 rounded-[2.5rem] w-full max-w-sm shadow-[0_45px_100px_rgba(0,0,0,0.8)] relative text-center"
            >
              <button 
                onClick={() => setShowIOSModal(false)}
                className="absolute top-5 right-5 p-2 hover:bg-white/5 text-stone-400 hover:text-white rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <div className="w-16 h-16 bg-white/10 text-amber-400 rounded-[2rem] flex items-center justify-center mx-auto mb-5 border border-white/5">
                <Coffee size={32} strokeWidth={1.5} />
              </div>

              <h3 className="text-lg font-black text-white tracking-tight uppercase">Install Cappuccino7</h3>
              <p className="text-xs text-stone-400 mt-2 px-1 leading-relaxed">
                To install Cappuccino7 on iPhone, follow these quick steps.
              </p>

              {/* Steps grid */}
              <div className="mt-6 space-y-4 text-left">
                {/* Step 1 */}
                <div className="flex gap-4 items-center bg-stone-850 p-3.5 rounded-2xl border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Share size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block leading-none mb-1">Step 1</span>
                    <span className="text-xs text-stone-300 leading-tight">
                      Tap the <span className="font-bold text-white">Share</span> button in Safari.
                    </span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 items-center bg-stone-850 p-3.5 rounded-2xl border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Plus size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block leading-none mb-1">Step 2</span>
                    <span className="text-xs text-stone-300 leading-tight">
                      Scroll down and tap <span className="font-bold text-white">"Add to Home Screen"</span>.
                    </span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 items-center bg-stone-850 p-3.5 rounded-2xl border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <ArrowUpRight size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block leading-none mb-1">Step 3</span>
                    <span className="text-xs text-stone-300 leading-tight">
                      Tap <span className="font-bold text-white">"Add"</span> in the top-right corner.
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-stone-900 rounded-2xl active:scale-95 transition-all"
                >
                  OK, Let's Do It
                </button>
                <button
                  onClick={handleDismiss}
                  className="w-full py-3.5 text-[9px] font-black uppercase tracking-widest text-stone-500 hover:text-stone-300 rounded-2xl transition-all"
                >
                  Maybe later (Dismiss for 7 days)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
