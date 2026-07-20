import fs from 'fs';
let content = fs.readFileSync('src/lib/stats.ts', 'utf8');

content = content.replace(
  /const monthId = format\(startOfMonth\(now\), 'yyyy-MM'\);/,
  "const monthId = format(startOfMonth(now), 'yyyy-MM');\n    const yearId = format(now, 'yyyy');"
);

content = content.replace(
  /\/\/ 4\. Update Monthly Stats \(requested explicitly\)[\s\S]*?\}, \{ merge: true \}\);/,
  `// 4. Update Monthly Stats (requested explicitly)
    const monthlyRef = doc(db, 'monthlyRevenue', monthId);
    batch.set(monthlyRef, {
      amount: increment(revenueInc),
      orderCount: increment(1),
      rewardsClaimed: increment(rewardInc),
      rewardValue: increment(rewardValueInc),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // 4.5 Update Yearly Stats
    const yearlyRef = doc(db, 'yearlyRevenue', yearId);
    batch.set(yearlyRef, {
      amount: increment(revenueInc),
      orderCount: increment(1),
      rewardsClaimed: increment(rewardInc),
      rewardValue: increment(rewardValueInc),
      lastUpdated: serverTimestamp()
    }, { merge: true });`
);

fs.writeFileSync('src/lib/stats.ts', content);
