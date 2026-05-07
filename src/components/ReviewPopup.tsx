import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, ExternalLink, Clock } from 'lucide-react';
import { useBrandSettings } from '../lib/brand';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';

const POPUP_STORAGE_KEY = 'c7_review_popup_state';

interface PopupState {
  neverShow: boolean;
  lastShownAt: number;
  visitCount: number;
  totalTimeSpent: number; // in seconds
}

export default function ReviewPopup() {
  const { settings: brand } = useBrandSettings();
  const [isVisible, setIsVisible] = useState(false);
  const [state, setState] = useState<PopupState>(() => {
    const saved = localStorage.getItem(POPUP_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      neverShow: false,
      lastShownAt: 0,
      visitCount: 0,
      totalTimeSpent: 0
    };
  });

  // Track visits and time
  useEffect(() => {
    const newState = { ...state, visitCount: state.visitCount + 1 };
    localStorage.setItem(POPUP_STORAGE_KEY, JSON.stringify(newState));
    setState(newState);

    const timer = setInterval(() => {
      setState(prev => {
        const updated = { ...prev, totalTimeSpent: prev.totalTimeSpent + 10 };
        localStorage.setItem(POPUP_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  // Check conditions to show
  const checkConditions = (force = false) => {
    if (!brand.reviewPopupEnabled || state.neverShow) return;

    if (force) {
      setIsVisible(true);
      return;
    }

    const daysSinceLastShown = (Date.now() - state.lastShownAt) / (1000 * 60 * 60 * 24);
    const frequency = brand.reviewPopupFrequencyDays || 7;
    const lastOrderTimeStr = localStorage.getItem('review_trigger_order_completed');
    const lastOrderTime = lastOrderTimeStr ? parseInt(lastOrderTimeStr) : 0;
    const isRecentOrder = lastOrderTime > 0 && (Date.now() - lastOrderTime) < 60000; // Within 60 seconds

    // Conditions:
    // 1. Visit count >= 3 OR Total time spent >= 120 seconds (2 mins) 
    const meetsVisitCondition = state.visitCount >= 3 || state.totalTimeSpent >= 120;
    const meetsFrequencyCondition = daysSinceLastShown >= frequency;

    // Order priority: If they just ordered, we show it even if frequency hasn't met
    const orderPriorityShow = isRecentOrder;

    if (orderPriorityShow || (meetsVisitCondition && meetsFrequencyCondition)) {
      if (isRecentOrder) {
        localStorage.removeItem('review_trigger_order_completed');
      }
      setIsVisible(true);
    }
  };

  useEffect(() => {
    // Check on mount (delay a bit to avoid layout shift)
    const timeout = setTimeout(() => checkConditions(false), 2000);
    
    // Listen for custom order event
    const handleOrderCompleted = () => {
      console.log("ReviewPopup: Order completed event received");
      // Set visibility immediately for order confirmation
      checkConditions(true);
    };
    
    window.addEventListener('order_completed', handleOrderCompleted);
    window.addEventListener('popstate', () => checkConditions(false)); // Check on navigation too
    
    return () => {
      window.removeEventListener('order_completed', handleOrderCompleted);
      window.removeEventListener('popstate', () => checkConditions(false));
      clearTimeout(timeout);
    };
  }, [brand, state]);

  const handleRateNow = async () => {
    setIsVisible(false);
    const newState = { ...state, lastShownAt: Date.now() };
    localStorage.setItem(POPUP_STORAGE_KEY, JSON.stringify(newState));
    setState(newState);

    // Increment click count in Firestore
    try {
      const brandRef = doc(db, 'settings', 'brand');
      await updateDoc(brandRef, {
        reviewPopupStatsClicks: increment(1)
      });
    } catch (e) {
      console.error('Error updating review stats:', e);
    }

    // Open Google Maps
    const mapsLink = brand.googleMapsLink || 'https://www.google.com/maps/search/?api=1&query=Cappuccino7+Sale+El+Jadida';
    window.open(mapsLink, '_blank');
  };

  const handleLater = () => {
    setIsVisible(false);
    // Just update lastShownAt to current time so it follows frequency
    const newState = { ...state, lastShownAt: Date.now() };
    localStorage.setItem(POPUP_STORAGE_KEY, JSON.stringify(newState));
    setState(newState);
  };

  const handleNeverAgain = () => {
    setIsVisible(false);
    const newState = { ...state, neverShow: true };
    localStorage.setItem(POPUP_STORAGE_KEY, JSON.stringify(newState));
    setState(newState);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          className="fixed bottom-24 sm:bottom-8 left-6 right-6 sm:left-auto sm:right-8 sm:w-[380px] z-[100]"
        >
          <div className="bg-stone-50 dark:bg-stone-900 rounded-[2.5rem] p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border border-stone-200 dark:border-white/5 relative overflow-hidden group">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icon */}
              <div className="w-16 h-16 rounded-[1.5rem] bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center relative shadow-inner">
                <Star className="w-8 h-8 text-amber-600 fill-amber-600" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border-4 border-stone-50 dark:border-stone-900" 
                />
              </div>

              {/* Text */}
              <div className="space-y-2">
                <h3 className="text-xl font-black text-stone-900 dark:text-stone-50 tracking-tight">
                  {brand.reviewPopupTitle || 'Enjoying Cappuccino7?'}
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 font-medium px-4">
                  {brand.reviewPopupSubtitle || 'Your support helps us grow. Leave us a quick 5-star review on Google Maps.'}
                </p>
              </div>

              {/* Buttons */}
              <div className="w-full space-y-3">
                <button 
                  onClick={handleRateNow}
                  className="w-full py-4 bg-amber-900 dark:bg-amber-100 text-stone-50 dark:text-amber-950 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-amber-900/20"
                >
                  Rate us now <ExternalLink size={14} />
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleLater}
                    className="py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                  >
                    Later
                  </button>
                  <button 
                    onClick={handleNeverAgain}
                    className="py-3 bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                  >
                    Don't show
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
