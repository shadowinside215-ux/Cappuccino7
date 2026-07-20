import fs from 'fs';

let content = fs.readFileSync('src/utils/timeTracker.ts', 'utf8');
content += `

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
  if (secs < 60) return \`\${secs}s\`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m < 60) return \`\${m}m \${s < 10 ? '0' : ''}\${s}s\`;
  const h = Math.floor(m / 60);
  const leftM = m % 60;
  return \`\${h}h \${leftM}m \${s < 10 ? '0' : ''}\${s}s\`;
}

export function formatServerTimestampExact(ts: any): string {
  if (!ts) return 'N/A';
  let d: Date;
  if (typeof ts.toDate === 'function') d = ts.toDate();
  else d = new Date(ts);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Africa/Casablanca' });
}
`;
fs.writeFileSync('src/utils/timeTracker.ts', content);

let orderTs = fs.readFileSync('src/components/OrderTimestamps.tsx', 'utf8');

orderTs = orderTs.replace(
  /import \{ calculateDurationMins, formatDuration, formatServerTimestamp \} from '\.\.\/utils\/timeTracker';/,
  "import { calculateDurationSeconds, formatDurationSeconds, formatServerTimestampExact } from '../utils/timeTracker';"
);

orderTs = orderTs.replace(/formatServerTimestamp/g, 'formatServerTimestampExact');
orderTs = orderTs.replace(/calculateDurationMins/g, 'calculateDurationSeconds');
orderTs = orderTs.replace(/formatDuration/g, 'formatDurationSeconds');
// adjust delay threshold
orderTs = orderTs.replace(/delay: durKPrep > 15/g, 'delay: durKPrep > 900');
orderTs = orderTs.replace(/delay: durBPrep > 15/g, 'delay: durBPrep > 900');
orderTs = orderTs.replace(/delay: durToDelivery > 5/g, 'delay: durToDelivery > 300');

fs.writeFileSync('src/components/OrderTimestamps.tsx', orderTs);
