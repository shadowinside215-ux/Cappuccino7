import React from 'react';
import { Order } from '../types';
import { calculateDurationMins, formatDuration, formatServerTimestamp } from '../utils/timeTracker';
import { Clock, CheckCircle2, ArrowDown, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export const OrderTimestamps = ({ order, compact = false }: { order: Order, compact?: boolean }) => {
  const tCreated = formatServerTimestamp(order.createdAt);
  const tPaid = formatServerTimestamp(order.paymentConfirmedAt);
  const tKStart = formatServerTimestamp(order.kitchenStartedAt);
  const tBStart = formatServerTimestamp(order.barmanStartedAt);
  const tKReady = formatServerTimestamp(order.kitchenReadyAt);
  const tBReady = formatServerTimestamp(order.barmanReadyAt);
  const tDelivered = formatServerTimestamp(order.deliveredAt);
  const tCompleted = formatServerTimestamp(order.completedAt);

  const durToPay = calculateDurationMins(order.createdAt, order.paymentConfirmedAt);
  const durKPrep = calculateDurationMins(order.kitchenStartedAt, order.kitchenReadyAt);
  const durBPrep = calculateDurationMins(order.barmanStartedAt, order.barmanReadyAt);
  const durToDelivery = calculateDurationMins(order.readyAt || order.kitchenReadyAt || order.barmanReadyAt, order.deliveredAt);
  const durTotal = calculateDurationMins(order.createdAt, order.completedAt);

  const steps = [
    { label: 'Created', time: tCreated, delay: false },
    { label: 'Paid', time: tPaid, duration: durToPay, show: !!order.paymentConfirmedAt, delay: false },
    { label: 'Kitchen Prep', time: `${tKStart} - ${tKReady}`, duration: durKPrep, show: !!order.kitchenStartedAt || !!order.kitchenReadyAt, delay: durKPrep > 15 },
    { label: 'Bar Prep', time: `${tBStart} - ${tBReady}`, duration: durBPrep, show: !!order.barmanStartedAt || !!order.barmanReadyAt, delay: durBPrep > 15 },
    { label: 'Delivered', time: tDelivered, duration: durToDelivery, show: !!order.deliveredAt, delay: durToDelivery > 5 },
    { label: 'Completed', time: tCompleted, duration: durTotal, show: !!order.completedAt, delay: false, isTotal: true },
  ].filter(s => s.show || s.label === 'Created');

  if (compact) {
    return (
      <div className="flex flex-col gap-1 text-[10px]">
        {steps.map((s, i) => (
          <div key={i} className="flex justify-between items-center bg-stone-100 dark:bg-stone-800/50 rounded px-2 py-1">
            <span className="font-bold opacity-70">{s.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{s.time !== 'N/A' && s.time !== 'N/A - N/A' ? s.time : '-'}</span>
              {s.duration !== undefined && (
                <span className={`font-black ${s.delay ? 'text-red-500' : 'text-amber-500'}`}>
                  {s.duration > 0 ? formatDuration(s.duration) : ''}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-bento-card-bg border border-bento-card-border p-4 rounded-3xl mt-4">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-bento-ink/50 mb-4 flex items-center gap-2">
        <Clock size={14} /> Service Timeline
      </h4>
      <div className="relative border-l-2 border-amber-500/20 ml-2 space-y-4">
        {steps.map((s, i) => (
          <div key={i} className="relative pl-6">
            <div className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full ${s.isTotal ? 'bg-green-500' : 'bg-amber-500'}`} />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-bento-ink">{s.label}</p>
                <p className="text-[10px] font-mono text-stone-500">{s.time !== 'N/A' && s.time !== 'N/A - N/A' ? s.time : 'Waiting...'}</p>
              </div>
              {s.duration !== undefined && s.duration > 0 && (
                <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-md ${s.delay ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'}`}>
                  {s.delay && <AlertTriangle size={10} />}
                  {formatDuration(s.duration)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
