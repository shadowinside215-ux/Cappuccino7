export function calculateDurationMins(start: any, end: any): number {
  if (!start || !end) return 0;
  let s: Date, e: Date;
  if (typeof start.toDate === 'function') s = start.toDate();
  else s = new Date(start);
  
  if (typeof end.toDate === 'function') e = end.toDate();
  else e = new Date(end);

  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
  
  return Math.round((e.getTime() - s.getTime()) / 60000);
}

export function formatDuration(mins: number): string {
  if (mins < 0) return '0m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export function formatServerTimestamp(ts: any): string {
  if (!ts) return 'N/A';
  let d: Date;
  if (typeof ts.toDate === 'function') d = ts.toDate();
  else d = new Date(ts);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Casablanca' });
}
