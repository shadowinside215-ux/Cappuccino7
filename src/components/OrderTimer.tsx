import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Timer } from 'lucide-react';
import { OrderStatus } from '../types';

interface OrderTimerProps {
  createdAt: any;
  prepTime: number;
  status: OrderStatus;
  variant?: 'admin' | 'client';
  expectedReadyAt?: any;
}

export function OrderTimer({ createdAt, prepTime, status, variant = 'admin', expectedReadyAt }: OrderTimerProps) {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());
  const [firstSeen] = useState(Date.now()); // Stable fallback for when createdAt is null

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getReferenceDate = () => {
    if (createdAt) {
      if (typeof createdAt.toDate === 'function') return createdAt.toDate();
      if (createdAt instanceof Date) return createdAt;
      if (typeof createdAt === 'object' && createdAt.seconds) return new Date(createdAt.seconds * 1000);
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date(firstSeen);
  };

  const referenceDate = getReferenceDate();
  const durationMins = prepTime || (variant === 'admin' ? 30 : 10);
  const isCurrentlyActive = status !== 'delivered' && status !== 'cancelled' && (variant === 'client' ? status !== 'ready' : true);
  const elapsedSecs = Math.floor((now - referenceDate.getTime()) / 1000);
  const elapsed = elapsedSecs < 0 ? 0 : elapsedSecs;

  let timeLeft: number | null = null;
  if (isCurrentlyActive) {
    let targetMs: number;
    if (expectedReadyAt) {
      if (typeof expectedReadyAt.toDate === 'function') targetMs = expectedReadyAt.toDate().getTime();
      else if (expectedReadyAt instanceof Date) targetMs = expectedReadyAt.getTime();
      else if (typeof expectedReadyAt === 'object' && expectedReadyAt.seconds) targetMs = expectedReadyAt.seconds * 1000;
      else targetMs = new Date(expectedReadyAt).getTime();
    } else {
      targetMs = referenceDate.getTime() + (durationMins * 60000);
    }
    timeLeft = Math.floor((targetMs - now) / 1000);
  }

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
          {isOverdue ? t('ready_time_reached', 'Ready time reached') : `${t('ready_in', 'Ready in')} ${displayTime}`}
        </span>
      </div>
    );
  }

  const isOrderActive = status !== 'delivered' && status !== 'cancelled';
  const durationSecs = (prepTime || 30) * 60;
  const isOverdue = timeLeft !== null && timeLeft <= 0;
  const isOrange = !isOverdue && timeLeft !== null && timeLeft <= durationSecs * 0.2;

  const getTimerStyles = () => {
    if (!isOrderActive) return 'bg-amber-100 text-amber-700';
    if (isOverdue) return 'bg-red-500 text-white shadow-lg shadow-red-500/20';
    if (isOrange) return 'bg-amber-500 text-white shadow-lg shadow-amber-500/20';
    return 'bg-stone-900 text-white shadow-lg shadow-stone-900/20';
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${getTimerStyles()}`}>
       <Clock size={12} className={isOrderActive && isOverdue ? 'animate-pulse' : (isOrderActive ? 'text-white' : 'text-amber-400')} />
       <span className="tabular-nums">
         {isOrderActive 
          ? (timeLeft !== null ? `${isOverdue ? (t('overdue', 'OVERDUE') + ' ') : ''}${formatSecs(timeLeft)} ${t('waiting').toUpperCase()}` : '--:--') 
          : `${formatSecs(elapsed)} ${t('total_duration').toUpperCase()}`}
       </span>
    </div>
  );
}
