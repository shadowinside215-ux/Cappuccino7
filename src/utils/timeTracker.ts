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


export function calculateDurationSeconds(start: any, end: any): number {
  if (!start || !end) return 0;
  let s: Date, e: Date;
  if (typeof start.toDate === 'function') s = start.toDate();
  else s = new Date(start);
  
  if (typeof end.toDate === 'function') e = end.toDate();
  else e = new Date(end);
  
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
  
  return Math.round((e.getTime() - s.getTime()) / 1000);
}

export function formatDurationSeconds(secs: number): string {
  if (secs < 0) return '0s';
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m < 60) return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  const h = Math.floor(m / 60);
  const leftM = m % 60;
  return `${h}h ${leftM}m ${s < 10 ? '0' : ''}${s}s`;
}

export function formatServerTimestampExact(ts: any): string {
  if (!ts) return 'N/A';
  let d: Date;
  if (typeof ts.toDate === 'function') d = ts.toDate();
  else d = new Date(ts);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Africa/Casablanca' });
}
