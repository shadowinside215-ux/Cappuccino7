import fs from 'fs';
let orderTs = fs.readFileSync('src/components/OrderTimestamps.tsx', 'utf8');

orderTs = orderTs.replace(
  /import \{ calculateDurationSeconds, formatDurationSecondsSeconds, formatServerTimestampExactExact \} from '\.\.\/utils\/timeTracker';/,
  "import { calculateDurationSeconds, formatDurationSeconds, formatServerTimestampExact } from '../utils/timeTracker';"
);

fs.writeFileSync('src/components/OrderTimestamps.tsx', orderTs);
