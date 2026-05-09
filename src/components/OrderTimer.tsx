import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Timer } from 'lucide-react';
import { OrderStatus } from '../types';

interface OrderTimerProps {
  createdAt: any;
  prepTime: number;
  status: OrderStatus;
  variant?: 'admin' | 'client';
}

export function OrderTimer({ createdAt, prepTime, status, variant = 'admin' }: OrderTimerProps) {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const driftRef = React.useRef<number | null>(null);

  useEffect(() => {
    const calculateTimes = () => {
      const now = Date.now();
      
      let createdDate: Date | null = null;
      if (createdAt) {
        if (typeof createdAt.toDate === 'function') {
          createdDate = createdAt.toDate();
        } else if (createdAt instanceof Date) {
          createdDate = createdAt;
        } else if (typeof createdAt === 'object' && createdAt.seconds) {
          createdDate = new Date(createdAt.seconds * 1000);
        } else {
          createdDate = new Date(createdAt);
        }
      }
      
      if (!createdDate || isNaN(createdDate.getTime())) return;

      // Handle Clock Drift
      // Reference: If server 'createdAt' is in the future compared to client 'now', 
      // we need to adjust our perception of 'now' to match server time.
      if (driftRef.current === null) {
        driftRef.current = createdDate.getTime() - now;
      }

      const adjustedNow = now + driftRef.current;
      const diffSecs = Math.floor((adjustedNow - createdDate.getTime()) / 1000);
      setElapsed(diffSecs);

      const durationMins = prepTime || 30;
      const isActive = status !== 'delivered' && status !== 'cancelled' && (variant === 'client' ? status !== 'ready' : true);
      
      if (isActive) {
        const targetDate = new Date(createdDate.getTime() + durationMins * 60000);
        let diff = Math.floor((targetDate.getTime() - adjustedNow) / 1000);
        setTimeLeft(diff);
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimes();
    const interval = setInterval(calculateTimes, 1000);
    return () => clearInterval(interval);
  }, [createdAt, prepTime, status, variant]);

  const formatSecs = (totalSecs: number) => {
    const absSecs = Math.abs(totalSecs);
    const mins = Math.floor(absSecs / 60);
    const secs = absSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (variant === 'client') {
    if (timeLeft === null) return null;
    const durationSecs = (prepTime || 30) * 60;
    const isOverdue = timeLeft <= 0;
    const isOrange = !isOverdue && timeLeft <= durationSecs * 0.2;
    const absTime = Math.abs(timeLeft);
    const mins = Math.floor(absTime / 60);
    const secs = absTime % 60;
    const displayTime = `${mins}:${secs.toString().padStart(2, '0')}`;
    const styles = isOverdue 
      ? 'bg-red-500/10 border-red-500/20 text-red-400' 
      : isOrange 
        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
        : 'bg-white/5 border-white/10 text-green-400';

    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border animate-in fade-in zoom-in duration-500 transition-colors ${styles}`}>
        <Timer size={14} className={isOverdue ? 'animate-pulse' : ''} />
        <span className="text-[10px] font-black uppercase tracking-widest leading-none tabular-nums">
          {isOverdue ? t('ready_soon', 'Ready Soon') : `${t('ready_in', 'Ready in')} ${displayTime}`}
        </span>
      </div>
    );
  }

  const isActive = status !== 'delivered' && status !== 'cancelled';
  const durationSecs = (prepTime || 30) * 60;
  const isOverdue = timeLeft !== null && timeLeft <= 0;
  const isOrange = !isOverdue && timeLeft !== null && timeLeft <= durationSecs * 0.2;

  const getTimerStyles = () => {
    if (!isActive) return 'bg-amber-100 text-amber-700';
    if (isOverdue) return 'bg-red-500 text-white shadow-lg shadow-red-500/20';
    if (isOrange) return 'bg-amber-500 text-white shadow-lg shadow-amber-500/20';
    return 'bg-stone-900 text-white shadow-lg shadow-stone-900/20';
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${getTimerStyles()}`}>
       <Clock size={12} className={isActive && isOverdue ? 'animate-pulse' : (isActive ? 'text-white' : 'text-amber-400')} />
       <span className="tabular-nums">
         {isActive 
          ? (timeLeft !== null ? `${isOverdue ? '-' : ''}${formatSecs(timeLeft)} ${t('waiting').toUpperCase()}` : '--:--') 
          : `${formatSecs(elapsed)} ${t('total_duration').toUpperCase()}`}
       </span>
    </div>
  );
}
