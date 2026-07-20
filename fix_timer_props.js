import fs from 'fs';
let content = fs.readFileSync('src/components/OrderTimer.tsx', 'utf8');

content = content.replace(
  /export function OrderTimer\(\{ createdAt, prepTime, status, variant = 'admin', expectedReadyAt \}: OrderTimerProps\) \{/,
  "export function OrderTimer({ createdAt, prepTime, status, variant = 'admin', expectedReadyAt, completedAt, readyAt }: OrderTimerProps) {"
);

content = content.replace(
  /expectedReadyAt\?: any;/,
  "expectedReadyAt?: any;\n  completedAt?: any;\n  readyAt?: any;"
);

content = content.replace(
  /const isOrderActive = status !== 'delivered' && status !== 'cancelled';/,
  "const isCompletedStatus = ['ready', 'delivered', 'Completed', 'Paid', 'cancelled'].includes(status);\n  const isOrderActive = !isCompletedStatus;"
);

content = content.replace(
  /const isCurrentlyActive = status !== 'delivered' && status !== 'cancelled' && \(variant === 'client' \? status !== 'ready' : true\);/,
  "const isCurrentlyActive = !['delivered', 'Completed', 'Paid', 'cancelled'].includes(status) && (variant === 'client' ? status !== 'ready' : status !== 'ready');"
);

// We need to fix `elapsedSecs`
content = content.replace(
  /const elapsedSecs = Math\.floor\(\(now - referenceDate\.getTime\(\)\) \/ 1000\);/,
  `const getEndTime = () => {
    const endTs = completedAt || readyAt;
    if (endTs && !isOrderActive) {
      if (typeof endTs.toDate === 'function') return endTs.toDate().getTime();
      if (endTs instanceof Date) return endTs.getTime();
      if (typeof endTs === 'object' && endTs.seconds) return endTs.seconds * 1000;
      const d = new Date(endTs);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    return now;
  };
  const elapsedSecs = Math.floor((getEndTime() - referenceDate.getTime()) / 1000);`
);

fs.writeFileSync('src/components/OrderTimer.tsx', content);
